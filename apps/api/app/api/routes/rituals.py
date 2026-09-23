from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import RitualBooking, RitualService, User
from app.payments.base import PaymentGatewayError
from app.payments.booking import create_order_for_booking
from app.payments.factory import build_gateway, get_payment_settings, resolve_credentials
from app.schemas.schemas import RitualBookingCreate, RitualBookingOut, RitualServiceOut, SubscriptionEnableOut

router = APIRouter(prefix="/rituals", tags=["rituals"])


def _service_out(s: RitualService) -> RitualServiceOut:
    return RitualServiceOut(
        id=str(s.id), name=s.name, description=s.description,
        price_min=s.price_min, price_max=s.price_max,
    )


def _booking_out(b: RitualBooking, order_out=None) -> RitualBookingOut:
    return RitualBookingOut(
        id=str(b.id), ritual_service_id=b.ritual_service_id, intention_text=b.intention_text,
        agreed_price=b.agreed_price, weekly=b.weekly, status=b.status,
        next_candle_date=b.next_candle_date, billing_mode=b.billing_mode,
        subscription_status=b.subscription_status, order=order_out,
    )


@router.get("", response_model=list[RitualServiceOut])
async def list_rituals():
    services = await RitualService.find({"is_active": True}).to_list()
    return [_service_out(s) for s in services]


@router.get("/{service_id}", response_model=RitualServiceOut)
async def get_ritual(service_id: str):
    service = await RitualService.get(service_id)
    if service is None or not service.is_active:
        raise HTTPException(status_code=404, detail="Ritual service not found")
    return _service_out(service)


@router.post("/book", response_model=RitualBookingOut)
async def book_ritual(payload: RitualBookingCreate, user: User = Depends(get_current_user)):
    service = await RitualService.get(payload.ritual_service_id)
    if service is None or not service.is_active:
        raise HTTPException(status_code=404, detail="Ritual service not found")
    if not (service.price_min <= payload.agreed_price <= service.price_max):
        raise HTTPException(
            status_code=400,
            detail=f"agreed_price must be between {service.price_min} and {service.price_max}",
        )

    booking = RitualBooking(
        user_id=str(user.id),
        ritual_service_id=payload.ritual_service_id,
        intention_text=payload.intention_text,
        agreed_price=payload.agreed_price,
        next_candle_date=date.today() + timedelta(weeks=1),
    )
    await booking.insert()

    try:
        order, order_out = await create_order_for_booking(
            user_id=str(user.id), item_type="ritual", item_ref_id=str(booking.id),
            amount=payload.agreed_price, notes={"product_info": service.name, "email": user.email},
            gateway_override=payload.gateway,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    booking.order_id = str(order.id)
    await booking.save()

    return _booking_out(booking, order_out)


@router.get("/bookings/{booking_id}", response_model=RitualBookingOut)
async def get_ritual_booking(booking_id: str, user: User = Depends(get_current_user)):
    booking = await RitualBooking.get(booking_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_out(booking)


@router.post("/bookings/{booking_id}/renew", response_model=RitualBookingOut)
async def renew_ritual_booking(booking_id: str, user: User = Depends(get_current_user)):
    """Pay for the next week's candle — MVP recurring model: one order per
    cycle, not a gateway auto-debit subscription (see plan notes)."""
    booking = await RitualBooking.get(booking_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "active":
        raise HTTPException(status_code=400, detail="Only active rituals can be renewed")

    try:
        order, order_out = await create_order_for_booking(
            user_id=str(user.id), item_type="ritual", item_ref_id=str(booking.id),
            amount=booking.agreed_price, notes={"renewal": "true"},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    booking.order_id = str(order.id)
    booking.next_candle_date = (booking.next_candle_date or date.today()) + timedelta(weeks=1)
    await booking.save()

    return _booking_out(booking, order_out)


@router.post("/bookings/{booking_id}/enable-auto-renew", response_model=SubscriptionEnableOut)
async def enable_auto_renew(booking_id: str, user: User = Depends(get_current_user)):
    """Switch from the manual weekly-renew MVP to a real gateway
    subscription — only Razorpay and Stripe support this (see each
    gateway's `supports_subscriptions`); Mock also supports it for testing."""
    booking = await RitualBooking.get(booking_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "active":
        raise HTTPException(status_code=400, detail="Only active rituals can enable auto-renew")

    settings_doc = await get_payment_settings()
    creds = resolve_credentials(settings_doc.active_gateway, settings_doc)
    gateway = build_gateway(settings_doc.active_gateway, creds)

    if not gateway.supports_subscriptions:
        raise HTTPException(
            status_code=400,
            detail=f"{settings_doc.active_gateway} does not support auto-recurring billing — use manual weekly renew instead",
        )

    try:
        result = await gateway.create_subscription(
            amount=booking.agreed_price, currency="INR", interval_days=7,
            notes={"product_info": "Vidushiji.ai ritual", "email": user.email, "ritual_booking_id": booking_id},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    booking.billing_mode = "auto"
    booking.gateway_subscription_id = result.gateway_subscription_id
    booking.subscription_status = "created"
    await booking.save()

    return SubscriptionEnableOut(
        gateway=settings_doc.active_gateway,
        gateway_subscription_id=result.gateway_subscription_id,
        client_config=result.client_config,
    )


@router.post("/bookings/{booking_id}/confirm-subscription", response_model=RitualBookingOut)
async def confirm_subscription(booking_id: str, user: User = Depends(get_current_user)):
    """Frontend calls this once the user has completed the subscription
    checkout widget, so the booking reflects an active subscription even
    before the first webhook charge event arrives."""
    booking = await RitualBooking.get(booking_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.billing_mode != "auto" or not booking.gateway_subscription_id:
        raise HTTPException(status_code=400, detail="Auto-renew was not enabled for this booking")

    booking.subscription_status = "active"
    await booking.save()
    return _booking_out(booking)
