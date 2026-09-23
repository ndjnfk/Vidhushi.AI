from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import PoojaBooking, PoojaService, User
from app.payments.base import PaymentGatewayError
from app.payments.booking import create_order_for_booking
from app.schemas.schemas import PoojaBookingCreate, PoojaBookingOut, PoojaServiceOut

router = APIRouter(prefix="/poojas", tags=["poojas"])


def _service_out(s: PoojaService) -> PoojaServiceOut:
    return PoojaServiceOut(
        id=str(s.id), name=s.name, description=s.description,
        service_type=s.service_type, price=s.price, duration_minutes=s.duration_minutes,
    )


@router.get("", response_model=list[PoojaServiceOut])
async def list_poojas():
    services = await PoojaService.find({"is_active": True}).to_list()
    return [_service_out(s) for s in services]


@router.get("/{service_id}", response_model=PoojaServiceOut)
async def get_pooja(service_id: str):
    service = await PoojaService.get(service_id)
    if service is None or not service.is_active:
        raise HTTPException(status_code=404, detail="Pooja service not found")
    return _service_out(service)


@router.post("/book", response_model=PoojaBookingOut)
async def book_pooja(payload: PoojaBookingCreate, user: User = Depends(get_current_user)):
    service = await PoojaService.get(payload.pooja_service_id)
    if service is None or not service.is_active:
        raise HTTPException(status_code=404, detail="Pooja service not found")

    booking = PoojaBooking(
        user_id=str(user.id),
        pooja_service_id=payload.pooja_service_id,
        devotee_name=payload.devotee_name,
        gotra=payload.gotra,
        nakshatra=payload.nakshatra,
        scheduled_date=payload.scheduled_date,
    )
    await booking.insert()

    try:
        order, order_out = await create_order_for_booking(
            user_id=str(user.id), item_type="pooja", item_ref_id=str(booking.id),
            amount=service.price, notes={"product_info": service.name, "email": user.email},
            gateway_override=payload.gateway,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    booking.order_id = str(order.id)
    await booking.save()

    return PoojaBookingOut(
        id=str(booking.id), pooja_service_id=booking.pooja_service_id,
        devotee_name=booking.devotee_name, scheduled_date=booking.scheduled_date,
        status=booking.status, order=order_out,
    )


@router.get("/bookings/{booking_id}", response_model=PoojaBookingOut)
async def get_pooja_booking(booking_id: str, user: User = Depends(get_current_user)):
    booking = await PoojaBooking.get(booking_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return PoojaBookingOut(
        id=str(booking.id), pooja_service_id=booking.pooja_service_id,
        devotee_name=booking.devotee_name, scheduled_date=booking.scheduled_date,
        status=booking.status, order=None,
    )
