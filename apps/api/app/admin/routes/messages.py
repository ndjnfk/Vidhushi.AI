"""Admin: contact-form messages."""
from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.models.models import ContactMessage
from app.schemas.schemas import ContactMessageOut

router = APIRouter(prefix="/admin/messages", tags=["admin"], dependencies=[Depends(get_current_admin)])


def _out(m: ContactMessage) -> ContactMessageOut:
    return ContactMessageOut(id=str(m.id), name=m.name, email=m.email, phone=m.phone, message=m.message,
                             handled=m.handled, created_at=m.created_at)


@router.get("", response_model=list[ContactMessageOut])
async def list_messages():
    return [_out(m) for m in await ContactMessage.find_all().sort("-created_at").limit(500).to_list()]


@router.get("/counts")
async def counts() -> dict:
    return {"unhandled": await ContactMessage.find(ContactMessage.handled == False).count()}  # noqa: E712


@router.put("/{message_id}/handled", response_model=ContactMessageOut)
async def set_handled(message_id: str, handled: bool = True):
    try:
        m = await ContactMessage.get(message_id)
    except Exception:
        m = None
    if m is None:
        raise HTTPException(status_code=404, detail="Message not found")
    m.handled = handled
    await m.save()
    return _out(m)
