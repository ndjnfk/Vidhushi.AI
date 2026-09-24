import base64

import pytest
from fastapi import HTTPException

from app.admin.routes import bookings as admin_bookings
from app.admin.routes import payments as admin_payments
from app.api.routes import bookings
from app.core.config import get_settings
from app.core.notify import admin_recipients
from app.models.models import User
from app.schemas.schemas import ConsultationApproveIn, ConsultationRequestIn, UpiQrIn, UpiSettingsIn

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


async def _approved_booking():
    client = User(email="client@example.com", hashed_password="x")
    await client.insert()
    b = await bookings.create_request(
        ConsultationRequestIn(name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="career"),
        user=client,
    )
    from datetime import datetime, timezone
    await admin_bookings.approve(b.id, ConsultationApproveIn(scheduled_at=datetime.now(timezone.utc), duration_minutes=30, amount=2100))
    return client, b


async def test_uploaded_qr_is_shown_to_client(monkeypatch):
    monkeypatch.setattr(get_settings(), "upi_id", None)
    client, b = await _approved_booking()
    with pytest.raises(HTTPException) as e:
        await bookings.payment_info(b.id, user=client)
    assert e.value.status_code == 503

    data_url = "data:image/png;base64," + base64.b64encode(PNG_1PX).decode()
    saved = await admin_payments.upload_qr(UpiQrIn(data_url=data_url))
    assert saved.qr_image == data_url

    info = await bookings.payment_info(b.id, user=client)
    assert info.qr_image == data_url and info.upi_uri is None and info.amount == 2100

    await admin_payments.update_upi(UpiSettingsIn(upi_id="vidushi@okbank", payee_name="Vidushi Ji"))
    info = await bookings.payment_info(b.id, user=client)
    assert info.qr_image == data_url and info.upi_id == "vidushi@okbank"  # uploaded QR still wins

    await admin_payments.delete_qr()
    info = await bookings.payment_info(b.id, user=client)
    assert info.qr_image is None and info.upi_uri.startswith("upi://pay?pa=vidushi%40okbank")


@pytest.mark.parametrize("bad", [
    "not a data url",
    "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
    "data:image/png;base64," + base64.b64encode(b"GIF89a not a png").decode(),
    "data:image/png;base64,!!!",
])
async def test_qr_upload_validation(bad):
    with pytest.raises(HTTPException) as e:
        await admin_payments.upload_qr(UpiQrIn(data_url=bad))
    assert e.value.status_code == 422


async def test_admin_recipients_fall_back_to_admin_accounts(monkeypatch):
    await User(email="vidushi@example.com", hashed_password="x", is_admin=True).insert()
    await User(email="cust@example.com", hashed_password="x").insert()
    monkeypatch.setattr(get_settings(), "admin_notify_email", None)
    assert await admin_recipients() == ["vidushi@example.com"]
    monkeypatch.setattr(get_settings(), "admin_notify_email", "inbox@example.com")
    assert await admin_recipients() == ["inbox@example.com"]


async def test_counts():
    client, b = await _approved_booking()
    await bookings.create_request(
        ConsultationRequestIn(name="Ravi", email="r@example.com", phone="9876543210", place="Pune", topic="love"), user=client
    )
    from app.schemas.schemas import PaymentSubmittedIn
    await bookings.payment_submitted(b.id, PaymentSubmittedIn(reference="UTR1"), user=client)
    c = await admin_bookings.counts()
    assert c.pending == 1 and c.payment_submitted == 1
