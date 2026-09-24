import pytest
from fastapi import HTTPException

from app.admin.routes.maintenance import ClearDataIn, clear_data
from app.core.security import hash_password
from app.core.site import get_site_settings
from app.models.models import ContactMessage, ConsultationRequest, Product, ShopOrder, User


async def _seed():
    admin = User(email="admin@example.com", hashed_password=hash_password("Secret123"), is_admin=True)
    await admin.insert()
    client = User(email="client@example.com", hashed_password="x")
    await client.insert()
    await Product(name="Bracelet", description="Beads", price=499, category="bracelet").insert()
    await ConsultationRequest(user_id=str(client.id), name="A", email="a@example.com", phone="9876543210",
                              place="Delhi", topic="career").insert()
    await ShopOrder.get_motor_collection().insert_one({"user_id": str(client.id), "status": "placed"})
    await ContactMessage(name="A", email="a@example.com", message="Hi").insert()
    site = await get_site_settings()
    site.phone = "+91 90000 11111"
    await site.insert()
    return admin


async def test_clears_users_consultations_products_orders_only():
    admin = await _seed()
    out = await clear_data(ClearDataIn(password="Secret123", confirm="DELETE"), admin=admin)
    assert out["total"] == 4
    assert [u.email for u in await User.find_all().to_list()] == ["admin@example.com"]
    assert await Product.count() == 0 and await ConsultationRequest.count() == 0
    assert await ShopOrder.get_motor_collection().count_documents({}) == 0
    # Kept: contact messages and site settings.
    assert await ContactMessage.count() == 1
    assert (await get_site_settings()).phone == "+91 90000 11111"


@pytest.mark.parametrize("password,confirm", [("wrong", "DELETE"), ("Secret123", "delete"), ("Secret123", "")])
async def test_needs_password_and_confirm_word(password, confirm):
    admin = await _seed()
    with pytest.raises(HTTPException) as e:
        await clear_data(ClearDataIn(password=password, confirm=confirm), admin=admin)
    assert e.value.status_code == 400
    assert await Product.count() == 1 and await User.count() == 2
