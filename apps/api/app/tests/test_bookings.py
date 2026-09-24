from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.admin.routes import bookings as admin_bookings
from app.api.routes import bookings
from app.models.models import ConsultationRequest, User
from app.schemas.schemas import (
    CallSignalIn,
    ConsultationApproveIn,
    ConsultationDecisionIn,
    ConsultationRequestIn,
    PaymentSubmittedIn,
)


async def _users():
    client = User(email="client@example.com", hashed_password="x")
    other = User(email="other@example.com", hashed_password="x")
    admin = User(email="admin@example.com", hashed_password="x", is_admin=True)
    for u in (client, other, admin):
        await u.insert()
    return client, other, admin


def _request_in(**over):
    data = dict(name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="career",
                message="Job change?")
    data.update(over)
    return ConsultationRequestIn(**data)


async def test_full_flow_request_approve_pay_then_call_signals():
    client, other, admin = await _users()

    created = await bookings.create_request(_request_in(), user=client)
    assert created.status == "pending"
    assert [r.id for r in await bookings.my_requests(user=client)] == [created.id]
    with pytest.raises(HTTPException) as e:
        await bookings.get_request(created.id, user=other)
    assert e.value.status_code == 403

    # Can't pay or call before approval.
    with pytest.raises(HTTPException):
        await bookings.payment_submitted(created.id, PaymentSubmittedIn(), user=client)

    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    approved = await admin_bookings.approve(
        created.id, ConsultationApproveIn(scheduled_at=start, duration_minutes=30, amount=501, note="See you")
    )
    assert approved.status == "approved" and approved.amount == 501 and approved.duration_minutes == 30

    with pytest.raises(HTTPException):
        await bookings.call_info(created.id, user=client)  # not paid yet

    # Client says they paid by UPI: still no call until Vidushi Ji confirms.
    submitted = await bookings.payment_submitted(created.id, PaymentSubmittedIn(reference=" 4321UTR "), user=client)
    assert submitted.status == "payment_submitted" and submitted.payment_reference == "4321UTR"
    with pytest.raises(HTTPException):
        await bookings.call_info(created.id, user=client)
    confirmed = await admin_bookings.payment_received(created.id)
    assert confirmed.status == "confirmed"

    # Room is open 5 min before the slot for the client, any time for the host.
    assert (await bookings.call_info(created.id, user=client)).role == "client"
    assert (await admin_bookings.host_call_info(created.id)).role == "host"

    join = await bookings.post_signal(created.id, CallSignalIn(kind="join"), user=client)
    offer = await admin_bookings.host_post_signal(created.id, CallSignalIn(kind="offer", data={"sdp": "x"}))
    # Each side only sees the other side's signals, after its cursor.
    seen_by_client = await bookings.poll_signals(created.id, after=join.id, user=client)
    assert [s.kind for s in seen_by_client] == ["offer"]
    assert await bookings.poll_signals(created.id, after=offer.id, user=client) == []
    seen_by_host = await admin_bookings.host_poll_signals(created.id, after="000000000000000000000000")
    assert [s.kind for s in seen_by_host] == ["join"]

    done = await admin_bookings.complete(created.id)
    assert done.status == "completed"


async def test_client_cannot_join_long_before_slot():
    client, _, admin = await _users()
    created = await bookings.create_request(_request_in(), user=client)
    await admin_bookings.approve(
        created.id,
        ConsultationApproveIn(scheduled_at=datetime.now(timezone.utc) + timedelta(days=2), duration_minutes=30, amount=0),
    )
    r = await ConsultationRequest.get(created.id)
    r.status = "confirmed"
    await r.save()
    with pytest.raises(HTTPException) as e:
        await bookings.call_info(created.id, user=client)
    assert e.value.status_code == 425
    assert (await admin_bookings.host_call_info(created.id)).role == "host"


async def test_reject_and_cancel():
    client, _, _ = await _users()
    a = await bookings.create_request(_request_in(), user=client)
    assert (await admin_bookings.reject(a.id, ConsultationDecisionIn(note="Busy"))).status == "rejected"
    with pytest.raises(HTTPException):
        await bookings.cancel_request(a.id, user=client)

    b = await bookings.create_request(_request_in(topic="love"), user=client)
    assert (await bookings.cancel_request(b.id, user=client)).status == "cancelled"


def test_request_validation():
    with pytest.raises(ValueError):
        _request_in(topic="lottery")
    with pytest.raises(ValueError):
        _request_in(email="not-an-email")


async def test_upi_payment_info(monkeypatch):
    from app.core.config import get_settings

    client, _, _ = await _users()
    created = await bookings.create_request(_request_in(), user=client)
    await admin_bookings.approve(
        created.id, ConsultationApproveIn(scheduled_at=datetime.now(timezone.utc), duration_minutes=30, amount=2100)
    )
    monkeypatch.setattr(get_settings(), "upi_id", None)
    with pytest.raises(HTTPException) as e:
        await bookings.payment_info(created.id, user=client)
    assert e.value.status_code == 503

    monkeypatch.setattr(get_settings(), "upi_id", "vidushi@okbank")
    info = await bookings.payment_info(created.id, user=client)
    assert info.amount == 2100
    assert info.upi_uri.startswith("upi://pay?pa=vidushi%40okbank&pn=Vidushi%20Ji&am=2100.00&cu=INR&tn=")


async def test_payment_received_only_when_awaiting_payment():
    client, _, _ = await _users()
    created = await bookings.create_request(_request_in(), user=client)
    with pytest.raises(HTTPException):
        await admin_bookings.payment_received(created.id)  # still pending approval

