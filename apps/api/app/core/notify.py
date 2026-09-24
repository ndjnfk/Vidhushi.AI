from app.core.config import get_settings
from app.core.email import send_email
from app.models.models import User


async def admin_recipients() -> list[str]:
    """ADMIN_NOTIFY_EMAIL if set, otherwise every admin account's email."""
    s = get_settings()
    if s.admin_notify_email:
        return [s.admin_notify_email]
    return [u.email for u in await User.find(User.is_admin == True).to_list()]  # noqa: E712


async def notify_admins(subject: str, body: str) -> None:
    for to in await admin_recipients():
        await send_email(to, subject, body)
