from datetime import datetime, timedelta, timezone

import pytest
from beanie import PydanticObjectId
from fastapi import HTTPException

from app.admin.routes import bookings as admin_bookings
from app.admin.routes import tarot_content as admin_tarot
from app.api.routes import bookings, chat
from app.models.models import ConsultationRequest, User
from app.schemas.schemas import (
    ChatMessageIn,
    ConsultationApproveIn,
    ConsultationRequestIn,
    FeeItemIn,
    TarotContentIn,
    TarotSessionIn,
)

# Sessions and rituals need the client's photo (the face check runs in the browser).
PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


async def _confirmed_booking(session_id: str) -> tuple[User, str]:
    client = User(email="client@example.com", hashed_password="x")
    await client.insert()
    b = await bookings.create_request(ConsultationRequestIn(
        name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="other",
        message="Q", session_id=session_id, photos=[PHOTO], dob="1995-03-12",
    ), user=client)
    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    await admin_bookings.approve(b.id, ConsultationApproveIn(scheduled_at=start, duration_minutes=30, amount=999))
    await admin_bookings.payment_received(b.id)
    return client, b.id


async def test_built_in_session_includes_everything():
    client, bid = await _confirmed_booking("call-15")  # nothing saved by the admin yet
    b = await bookings.get_request(bid, user=client)
    assert b.channels == ["chat", "audio", "video"]
    assert (await bookings.call_info(bid, mode="video", user=client)).role == "client"
    assert (await chat.client_send(bid, ChatMessageIn(text="Hi"), user=client)).text == "Hi"


async def test_admin_limits_what_a_confirmed_session_offers():
    await admin_tarot.update_tarot(TarotContentIn(sessions=[
        TarotSessionIn(id="call-15", group="call", name="15-Minute Call", price=999, channels=["audio"]),
    ]))
    client, bid = await _confirmed_booking("call-15")
    b = await bookings.get_request(bid, user=client)
    assert b.channels == ["audio"] and b.session_name == "15-Minute Call"

    assert (await bookings.call_info(bid, mode="audio", user=client)).role == "client"
    with pytest.raises(HTTPException) as e:
        await bookings.call_info(bid, mode="video", user=client)
    assert e.value.status_code == 403
    with pytest.raises(HTTPException):
        await admin_bookings.host_call_info(bid, mode="video")
    with pytest.raises(HTTPException) as e:
        await chat.client_thread(bid, user=client)
    assert e.value.status_code == 403
    with pytest.raises(HTTPException):
        await chat.client_send(bid, ChatMessageIn(text="Hi"), user=client)

    # A later admin change doesn't alter a booking already made.
    await admin_tarot.update_tarot(TarotContentIn(sessions=[
        TarotSessionIn(id="call-15", group="call", name="15-Minute Call", price=999, channels=["video"]),
    ]))
    assert (await bookings.get_request(bid, user=client)).channels == ["audio"]


async def test_chat_stays_open_before_confirmation():
    await admin_tarot.update_tarot(TarotContentIn(sessions=[
        TarotSessionIn(id="video", group="call", name="Video", price=4999, channels=["video"]),
    ]))
    client = User(email="c2@example.com", hashed_password="x")
    await client.insert()
    b = await bookings.create_request(ConsultationRequestIn(
        name="Ravi", email="ravi@example.com", phone="9876543210", place="Pune", topic="other", session_id="video", photos=[PHOTO], dob="1995-03-12",
    ), user=client)
    start = datetime.now(timezone.utc) + timedelta(days=1)
    await admin_bookings.approve(b.id, ConsultationApproveIn(scheduled_at=start, duration_minutes=60, amount=4999))
    thread = await chat.client_thread(b.id, user=client)  # approved, not yet paid
    assert thread.can_send is True


async def test_sessions_no_longer_take_a_ritual_add_on():
    # Rituals are requested separately (kind="ritual"); a session booking ignores any add-on.
    client = User(email="c3@example.com", hashed_password="x")
    await client.insert()
    b = await bookings.create_request(ConsultationRequestIn(
        name="Meera", email="meera@example.com", phone="9876543210", place="Jaipur", topic="other",
        session_id="forecast", ritual_interest="legal", photos=[PHOTO], dob="1995-03-12",
    ), user=client)
    assert "ritual_interest" not in b.model_dump()
    assert (await ConsultationRequest.get(PydanticObjectId(b.id))).ritual_interest == ""


async def test_fee_break_up_totals_and_is_shown_in_the_email(monkeypatch):
    sent: list[str] = []

    async def fake_send(to, subject, body):
        sent.append(body)

    monkeypatch.setattr(admin_bookings, "send_email", fake_send)
    client = User(email="c4@example.com", hashed_password="x")
    await client.insert()
    b = await bookings.create_request(ConsultationRequestIn(
        name="Neha", email="neha@example.com", phone="9876543210", place="Saharanpur", topic="other",
        session_id="call-15", photos=[PHOTO], dob="1995-03-12",
    ), user=client)
    start = datetime.now(timezone.utc) + timedelta(days=1)
    approved = await admin_bookings.approve(b.id, ConsultationApproveIn(
        scheduled_at=start, duration_minutes=15,
        fee_items=[FeeItemIn(label=" Session ", amount=999), FeeItemIn(label="Platform service", amount=49)],
        amount=1,  # ignored when a break-up is given
    ))
    assert approved.amount == 1048
    assert [(f.label, f.amount) for f in approved.fee_items] == [("Session", 999), ("Platform service", 49)]
    assert "  Session: ₹999\n  Platform service: ₹49\n  Total: ₹1,048" in sent[-1]

    with pytest.raises(ValueError):
        ConsultationApproveIn(scheduled_at=start, duration_minutes=15)  # no fee at all


async def test_ritual_requests_are_listed_separately_and_follow_the_same_flow(monkeypatch):
    sent: list[tuple[str, str]] = []

    async def fake_send(to, subject, body):
        sent.append((subject, body))

    monkeypatch.setattr(admin_bookings, "send_email", fake_send)
    client = User(email="c5@example.com", hashed_password="x")
    await client.insert()
    base = dict(name="Kavya", email="kavya@example.com", phone="9876543210", place="Agra", topic="other")
    session = await bookings.create_request(ConsultationRequestIn(**base, session_id="call-15", photos=[PHOTO], dob="1995-03-12"), user=client)
    ritual = await bookings.create_request(ConsultationRequestIn(
        **base, kind="ritual", session_id="call-15", photos=[PHOTO], dob="1995-03-12", message="Ritual enquiry: Court Cases",
    ), user=client)
    # A ritual has no call and no session fields.
    assert ritual.kind == "ritual" and ritual.channels == ["chat"]
    assert ritual.session_id == ""

    assert [r.id for r in await admin_bookings.list_bookings(kind="ritual")] == [ritual.id]
    assert [r.id for r in await admin_bookings.list_bookings(kind="consultation")] == [session.id]
    assert len(await admin_bookings.list_bookings()) == 2
    assert (await admin_bookings.counts(kind="ritual")).pending == 1
    assert (await admin_bookings.counts(kind="consultation")).pending == 1

    start = datetime.now(timezone.utc) + timedelta(days=2)
    approved = await admin_bookings.approve(ritual.id, ConsultationApproveIn(
        scheduled_at=start, duration_minutes=60,
        fee_items=[FeeItemIn(label="Healing ritual", amount=2100), FeeItemIn(label="Platform service", amount=0)],
    ))
    assert approved.amount == 2100
    subject, body = sent[-1]
    assert subject == "Your ritual with Vidushi Ji is approved"
    assert "Ritual date:" in body and "Duration" not in body and "Healing ritual: ₹2,100" in body

    await admin_bookings.payment_received(ritual.id)
    assert sent[-1][0] == "Payment received — your ritual is confirmed"
    with pytest.raises(HTTPException):
        await bookings.call_info(ritual.id, user=client)  # rituals have no call
    assert (await chat.client_send(ritual.id, ChatMessageIn(text="Any update?"), user=client)).text == "Any update?"


async def test_admin_picks_how_a_ritual_client_can_reach_her(monkeypatch):
    sent: list[str] = []

    async def fake_send(to, subject, body):
        sent.append(body)

    monkeypatch.setattr(admin_bookings, "send_email", fake_send)
    client = User(email="c6@example.com", hashed_password="x")
    await client.insert()
    base = dict(name="Isha", email="isha@example.com", phone="9876543210", place="Pune", topic="other")
    ritual = await bookings.create_request(ConsultationRequestIn(**base, kind="ritual", photos=[PHOTO], dob="1995-03-12"), user=client)
    session = await bookings.create_request(ConsultationRequestIn(**base, session_id="call-15", photos=[PHOTO], dob="1995-03-12"), user=client)
    start = datetime.now(timezone.utc) + timedelta(minutes=5)

    approved = await admin_bookings.approve(ritual.id, ConsultationApproveIn(
        scheduled_at=start, duration_minutes=60, amount=2100, channels=["video", "chat"]))
    assert approved.channels == ["chat", "video"]
    assert "You can chat or video call with her from your booking page" in sent[-1]
    await admin_bookings.payment_received(ritual.id)
    assert (await bookings.call_info(ritual.id, mode="video", user=client)).role == "client"
    with pytest.raises(HTTPException):
        await bookings.call_info(ritual.id, mode="audio", user=client)

    # Consultations keep their session's setting; the field is ignored for them.
    s = await admin_bookings.approve(session.id, ConsultationApproveIn(
        scheduled_at=start, duration_minutes=15, amount=999, channels=["chat"]))
    assert s.channels == ["chat", "audio", "video"]
    with pytest.raises(ValueError):
        ConsultationApproveIn(scheduled_at=start, duration_minutes=60, amount=1, channels=[])
