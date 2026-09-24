"""Admin side of consultations: review/approve/reject requests and join the
call as host. The client side is app.api.routes.bookings."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.api.routes.bookings import (
    booking_out,
    fmt_ist,
    get_booking_or_404,
    insert_signal,
    require_room_open,
    signals_after,
)
from app.core.config import get_settings
from app.core.email import send_email
from app.core.live import bump, user_topic
from app.models.models import ConsultationRequest
from app.schemas.schemas import (
    AdminCountsOut,
    CallInfoOut,
    CallSignalIn,
    CallSignalOut,
    ConsultationApproveIn,
    ConsultationDecisionIn,
    ConsultationRequestOut,
)

router = APIRouter(prefix="/admin/bookings", tags=["admin"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[ConsultationRequestOut])
async def list_bookings(status: str | None = None):
    query = ConsultationRequest.find(ConsultationRequest.status == status) if status else ConsultationRequest.find_all()
    return [booking_out(r) for r in await query.sort("-created_at").to_list()]


@router.get("/counts", response_model=AdminCountsOut)
async def counts():
    """For the sidebar badge: requests waiting on Vidushi Ji."""
    return AdminCountsOut(
        pending=await ConsultationRequest.find(ConsultationRequest.status == "pending").count(),
        payment_submitted=await ConsultationRequest.find(ConsultationRequest.status == "payment_submitted").count(),
    )


@router.post("/{request_id}/approve", response_model=ConsultationRequestOut)
async def approve(request_id: str, payload: ConsultationApproveIn):
    r = await get_booking_or_404(request_id)
    if r.status not in ("pending", "approved"):
        raise HTTPException(status_code=400, detail=f"A {r.status} booking can't be approved")
    scheduled = payload.scheduled_at
    if scheduled.tzinfo is not None:
        scheduled = scheduled.astimezone(timezone.utc).replace(tzinfo=None)
    r.status = "approved"
    r.scheduled_at = scheduled
    r.duration_minutes = payload.duration_minutes
    r.amount = payload.amount
    r.admin_note = payload.note
    r.decided_at = datetime.utcnow()
    await r.save()
    await bump(user_topic(r.user_id))

    s = get_settings()
    await send_email(
        r.email,
        "Your consultation with Vidushi Ji is approved",
        f"Namaste {r.name},\n\nGood news — Vidushi Ji has approved your consultation.\n\n"
        f"Date & time: {fmt_ist(r.scheduled_at)}\nDuration: {r.duration_minutes} minutes\n"
        f"Fee: ₹{r.amount:,.0f}\n"
        + (f"Note from Vidushi Ji: {r.admin_note}\n" if r.admin_note else "")
        + "\nPlease pay the fee by scanning the UPI QR code on your booking page. Your audio/video call "
        "unlocks once Vidushi Ji confirms the payment. You can also chat with her there:\n"
        f"{s.frontend_url}/bookings/{r.id}\n\n— Vidushi Ji",
    )
    return booking_out(r)


@router.post("/{request_id}/reject", response_model=ConsultationRequestOut)
async def reject(request_id: str, payload: ConsultationDecisionIn):
    r = await get_booking_or_404(request_id)
    if r.status not in ("pending", "approved", "payment_submitted"):
        raise HTTPException(status_code=400, detail=f"A {r.status} booking can't be rejected")
    r.status = "rejected"
    r.admin_note = payload.note
    r.decided_at = datetime.utcnow()
    await r.save()
    await bump(user_topic(r.user_id))
    await send_email(
        r.email,
        "About your consultation request",
        f"Namaste {r.name},\n\nUnfortunately Vidushi Ji is unable to take your consultation request at this time."
        + (f"\n\nNote: {r.admin_note}" if r.admin_note else "")
        + "\n\nYou are welcome to send a new request later.\n\n— Vidushi Ji",
    )
    return booking_out(r)


@router.post("/{request_id}/payment-received", response_model=ConsultationRequestOut)
async def payment_received(request_id: str):
    """Vidushi Ji confirms the UPI money arrived: the booking is confirmed and
    the client's audio/video call unlocks."""
    r = await get_booking_or_404(request_id)
    if r.status not in ("approved", "payment_submitted"):
        raise HTTPException(status_code=400, detail=f"A {r.status} booking isn't awaiting payment")
    r.status = "confirmed"
    r.payment_received_at = datetime.utcnow()
    await r.save()
    await bump(user_topic(r.user_id))
    s = get_settings()
    await send_email(
        r.email,
        "Payment received — your consultation is confirmed",
        f"Namaste {r.name},\n\nVidushi Ji has received your payment of ₹{r.amount:,.0f}. Your consultation is confirmed.\n\n"
        f"Date & time: {fmt_ist(r.scheduled_at)}\nDuration: {r.duration_minutes} minutes\n\n"
        f"Join the audio or video call from this page at the scheduled time:\n{s.frontend_url}/bookings/{r.id}\n\n— Vidushi Ji",
    )
    return booking_out(r)


@router.post("/{request_id}/complete", response_model=ConsultationRequestOut)
async def complete(request_id: str):
    r = await get_booking_or_404(request_id)
    if r.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only a confirmed booking can be marked completed")
    r.status = "completed"
    await r.save()
    await bump(user_topic(r.user_id))
    return booking_out(r)


@router.get("/{request_id}/call", response_model=CallInfoOut)
async def host_call_info(request_id: str):
    r = await get_booking_or_404(request_id)
    require_room_open(r, "host")
    return CallInfoOut(role="host", ice_servers=get_settings().ice_servers, request=booking_out(r))


@router.post("/{request_id}/signal", response_model=CallSignalOut)
async def host_post_signal(request_id: str, payload: CallSignalIn):
    r = await get_booking_or_404(request_id)
    require_room_open(r, "host")
    return await insert_signal(request_id, "host", payload)


@router.get("/{request_id}/signal", response_model=list[CallSignalOut])
async def host_poll_signals(request_id: str, after: str):
    await get_booking_or_404(request_id)
    return await signals_after(request_id, "host", after)
