"""Personal consultations with Vidushi Ji.

Flow: a logged-in client submits a request -> Vidushi Ji is emailed and sees
it in the admin panel -> she approves it with a date/time, duration and fee
(client is emailed) or rejects it -> the client pays -> both join an in-site
WebRTC audio/video call, signalled through the endpoints at the bottom.

This module is the client side; the admin side (approve/reject, host call)
lives in app.admin.routes.bookings.
"""
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlencode

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.email import send_email
from app.core.notify import notify_admins
from app.core.upi import get_upi_settings, qr_data_url
from app.models.models import CallSignal, ConsultationRequest, User
from app.schemas.schemas import (
    CallInfoOut,
    CallSignalIn,
    CallSignalOut,
    ConsultationRequestIn,
    ConsultationRequestOut,
    PaymentSubmittedIn,
    UpiPaymentInfoOut,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])

IST = timezone(timedelta(hours=5, minutes=30))
TOPICS = {"love": "Love life", "career": "Career", "marriage": "Marriage", "other": "Other"}
# The call room opens this long before the slot and stays open this long after it ends.
ROOM_OPENS_EARLY = timedelta(minutes=15)
ROOM_GRACE_AFTER = timedelta(minutes=60)


def booking_out(r: ConsultationRequest) -> ConsultationRequestOut:
    return ConsultationRequestOut(
        id=str(r.id), name=r.name, email=r.email, phone=r.phone, place=r.place, topic=r.topic,
        message=r.message, status=r.status, scheduled_at=r.scheduled_at, duration_minutes=r.duration_minutes,
        amount=r.amount, admin_note=r.admin_note, created_at=r.created_at,
        payment_reference=r.payment_reference,
    )


def fmt_ist(dt: datetime | None) -> str:
    if dt is None:
        return "-"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime("%d %b %Y, %I:%M %p IST")


async def get_booking_or_404(request_id: str) -> ConsultationRequest:
    try:
        r = await ConsultationRequest.get(PydanticObjectId(request_id))
    except Exception:
        r = None
    if r is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return r


def _require_owner(r: ConsultationRequest, user: User) -> None:
    if r.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your booking")


# ---------------------------------------------------------------- client

@router.post("", response_model=ConsultationRequestOut)
async def create_request(payload: ConsultationRequestIn, user: User = Depends(get_current_user)):
    r = ConsultationRequest(user_id=str(user.id), **payload.model_dump())
    await r.insert()

    s = get_settings()
    await notify_admins(
        f"New consultation request from {r.name}",
        f"A new consultation request is waiting for your approval.\n\n"
        f"Name: {r.name}\nEmail: {r.email}\nPhone: {r.phone}\nPlace: {r.place}\n"
        f"Topic: {TOPICS.get(r.topic, r.topic)}\nMessage: {r.message or '-'}\n\n"
        f"Review it in the admin panel: {s.frontend_url}/admin/bookings\n",
    )
    await send_email(
        r.email,
        "We received your consultation request",
        f"Namaste {r.name},\n\nThank you for your consultation request. Vidushi Ji will review it shortly; "
        f"you will get another email as soon as it is approved, with the date and time of your session.\n\n"
        f"Track its status here: {s.frontend_url}/bookings/{r.id}\n\n— Vidushi Ji",
    )
    return booking_out(r)


@router.get("/mine", response_model=list[ConsultationRequestOut])
async def my_requests(user: User = Depends(get_current_user)):
    rows = await ConsultationRequest.find(ConsultationRequest.user_id == str(user.id)).sort("-created_at").to_list()
    return [booking_out(r) for r in rows]


@router.get("/{request_id}", response_model=ConsultationRequestOut)
async def get_request(request_id: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    return booking_out(r)


@router.post("/{request_id}/cancel", response_model=ConsultationRequestOut)
async def cancel_request(request_id: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    if r.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your booking")
    if r.status not in ("pending", "approved", "payment_submitted"):
        raise HTTPException(status_code=400, detail=f"A {r.status} booking can't be cancelled here")
    r.status = "cancelled"
    await r.save()
    return booking_out(r)


def upi_uri(upi_id: str, payee: str, amount: float, note: str) -> str:
    q = urlencode({"pa": upi_id, "pn": payee, "am": f"{amount:.2f}", "cu": "INR", "tn": note}, quote_via=quote)
    return f"upi://pay?{q}"


@router.get("/{request_id}/payment-info", response_model=UpiPaymentInfoOut)
async def payment_info(request_id: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    if r.status not in ("approved", "payment_submitted") or r.amount is None:
        raise HTTPException(status_code=400, detail="This booking is not awaiting payment")
    upi = await get_upi_settings()
    qr = qr_data_url(upi)
    if not qr and not upi.upi_id:
        raise HTTPException(status_code=503, detail="upi_not_configured")
    note = f"Vidushi Ji consultation {str(r.id)[-6:]}"
    return UpiPaymentInfoOut(
        upi_id=upi.upi_id, payee_name=upi.payee_name, amount=r.amount, note=note,
        # An uploaded QR wins: it's exactly what Vidushi Ji's bank gave her.
        upi_uri=None if qr else upi_uri(upi.upi_id, upi.payee_name, r.amount, note),
        qr_image=qr,
    )


@router.post("/{request_id}/payment-submitted", response_model=ConsultationRequestOut)
async def payment_submitted(request_id: str, payload: PaymentSubmittedIn, user: User = Depends(get_current_user)):
    """Client says they've paid. Nothing unlocks until Vidushi Ji confirms
    the money arrived (admin "Payment received")."""
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    if r.status not in ("approved", "payment_submitted"):
        raise HTTPException(status_code=400, detail="This booking is not awaiting payment")
    r.status = "payment_submitted"
    r.payment_reference = payload.reference.strip()
    r.payment_submitted_at = datetime.utcnow()
    await r.save()

    s = get_settings()
    await notify_admins(
        f"{r.name} says they have paid ₹{r.amount:,.0f}",
        f"{r.name} marked their consultation fee of ₹{r.amount:,.0f} as paid by UPI.\n"
        f"Transaction reference: {r.payment_reference or '(not given)'}\n\n"
        f"Please check your UPI app, then click \"Payment received\" in the admin panel to unlock their call:\n"
        f"{s.frontend_url}/admin/bookings\n",
    )
    return booking_out(r)


# ---------------------------------------------------------------- call
# Shared by the client endpoints below and the host (admin) endpoints in
# app.admin.routes.bookings.

def require_room_open(r: ConsultationRequest, role: str) -> None:
    if r.status != "confirmed":
        raise HTTPException(status_code=400, detail="The call opens once the booking is approved and paid")
    if role == "host" or r.scheduled_at is None:
        return  # Vidushi Ji can open the room any time.
    now = datetime.utcnow()
    end = r.scheduled_at + timedelta(minutes=r.duration_minutes or 60)
    if now < r.scheduled_at - ROOM_OPENS_EARLY:
        raise HTTPException(status_code=425, detail="too_early")
    if now > end + ROOM_GRACE_AFTER:
        raise HTTPException(status_code=410, detail="ended")


async def insert_signal(request_id: str, role: str, payload: CallSignalIn) -> CallSignalOut:
    sig = CallSignal(request_id=request_id, sender=role, kind=payload.kind, data=payload.data)
    await sig.insert()
    return CallSignalOut(id=str(sig.id), sender=sig.sender, kind=sig.kind, data=sig.data)


async def signals_after(request_id: str, role: str, after: str) -> list[CallSignalOut]:
    """Signals from the other side newer than `after` (a signal id)."""
    try:
        after_id = PydanticObjectId(after)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cursor")
    rows = await CallSignal.find(
        {"request_id": request_id, "sender": {"$ne": role}, "_id": {"$gt": after_id}}
    ).sort("_id").limit(200).to_list()
    return [CallSignalOut(id=str(x.id), sender=x.sender, kind=x.kind, data=x.data) for x in rows]


@router.get("/{request_id}/call", response_model=CallInfoOut)
async def call_info(request_id: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    require_room_open(r, "client")
    return CallInfoOut(role="client", ice_servers=get_settings().ice_servers, request=booking_out(r))


@router.post("/{request_id}/signal", response_model=CallSignalOut)
async def post_signal(request_id: str, payload: CallSignalIn, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    require_room_open(r, "client")
    return await insert_signal(request_id, "client", payload)


@router.get("/{request_id}/signal", response_model=list[CallSignalOut])
async def poll_signals(request_id: str, after: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    return await signals_after(request_id, "client", after)
