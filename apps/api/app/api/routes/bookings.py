"""Personal consultations with Vidushi Ji.

Flow: a logged-in client submits a request -> Vidushi Ji is emailed and sees
it in the admin panel -> she approves it with a date/time, duration and fee
(client is emailed) or rejects it -> the client pays -> both join an in-site
WebRTC audio/video call, signalled through the endpoints at the bottom.

This module is the client side; the admin side (approve/reject, host call)
lives in app.admin.routes.bookings.
"""
import base64
from datetime import datetime, timedelta, timezone
from typing import Annotated

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.email import send_email
from app.core.notify import notify_admins
from app.core.upi import decode_image_upload, get_upi_settings, qr_data_url, upi_uri
from app.models.models import CHANNELS, BookingPhoto, CallSignal, ConsultationRequest, TarotContent, User
from app.schemas.schemas import (
    FeeItemIn,
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
        payment_reference=r.payment_reference, session_id=r.session_id, session_name=r.session_name,
        kind=r.kind, photo_count=r.photo_count, dob=r.dob, fee_items=[FeeItemIn(label=f.label, amount=f.amount) for f in r.fee_items],
        channels=r.channels,
    )


MAX_PHOTO_BYTES = 3 * 1024 * 1024


def decode_photos(data_urls: list[str]) -> list[tuple[bytes, str]]:
    """Validate every attached photo before anything is saved."""
    out = []
    for i, url in enumerate(data_urls, start=1):
        try:
            out.append(decode_image_upload(url, MAX_PHOTO_BYTES))
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Photo {i}: {e}")
    return out


async def photo_urls(r: ConsultationRequest) -> list[str]:
    """The request's photos as data: URLs (they're private, so never a public link)."""
    rows = await BookingPhoto.find(BookingPhoto.request_id == str(r.id)).sort("position").to_list()
    return [f"data:{p.content_type};base64,{base64.b64encode(p.data).decode()}" for p in rows]


def noun(r: ConsultationRequest) -> str:
    """How emails name the booking."""
    return "ritual" if r.kind == "ritual" else "consultation"


def admin_path(r: ConsultationRequest) -> str:
    """Where Vidushi Ji manages it: rituals have their own admin page."""
    return "/admin/rituals" if r.kind == "ritual" else "/admin/bookings"


def kind_query(kind: str | None) -> dict:
    """Mongo filter for a list of one kind (older rows have no `kind`)."""
    if kind == "ritual":
        return {"kind": "ritual"}
    if kind == "consultation":
        return {"kind": {"$ne": "ritual"}}
    return {}


def fee_lines(r: ConsultationRequest) -> str:
    """The fee for emails: the admin's break-up and total, or the single amount."""
    if not r.fee_items:
        return f"Fee: ₹{r.amount:,.0f}\n"
    items = "".join(f"  {f.label}: ₹{f.amount:,.0f}\n" for f in r.fee_items)
    return f"Fee:\n{items}  Total: ₹{r.amount:,.0f}\n"


def fmt_dob(dob: str) -> str:
    """"1995-03-12" -> "12 Mar 1995" for emails."""
    try:
        return datetime.strptime(dob, "%Y-%m-%d").strftime("%d %b %Y").lstrip("0")
    except ValueError:
        return dob


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
    if payload.kind == "ritual" or payload.session_id:  # tarot sessions and rituals
        if len(payload.photos) != 1:
            raise HTTPException(status_code=422, detail="Please add a clear photo of your face")
        if not payload.dob:
            raise HTTPException(status_code=422, detail="Please enter your date of birth")
    photos = decode_photos(payload.photos)
    r = ConsultationRequest(user_id=str(user.id), **payload.model_dump(exclude={"photos"}))
    if r.kind == "ritual":
        # A ritual has no call: chat is for updates. Session fields don't apply.
        r.session_id, r.channels = "", ["chat"]
    elif r.session_id:
        # Unknown ids are the site's built-in sessions: everything included.
        content = await TarotContent.find_one()
        s = next((x for x in (content.sessions if content else []) if x.id == r.session_id), None)
        if s is not None:
            r.session_name = s.name
            r.channels = [c for c in CHANNELS if c in s.channels] or list(CHANNELS)
    await r.insert()
    for i, (raw, content_type) in enumerate(photos):
        await BookingPhoto(request_id=str(r.id), position=i, data=raw, content_type=content_type).insert()
    if photos:
        r.photo_count = len(photos)
        await r.save()

    s = get_settings()
    await notify_admins(
        f"New {noun(r)} request from {r.name}",
        f"A new {noun(r)} request is waiting for your approval.\n\n"
        f"Name: {r.name}\nEmail: {r.email}\nPhone: {r.phone}\nPlace: {r.place}\n"
        + (f"Date of birth: {fmt_dob(r.dob)}\n" if r.dob else "")
        + f"Topic: {TOPICS.get(r.topic, r.topic)}\nMessage: {r.message or '-'}\n\n"
        + (f"Photos: {r.photo_count} attached (see the admin panel)\n\n" if r.photo_count else "")
        + f"Review it in the admin panel: {s.frontend_url}{admin_path(r)}\n",
    )
    await send_email(
        r.email,
        f"We received your {noun(r)} request",
        f"Namaste {r.name},\n\nThank you for your {noun(r)} request. Vidushi Ji will review it shortly; "
        + ("you will get another email as soon as it is approved, with the ritual's date and charges.\n\n"
           if r.kind == "ritual" else
           "you will get another email as soon as it is approved, with the date and time of your session.\n\n")
        + (f"Your details: {r.name}, born {fmt_dob(r.dob)}, {r.place}\n\n" if r.dob else "")
        + f"Track its status here: {s.frontend_url}/bookings/{r.id}\n\n— Vidushi Ji",
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
    note = f"Vidushi Ji {noun(r)} {str(r.id)[-6:]}"
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
        f"{r.name} marked their {noun(r)} fee of ₹{r.amount:,.0f} as paid by UPI.\n"
        f"Transaction reference: {r.payment_reference or '(not given)'}\n\n"
        f"Please check your UPI app, then click \"Payment received\" in the admin panel to confirm it:\n"
        f"{s.frontend_url}{admin_path(r)}\n",
    )
    return booking_out(r)


# ---------------------------------------------------------------- call
# Shared by the client endpoints below and the host (admin) endpoints in
# app.admin.routes.bookings.

def require_room_open(r: ConsultationRequest, role: str, mode: str | None = None) -> None:
    if r.status != "confirmed":
        raise HTTPException(status_code=400, detail="The call opens once the booking is approved and paid")
    allowed = [c for c in ("audio", "video") if c in r.channels]
    if not allowed or (mode is not None and mode not in allowed):
        raise HTTPException(status_code=403, detail="not_included")
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
async def call_info(request_id: str, mode: Annotated[str | None, Query(pattern="^(audio|video)$")] = None,
                    user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    require_room_open(r, "client", mode)
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


@router.get("/{request_id}/photos", response_model=list[str])
async def my_photos(request_id: str, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    return await photo_urls(r)
