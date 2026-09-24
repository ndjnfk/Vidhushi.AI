"""Plain-text email over SMTP. When SMTP isn't configured (local dev), the
message is logged instead of sent so every flow still works end to end."""
import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("app.email")


def _send_sync(to: str, subject: str, body: str) -> None:
    s = get_settings()
    msg = EmailMessage()
    msg["From"] = s.smtp_from or s.smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)


async def send_email(to: str | None, subject: str, body: str) -> None:
    """Never raises: a mail failure must not fail the request that caused it."""
    if not to:
        log.warning("Email skipped (no recipient): %s", subject)
        return
    s = get_settings()
    if not (s.smtp_host and s.smtp_user and s.smtp_password):
        log.warning("SMTP not configured; email not sent.\nTo: %s\nSubject: %s\n\n%s", to, subject, body)
        return
    # Send in the background: SMTP takes seconds and the booking / order
    # request shouldn't wait for it.
    task = asyncio.create_task(_deliver(to, subject, body))
    _pending.add(task)
    task.add_done_callback(_pending.discard)


# Keeps in-flight sends referenced so they aren't garbage-collected mid-send.
_pending: set[asyncio.Task] = set()


async def _deliver(to: str, subject: str, body: str) -> None:
    try:
        await asyncio.to_thread(_send_sync, to, subject, body)
    except Exception:
        log.exception("Failed to send email to %s: %s", to, subject)


async def drain() -> None:
    """Wait for queued emails (used on shutdown)."""
    if _pending:
        await asyncio.gather(*_pending, return_exceptions=True)
