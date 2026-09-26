import pytest
from fastapi import HTTPException

from app.admin.routes import bookings as admin_bookings
from app.api.routes import bookings
from app.models.models import BookingPhoto, ConsultationRequest, User
from app.schemas.schemas import ConsultationRequestIn

PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
BASE = dict(name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="other")


async def _users():
    client = User(email="client@example.com", hashed_password="x")
    other = User(email="other@example.com", hashed_password="x")
    await client.insert()
    await other.insert()
    return client, other


async def test_the_photo_is_saved_and_private():
    client, other = await _users()
    b = await bookings.create_request(ConsultationRequestIn(**BASE, session_id="call-15", photos=[PNG], dob="1995-03-12"), user=client)
    assert b.photo_count == 1
    assert await bookings.my_photos(b.id, user=client) == [PNG]
    assert await admin_bookings.request_photos(b.id) == [PNG]
    with pytest.raises(HTTPException) as e:
        await bookings.my_photos(b.id, user=other)
    assert e.value.status_code == 403

    ritual = await bookings.create_request(ConsultationRequestIn(**BASE, kind="ritual", photos=[PNG], dob="1995-03-12"), user=client)
    assert ritual.photo_count == 1 and ritual.kind == "ritual"


async def test_sessions_and_rituals_need_exactly_one_photo():
    client, _ = await _users()
    for extra in ({"session_id": "call-15"}, {"kind": "ritual"}):
        with pytest.raises(HTTPException) as e:
            await bookings.create_request(ConsultationRequestIn(**BASE, **extra), user=client)
        assert e.value.status_code == 422
    with pytest.raises(ValueError):
        ConsultationRequestIn(**BASE, session_id="call-15", photos=[PNG, PNG])
    assert await ConsultationRequest.find_all().count() == 0

    # A general consultation (not a tarot session) doesn't ask for one.
    b = await bookings.create_request(ConsultationRequestIn(**BASE), user=client)
    assert b.photo_count == 0 and await bookings.my_photos(b.id, user=client) == []


async def test_bad_photo_rejects_the_whole_request():
    client, _ = await _users()
    with pytest.raises(HTTPException) as e:
        await bookings.create_request(
            ConsultationRequestIn(**BASE, kind="ritual", photos=["data:text/plain;base64,aGk="], dob="1995-03-12"), user=client)
    assert e.value.status_code == 422 and "Photo 1" in e.value.detail
    assert await ConsultationRequest.find_all().count() == 0
    assert await BookingPhoto.find_all().count() == 0
