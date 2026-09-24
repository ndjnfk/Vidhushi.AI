import pytest
from fastapi import HTTPException

from app.admin.routes import chats as admin_chats
from app.api.routes import chat
from app.models.models import ConsultationRequest, User
from app.schemas.schemas import ChatMessageIn


@pytest.fixture
def sent_emails(monkeypatch):
    sent = []

    async def fake_send(to, subject, body):
        sent.append((to, subject, body))

    import app.core.notify as notify

    monkeypatch.setattr(notify, "send_email", fake_send)
    return sent


async def _setup(status="confirmed"):
    client = User(email="client@example.com", hashed_password="x")
    other = User(email="other@example.com", hashed_password="x")
    admin = User(email="vidushi@example.com", hashed_password="x", is_admin=True)
    for u in (client, other, admin):
        await u.insert()
    r = ConsultationRequest(user_id=str(client.id), name="Asha", email="asha@example.com", phone="9876543210",
                            place="Delhi", topic="love", status=status)
    await r.insert()
    return client, other, r


async def test_first_client_message_emails_once_and_threads_track_unread(sent_emails):
    client, _, r = await _setup()
    rid = str(r.id)

    first = await chat.client_send(rid, ChatMessageIn(text="  Namaste ji  "), user=client)
    assert first.text == "Namaste ji" and first.sender == "client"
    await chat.client_send(rid, ChatMessageIn(text="Second message"), user=client)
    assert len(sent_emails) == 1 and sent_emails[0][0] == "vidushi@example.com"
    assert "Asha" in sent_emails[0][1] and "Namaste ji" in sent_emails[0][2]

    inbox = await admin_chats.list_conversations()
    assert [c.request.id for c in inbox] == [rid] and inbox[0].unread == 2
    assert (await admin_chats.unread_count())["unread"] == 2

    thread = await admin_chats.host_thread(rid)  # host reads -> marked read
    assert [m.text for m in thread.messages] == ["Namaste ji", "Second message"] and thread.can_send
    assert (await admin_chats.list_conversations())[0].unread == 0

    reply = await admin_chats.host_send(rid, ChatMessageIn(text="Namaste Asha"))
    newer = await chat.client_thread(rid, after=first.id, user=client)
    assert [m.text for m in newer.messages] == ["Second message", "Namaste Asha"]
    assert newer.messages[-1].id == reply.id
    assert len(sent_emails) == 1  # host replies never trigger the email


async def test_access_and_status_rules(sent_emails):
    client, other, r = await _setup(status="pending")
    rid = str(r.id)
    with pytest.raises(HTTPException) as e:
        await chat.client_send(rid, ChatMessageIn(text="hi"), user=client)
    assert e.value.status_code == 400  # not approved yet

    r.status = "approved"  # chat opens at approval, before payment
    await r.save()
    await chat.client_send(rid, ChatMessageIn(text="before paying"), user=client)

    r.status = "confirmed"
    await r.save()
    with pytest.raises(HTTPException) as e:
        await chat.client_thread(rid, user=other)
    assert e.value.status_code == 403

    await chat.client_send(rid, ChatMessageIn(text="hi"), user=client)
    r.status = "completed"
    await r.save()
    thread = await chat.client_thread(rid, user=client)  # history stays readable
    assert not thread.can_send and len(thread.messages) == 2
    with pytest.raises(HTTPException):
        await chat.client_send(rid, ChatMessageIn(text="still there?"), user=client)


def test_message_validation():
    with pytest.raises(ValueError):
        ChatMessageIn(text="")
    with pytest.raises(ValueError):
        ChatMessageIn(text="x" * 2001)
