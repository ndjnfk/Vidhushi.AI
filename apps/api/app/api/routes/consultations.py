from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import ConsultationBooking, ConsultationMessage, User, Vendor
from app.payments.base import PaymentGatewayError
from app.payments.booking import create_order_for_booking
from app.schemas.schemas import (
    ConsultationBookingOut,
    ConsultationMessageIn,
    ConsultationMessageOut,
    ConsultationRequestIn,
)

router = APIRouter(prefix="/consultations", tags=["consultations"])


def _booking_out(b: ConsultationBooking, order_out=None) -> ConsultationBookingOut:
    return ConsultationBookingOut(id=str(b.id), vendor_id=b.vendor_id, status=b.status, order=order_out)


@router.post("/request", response_model=ConsultationBookingOut)
async def request_consultation(payload: ConsultationRequestIn, user: User = Depends(get_current_user)):
    vendor = await Vendor.get(payload.vendor_id)
    if vendor is None or vendor.vendor_type != "astrologer" or vendor.status != "active":
        raise HTTPException(status_code=404, detail="Astrologer not found")
    if not vendor.rate_per_session:
        raise HTTPException(status_code=400, detail="This astrologer has no session rate configured")

    booking = ConsultationBooking(user_id=str(user.id), vendor_id=payload.vendor_id)
    await booking.insert()

    try:
        order, order_out = await create_order_for_booking(
            user_id=str(user.id), item_type="consultation", item_ref_id=str(booking.id),
            amount=vendor.rate_per_session, notes={"product_info": f"Consultation with {vendor.name}", "email": user.email},
            gateway_override=payload.gateway,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PaymentGatewayError as e:
        raise HTTPException(status_code=502, detail=str(e))

    booking.order_id = str(order.id)
    await booking.save()

    return _booking_out(booking, order_out)


@router.get("/{consultation_id}/messages", response_model=list[ConsultationMessageOut])
async def get_messages(consultation_id: str, user: User = Depends(get_current_user)):
    booking = await ConsultationBooking.get(consultation_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Consultation not found")
    if booking.status not in {"active", "completed"}:
        raise HTTPException(status_code=403, detail="Consultation is not active yet — complete payment first")

    messages = await ConsultationMessage.find({"consultation_id": consultation_id}).sort("+sent_at").to_list()
    return [ConsultationMessageOut(id=str(m.id), sender=m.sender, text=m.text, sent_at=m.sent_at) for m in messages]


@router.post("/{consultation_id}/messages", response_model=ConsultationMessageOut)
async def send_message(consultation_id: str, payload: ConsultationMessageIn, user: User = Depends(get_current_user)):
    booking = await ConsultationBooking.get(consultation_id)
    if booking is None or booking.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Consultation not found")
    if booking.status != "active":
        raise HTTPException(status_code=403, detail="Consultation is not active yet — complete payment first")

    message = ConsultationMessage(consultation_id=consultation_id, sender="user", text=payload.text)
    await message.insert()
    return ConsultationMessageOut(id=str(message.id), sender=message.sender, text=message.text, sent_at=message.sent_at)
