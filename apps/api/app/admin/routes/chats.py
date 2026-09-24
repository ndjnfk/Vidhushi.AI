"""Admin side of chat: every conversation in one inbox, plus reading and
replying to a thread as host. The client side is app.api.routes.chat."""
from fastapi import APIRouter, Depends

from app.admin.deps import get_current_admin
from app.api.routes.bookings import booking_out, get_booking_or_404
from app.api.routes.chat import READABLE, message_out, post_message, read_thread
from app.models.models import ChatMessage, ConsultationRequest
from app.schemas.schemas import ChatConversationOut, ChatMessageIn, ChatMessageOut, ChatThreadOut

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


@router.get("/chats", response_model=list[ChatConversationOut])
async def list_conversations():
    """One entry per chat-enabled booking, newest activity first."""
    bookings = await ConsultationRequest.find({"status": {"$in": list(READABLE)}}).to_list()
    out: list[ChatConversationOut] = []
    for r in bookings:
        rid = str(r.id)
        last = await ChatMessage.find(ChatMessage.request_id == rid).sort("-_id").first_or_none()
        unread = await ChatMessage.find({"request_id": rid, "sender": "client", "read_at": None}).count()
        out.append(ChatConversationOut(request=booking_out(r), last_message=message_out(last) if last else None, unread=unread))
    out.sort(
        key=lambda c: (c.last_message.created_at if c.last_message else c.request.created_at),
        reverse=True,
    )
    return out


@router.get("/chats/unread-count")
async def unread_count() -> dict:
    return {"unread": await ChatMessage.find({"sender": "client", "read_at": None}).count()}


@router.get("/bookings/{request_id}/chat", response_model=ChatThreadOut)
async def host_thread(request_id: str, after: str | None = None):
    return await read_thread(await get_booking_or_404(request_id), "host", after)


@router.post("/bookings/{request_id}/chat", response_model=ChatMessageOut)
async def host_send(request_id: str, payload: ChatMessageIn):
    return await post_message(await get_booking_or_404(request_id), "host", payload.text)
