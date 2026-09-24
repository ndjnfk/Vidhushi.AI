import pytest

import app.core.notify as notify
from app.admin.routes import messages as admin_messages
from app.api.routes import contact
from app.models.models import ContactMessage, User
from app.schemas.schemas import ContactMessageIn


@pytest.fixture
def emails(monkeypatch):
    sent = []

    async def fake(to, subject, body):
        sent.append((to, subject, body))

    monkeypatch.setattr(notify, "send_email", fake)
    return sent


async def test_contact_message_is_stored_and_emailed(emails):
    await User(email="vidushi@example.com", hashed_password="x", is_admin=True).insert()
    await contact.send_message(ContactMessageIn(name=" Asha ", email="asha@example.com", phone="98765", message="Do you do home visits?"))
    rows = await admin_messages.list_messages()
    assert len(rows) == 1 and rows[0].name == "Asha" and not rows[0].handled
    assert emails[0][0] == "vidushi@example.com" and "home visits" in emails[0][2]
    assert (await admin_messages.counts())["unhandled"] == 1
    await admin_messages.set_handled(rows[0].id)
    assert (await admin_messages.counts())["unhandled"] == 0


async def test_honeypot_drops_bots(emails):
    await contact.send_message(ContactMessageIn(name="Bot", email="b@example.com", message="spam", website="http://x"))
    assert await ContactMessage.find_all().count() == 0 and emails == []


def test_validation():
    with pytest.raises(ValueError):
        ContactMessageIn(name="", email="a@example.com", message="x")
    with pytest.raises(ValueError):
        ContactMessageIn(name="A", email="nope", message="x")
