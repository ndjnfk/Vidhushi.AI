"""Public contact form: stores the message and emails Vidushi Ji."""
from fastapi import APIRouter

from app.core.config import get_settings
from app.core.notify import notify_admins
from app.models.models import ContactMessage
from app.schemas.schemas import ContactMessageIn

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("")
async def send_message(payload: ContactMessageIn) -> dict:
    # Bots fill every field, including the hidden honeypot: accept silently, keep nothing.
    if payload.website:
        return {"ok": True}
    m = ContactMessage(name=payload.name.strip(), email=payload.email, phone=payload.phone.strip(), message=payload.message.strip())
    await m.insert()
    await notify_admins(
        f"New message from {m.name} (website contact form)",
        f"Name: {m.name}\nEmail: {m.email}\nPhone: {m.phone or '-'}\n\n{m.message}\n\n"
        f"Reply to {m.email}, or see all messages: {get_settings().frontend_url}/admin/messages\n",
    )
    return {"ok": True}
