"""Text chat between a client and Vidushi Ji, one thread per booking.

Open from approval until the consultation is completed; after that the
history stays readable but no new messages can be sent. The first message
a client sends in a thread emails Vidushi Ji. The admin side is
app.admin.routes.chats.
"""
from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.bookings import get_booking_or_404
from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.notify import notify_admins
from app.models.models import ChatMessage, ConsultationRequest, User
from app.schemas.schemas import ChatMessageIn, ChatMessageOut, ChatThreadOut

router = APIRouter(prefix="/bookings", tags=["chat"])

SENDABLE = ("approved", "payment_submitted", "confirmed")
READABLE = SENDABLE + ("completed",)


def message_out(m: ChatMessage) -> ChatMessageOut:
    return ChatMessageOut(id=str(m.id), sender=m.sender, text=m.text, created_at=m.created_at, read_at=m.read_at)


def require_readable(r: ConsultationRequest) -> None:
    if r.status not in READABLE:
        raise HTTPException(status_code=400, detail="Chat opens once Vidushi Ji approves the booking")


async def read_thread(r: ConsultationRequest, reader: str, after: str | None) -> ChatThreadOut:
    """Messages newer than `after` (all if omitted); marks the other side's
    messages as read by `reader`."""
    require_readable(r)
    query: dict = {"request_id": str(r.id)}
    if after:
        try:
            query["_id"] = {"$gt": PydanticObjectId(after)}
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cursor")
    rows = await ChatMessage.find(query).sort("_id").limit(500).to_list()
    await ChatMessage.find(
        {"request_id": str(r.id), "sender": {"$ne": reader}, "read_at": None}
    ).update_many({"$set": {"read_at": datetime.utcnow()}})
    return ChatThreadOut(can_send=r.status in SENDABLE, messages=[message_out(m) for m in rows])


async def post_message(r: ConsultationRequest, sender: str, text: str) -> ChatMessageOut:
    if r.status not in SENDABLE:
        raise HTTPException(status_code=400, detail="This chat is closed")
    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message is empty")
    m = ChatMessage(request_id=str(r.id), sender=sender, text=text)
    await m.insert()

    if sender == "client" and not r.chat_notified:
        r.chat_notified = True
        await r.save()
        s = get_settings()
        await notify_admins(
            f"New chat message from {r.name}",
            f"{r.name} has started a chat about their consultation.\n\n"
            f"\"{text}\"\n\n"
            f"Reply in the admin panel: {s.frontend_url}/admin/chats?id={r.id}\n",
        )
    return message_out(m)


def _require_owner(r: ConsultationRequest, user: User) -> None:
    if r.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your booking")


@router.get("/{request_id}/chat", response_model=ChatThreadOut)
async def client_thread(request_id: str, after: str | None = None, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    return await read_thread(r, "client", after)


@router.post("/{request_id}/chat", response_model=ChatMessageOut)
async def client_send(request_id: str, payload: ChatMessageIn, user: User = Depends(get_current_user)):
    r = await get_booking_or_404(request_id)
    _require_owner(r, user)
    return await post_message(r, "client", payload.text)
