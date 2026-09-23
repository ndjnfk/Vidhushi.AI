import hashlib
import hmac
import json
from datetime import date, timedelta

from app.api.routes.payments import process_subscription_event
from app.models.models import Order, RitualBooking, RitualCharge, RitualService, User, Vendor
from app.payments.base import WebhookEvent
from app.payments.mock_gateway import MockGateway
from app.payments.razorpay_gateway import RazorpayGateway
from app.payments.stripe_gateway import StripeGateway


async def _make_booking(**overrides) -> RitualBooking:
    user = User(email="ritualuser@example.com", hashed_password="x")
    await user.insert()
    service = RitualService(name="Visa Ritual", description="d", price_min=1000, price_max=5000)
    await service.insert()

    defaults = dict(
        user_id=str(user.id), ritual_service_id=str(service.id), intention_text="visa",
        agreed_price=2500.0, status="active", billing_mode="auto",
        gateway_subscription_id="sub_test_123", subscription_status="active",
        next_candle_date=date.today() + timedelta(weeks=1),
    )
    defaults.update(overrides)
    booking = RitualBooking(**defaults)
    await booking.insert()
    return booking


# ---- Mock gateway subscription support ----

async def test_mock_gateway_create_subscription():
    gateway = MockGateway()
    result = await gateway.create_subscription(amount=2500.0, currency="INR", interval_days=7, notes={})
    assert result.gateway_subscription_id.startswith("mock_sub_")


def test_mock_gateway_parses_webhook_payload():
    gateway = MockGateway()
    payload = json.dumps({
        "event_type": "subscription.charged", "gateway_subscription_id": "sub_test_123", "amount": 2500.0,
    }).encode()
    event = gateway.verify_and_parse_webhook(payload=payload, headers={})
    assert event.event_type == "subscription.charged"
    assert event.gateway_subscription_id == "sub_test_123"
    assert event.amount == 2500.0


# ---- Razorpay webhook signature verification (pure, no network) ----

def test_razorpay_webhook_signature_valid():
    secret = "whsec_test"
    gateway = RazorpayGateway(key_id="k", key_secret="s", webhook_secret=secret)
    body = json.dumps({
        "event": "subscription.charged",
        "payload": {"subscription": {"entity": {"id": "sub_abc"}}, "payment": {"entity": {"id": "pay_xyz", "amount": 250000}}},
    }).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    event = gateway.verify_and_parse_webhook(payload=body, headers={"x-razorpay-signature": signature})
    assert event.event_type == "subscription.charged"
    assert event.gateway_subscription_id == "sub_abc"
    assert event.gateway_payment_id == "pay_xyz"
    assert event.amount == 2500.0


def test_razorpay_webhook_signature_tampered_rejected():
    gateway = RazorpayGateway(key_id="k", key_secret="s", webhook_secret="whsec_test")
    body = json.dumps({"event": "subscription.charged", "payload": {}}).encode()

    try:
        gateway.verify_and_parse_webhook(payload=body, headers={"x-razorpay-signature": "bad_signature"})
        assert False, "expected PermissionError"
    except PermissionError:
        pass


# ---- Stripe webhook signature verification (pure, no network) ----

def test_stripe_webhook_signature_valid():
    secret = "whsec_stripe_test"
    gateway = StripeGateway(secret_key="sk", publishable_key="pk", webhook_secret=secret)
    body = json.dumps({
        "type": "invoice.paid",
        "data": {"object": {"subscription": "sub_stripe_1", "payment_intent": "pi_1", "amount_paid": 250000}},
    }).encode()
    timestamp = "1700000000"
    signed_payload = f"{timestamp}.".encode() + body
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    event = gateway.verify_and_parse_webhook(payload=body, headers={"stripe-signature": f"t={timestamp},v1={signature}"})
    assert event.event_type == "subscription.charged"
    assert event.gateway_subscription_id == "sub_stripe_1"
    assert event.amount == 2500.0


def test_stripe_webhook_signature_tampered_rejected():
    gateway = StripeGateway(secret_key="sk", publishable_key="pk", webhook_secret="whsec_stripe_test")
    body = json.dumps({"type": "invoice.paid", "data": {"object": {}}}).encode()

    try:
        gateway.verify_and_parse_webhook(payload=body, headers={"stripe-signature": "t=123,v1=bad"})
        assert False, "expected PermissionError"
    except PermissionError:
        pass


# ---- process_subscription_event (gateway-agnostic charge processing) ----

async def test_subscription_charged_creates_order_and_advances_candle_date():
    booking = await _make_booking()
    original_next_date = booking.next_candle_date

    event = WebhookEvent(
        event_type="subscription.charged", gateway_subscription_id=booking.gateway_subscription_id,
        gateway_payment_id="pay_1", amount=2500.0,
    )
    result = await process_subscription_event(gateway_name="mock", event=event)
    assert result["processed"] is True

    refreshed = await RitualBooking.get(booking.id)
    assert refreshed.next_candle_date == original_next_date + timedelta(weeks=1)
    assert refreshed.status == "active"

    order = await Order.get(result["order_id"])
    assert order.status == "paid"
    assert order.amount == 2500.0
    assert order.item_type == "ritual"

    charges = await RitualCharge.find({"ritual_booking_id": str(booking.id)}).to_list()
    assert len(charges) == 1
    assert charges[0].amount == 2500.0


async def test_subscription_charge_applies_vendor_payout():
    vendor = Vendor(name="Ritual Specialist", vendor_type="ritual_specialist", contact_email="v@example.com", commission_rate=30.0)
    await vendor.insert()
    booking = await _make_booking(vendor_id=str(vendor.id))

    event = WebhookEvent(
        event_type="subscription.charged", gateway_subscription_id=booking.gateway_subscription_id,
        gateway_payment_id="pay_2", amount=2000.0,
    )
    result = await process_subscription_event(gateway_name="mock", event=event)

    order = await Order.get(result["order_id"])
    assert order.vendor_id == str(vendor.id)
    assert order.platform_commission_amount == 600.0  # 30% of 2000
    assert order.vendor_payout_amount == 1400.0
    assert order.payout_status == "owed"


async def test_subscription_cancelled_updates_booking_status():
    booking = await _make_booking()
    event = WebhookEvent(
        event_type="subscription.cancelled", gateway_subscription_id=booking.gateway_subscription_id,
        gateway_payment_id=None, amount=None,
    )
    result = await process_subscription_event(gateway_name="mock", event=event)
    assert result["processed"] is True

    refreshed = await RitualBooking.get(booking.id)
    assert refreshed.status == "cancelled"
    assert refreshed.subscription_status == "cancelled"


async def test_unknown_subscription_id_is_not_processed():
    event = WebhookEvent(
        event_type="subscription.charged", gateway_subscription_id="sub_does_not_exist",
        gateway_payment_id=None, amount=100.0,
    )
    result = await process_subscription_event(gateway_name="mock", event=event)
    assert result["processed"] is False
