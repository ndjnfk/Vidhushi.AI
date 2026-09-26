import pytest
from fastapi import HTTPException

import app.api.routes.bookings as bookings_mod
from app.admin.routes import bookings as admin_bookings
from app.api.routes import bookings
from app.models.models import User
from app.schemas.schemas import ConsultationRequestIn

PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
BASE = dict(name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="other", photos=[PNG])


async def test_dob_is_saved_emailed_and_listed_for_the_admin(monkeypatch):
    sent: list[tuple[str, str, str]] = []

    async def fake_send(to, subject, body):
        sent.append((to, subject, body))

    async def fake_notify(subject, body):
        sent.append(("admins", subject, body))

    monkeypatch.setattr(bookings_mod, "send_email", fake_send)
    monkeypatch.setattr(bookings_mod, "notify_admins", fake_notify)
    client = User(email="asha@example.com", hashed_password="x")
    await client.insert()

    for extra in ({"session_id": "call-15"}, {"kind": "ritual"}):
        b = await bookings.create_request(ConsultationRequestIn(**BASE, **extra, dob="1995-03-12"), user=client)
        assert b.dob == "1995-03-12"
        admin_mail = next(body for to, _, body in reversed(sent) if to == "admins")
        client_mail = next(body for to, _, body in reversed(sent) if to == "asha@example.com")
        assert "Date of birth: 12 Mar 1995" in admin_mail
        assert "born 12 Mar 1995" in client_mail
        assert [r.dob for r in await admin_bookings.list_bookings(kind=b.kind)] == ["1995-03-12"]


async def test_dob_is_required_and_checked():
    client = User(email="asha@example.com", hashed_password="x")
    await client.insert()
    for extra in ({"session_id": "call-15"}, {"kind": "ritual"}):
        with pytest.raises(HTTPException) as e:
            await bookings.create_request(ConsultationRequestIn(**BASE, **extra), user=client)
        assert e.value.status_code == 422 and "date of birth" in e.value.detail
    for bad in ("2099-01-01", "1850-05-05", "12/03/1995", "1995-02-30"):
        with pytest.raises(ValueError):
            ConsultationRequestIn(**BASE, session_id="call-15", dob=bad)
