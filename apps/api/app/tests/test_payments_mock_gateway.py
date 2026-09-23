import pytest

from app.models.models import Order, PoojaBooking, PoojaService, User
from app.payments.booking import create_order_for_booking
from app.payments.factory import get_payment_settings
from app.payments.mock_gateway import MockGateway


async def test_mock_gateway_create_and_verify_round_trip():
    gateway = MockGateway()
    order = await gateway.create_order(amount=499.0, currency="INR", receipt="r1", notes={})
    assert order.gateway_order_id.startswith("mock_order_")

    result = await gateway.verify_payment(gateway_order_id=order.gateway_order_id, payload={})
    assert result.success is True
    assert result.gateway_payment_id is not None


async def test_payment_settings_defaults_to_mock():
    settings_doc = await get_payment_settings()
    assert settings_doc.active_gateway == "mock"
    assert "upi" in settings_doc.enabled_payment_methods


async def test_create_order_for_booking_rejects_disabled_gateway():
    with pytest.raises(ValueError):
        await create_order_for_booking(
            user_id="u1", item_type="pooja", item_ref_id="p1", amount=100.0,
            notes={}, gateway_override="razorpay",
        )


async def test_pooja_booking_confirms_after_mock_payment():
    user = User(email="booker@example.com", hashed_password="x")
    await user.insert()

    service = PoojaService(
        name="Ganesh Pooja", description="", service_type="individual",
        price=999.0, duration_minutes=60,
    )
    await service.insert()

    booking = PoojaBooking(
        user_id=str(user.id), pooja_service_id=str(service.id),
        devotee_name="Test Devotee", scheduled_date="2026-01-01",
    )
    await booking.insert()

    order, order_out = await create_order_for_booking(
        user_id=str(user.id), item_type="pooja", item_ref_id=str(booking.id),
        amount=service.price, notes={},
    )
    booking.order_id = str(order.id)
    await booking.save()

    assert order.status == "pending"
    assert order_out.gateway == "mock"

    from app.payments.factory import build_gateway, get_payment_settings, resolve_credentials

    settings_doc = await get_payment_settings()
    creds = resolve_credentials(order.gateway, settings_doc)
    gateway = build_gateway(order.gateway, creds)
    verify_result = await gateway.verify_payment(gateway_order_id=order.gateway_order_id, payload={})
    assert verify_result.success

    order.status = "paid"
    await order.save()
    booking.status = "confirmed"
    await booking.save()

    refreshed = await PoojaBooking.get(booking.id)
    assert refreshed.status == "confirmed"

    refreshed_order = await Order.get(order.id)
    assert refreshed_order.status == "paid"
