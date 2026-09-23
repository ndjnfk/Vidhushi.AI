from datetime import date, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.deps import get_current_user
from app.models.models import (
    ConsultationBooking,
    Order,
    PoojaBooking,
    Product,
    RitualBooking,
    RitualCharge,
    ShopOrder,
    User,
    Vendor,
)
from app.payments.base import WebhookEvent
from app.payments.factory import build_gateway, get_payment_settings, resolve_credentials
from app.schemas.schemas import PaymentSettingsOut, PaymentVerifyIn, PaymentVerifyOut

router = APIRouter(prefix="/payments", tags=["payments"])

_BOOKING_MODEL = {
    "pooja": PoojaBooking,
    "ritual": RitualBooking,
    "consultation": ConsultationBooking,
    "shop": ShopOrder,
}

_CONFIRMED_STATUS = {"pooja": "confirmed", "shop": "confirmed", "ritual": "active", "consultation": "active"}


@router.get("/gateways", response_model=PaymentSettingsOut)
async def get_enabled_gateway():
    """Public: tells the frontend which single gateway + payment methods the
    admin currently has active, so checkout only ever offers that — nothing
    the admin hasn't turned on is ever shown to a user."""
    settings_doc = await get_payment_settings()
    return PaymentSettingsOut(
        active_gateway=settings_doc.active_gateway,
        enabled_payment_methods=settings_doc.enabled_payment_methods,
        configured_gateways=[settings_doc.active_gateway],
    )


@router.post("/verify", response_model=PaymentVerifyOut)
async def verify_payment(payload: PaymentVerifyIn, user: User = Depends(get_current_user)):
    order = await Order.get(payload.order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your order")
    if order.status == "paid":
        return PaymentVerifyOut(success=True, order_status=order.status)

    settings_doc = await get_payment_settings()
    creds = resolve_credentials(order.gateway, settings_doc)
    gateway = build_gateway(order.gateway, creds)

    try:
        result = await gateway.verify_payment(gateway_order_id=order.gateway_order_id, payload=payload.payload)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"{order.gateway} rejected verification ({e.response.status_code})")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach {order.gateway}: {e}")

    order.status = "paid" if result.success else "failed"
    order.gateway_payment_id = result.gateway_payment_id
    await _apply_vendor_payout(order)
    await order.save()

    if result.success:
        await _confirm_booking(order)

    return PaymentVerifyOut(success=result.success, order_status=order.status)


def _compute_vendor_payout(amount: float, vendor: Vendor) -> tuple[float, float]:
    commission = round(amount * vendor.commission_rate / 100, 2)
    payout = round(amount - commission, 2)
    return commission, payout


async def _apply_vendor_payout(order: Order) -> None:
    booking_model = _BOOKING_MODEL.get(order.item_type)
    if booking_model is None:
        return
    booking = await booking_model.get(order.item_ref_id)
    vendor_id = getattr(booking, "vendor_id", None) if booking else None
    if not vendor_id:
        return
    vendor = await Vendor.get(vendor_id)
    if vendor is None:
        return
    order.vendor_id = vendor_id
    order.platform_commission_amount, order.vendor_payout_amount = _compute_vendor_payout(order.amount, vendor)
    order.payout_status = "owed"


async def _confirm_booking(order: Order) -> None:
    booking_model = _BOOKING_MODEL.get(order.item_type)
    if booking_model is None:
        return
    booking = await booking_model.get(order.item_ref_id)
    if booking is None:
        return
    booking.status = _CONFIRMED_STATUS.get(order.item_type, "active")
    await booking.save()

    if order.item_type == "shop":
        await _decrement_stock(booking)


async def _decrement_stock(shop_order: ShopOrder) -> None:
    for item in shop_order.items:
        product = await Product.get(item.product_id)
        if product is None:
            continue
        product.stock_quantity = max(0, product.stock_quantity - item.quantity)
        await product.save()


async def process_subscription_event(*, gateway_name: str, event: WebhookEvent) -> dict:
    """The gateway-agnostic half of webhook handling — everything gateway-
    specific (signature check, payload shape) already happened in
    `gateway.verify_and_parse_webhook`. Split out from the route so it can
    be unit-tested directly with a synthetic WebhookEvent, without needing
    a live webhook call."""
    if not event.gateway_subscription_id:
        return {"processed": False, "reason": "no subscription id in event"}

    booking = await RitualBooking.find_one({"gateway_subscription_id": event.gateway_subscription_id})
    if booking is None:
        return {"processed": False, "reason": "unknown subscription"}

    if event.event_type == "subscription.charged":
        amount = event.amount if event.amount is not None else booking.agreed_price

        order = Order(
            user_id=booking.user_id, item_type="ritual", item_ref_id=str(booking.id),
            amount=amount, currency="INR", gateway=gateway_name,
            gateway_order_id=event.gateway_subscription_id, gateway_payment_id=event.gateway_payment_id,
            status="paid",
        )
        if booking.vendor_id:
            vendor = await Vendor.get(booking.vendor_id)
            if vendor is not None:
                order.vendor_id = booking.vendor_id
                order.platform_commission_amount, order.vendor_payout_amount = _compute_vendor_payout(amount, vendor)
                order.payout_status = "owed"
        await order.insert()

        await RitualCharge(
            ritual_booking_id=str(booking.id), gateway_subscription_id=event.gateway_subscription_id,
            gateway_payment_id=event.gateway_payment_id, amount=amount, order_id=str(order.id),
        ).insert()

        booking.status = "active"
        booking.subscription_status = "active"
        booking.order_id = str(order.id)
        booking.next_candle_date = (booking.next_candle_date or date.today()) + timedelta(weeks=1)
        await booking.save()
        return {"processed": True, "booking_id": str(booking.id), "order_id": str(order.id)}

    if event.event_type == "subscription.cancelled":
        booking.subscription_status = "cancelled"
        booking.status = "cancelled"
        await booking.save()
        return {"processed": True, "booking_id": str(booking.id)}

    if event.event_type == "subscription.completed":
        booking.subscription_status = "completed"
        booking.status = "completed"
        await booking.save()
        return {"processed": True, "booking_id": str(booking.id)}

    return {"processed": False, "reason": f"unhandled event type: {event.event_type}"}


@router.post("/webhook/{gateway}")
async def payment_webhook(gateway: str, request: Request):
    """Real gateways POST recurring-billing events here (subscription
    charged/cancelled/completed). Needs a public HTTPS URL to receive real
    traffic — not exercisable on localhost without a tunnel (e.g. ngrok);
    `process_subscription_event` above is unit-tested directly instead."""
    settings_doc = await get_payment_settings()
    creds = resolve_credentials(gateway, settings_doc)
    gateway_obj = build_gateway(gateway, creds)

    body = await request.body()
    try:
        event = gateway_obj.verify_and_parse_webhook(payload=body, headers=dict(request.headers))
    except (PermissionError, NotImplementedError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await process_subscription_event(gateway_name=gateway, event=event)
    return {"received": True, "gateway": gateway, **result}
