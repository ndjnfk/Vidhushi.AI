import pytest
from fastapi import HTTPException

import app.core.email as email_mod
import app.core.notify as notify_mod
import app.api.routes.shop as shop_routes
import app.core.orders as orders_mod
from app.admin.routes import orders as admin_orders
from app.api.routes import shop
from app.models.models import Product, User
from app.schemas.schemas import CartItemIn, CheckoutIn, ShippingAddressIn, ShopOrderStatusIn


@pytest.fixture
def emails(monkeypatch):
    sent = []

    async def fake(to, subject, body):
        sent.append((to, subject, body))

    for mod in (email_mod, notify_mod, shop_routes, orders_mod):
        monkeypatch.setattr(mod, "send_email", fake)
    return sent


ADDRESS = ShippingAddressIn(full_name="Asha Verma", phone="9876543210", line1="12 MG Road", city="Delhi", state="Delhi", pincode="110001")


async def _setup():
    customer = User(email="asha@example.com", hashed_password="x")
    other = User(email="other@example.com", hashed_password="x")
    admin = User(email="vidushi@example.com", hashed_password="x", is_admin=True)
    for u in (customer, other, admin):
        await u.insert()
    p1 = Product(name="Rudraksha Bracelet", description="", price=899, category="bracelet", stock_quantity=5)
    p2 = Product(name="Amethyst Bracelet", description="", price=999, category="bracelet", stock_quantity=1)
    await p1.insert()
    await p2.insert()
    return customer, other, p1, p2


async def test_cod_checkout_reserves_stock_and_emails(emails):
    customer, other, p1, p2 = await _setup()
    o = await shop.checkout(
        CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=1), CartItemIn(product_id=str(p1.id), quantity=1),
                          CartItemIn(product_id=str(p2.id), quantity=1)], shipping_address=ADDRESS),
        user=customer,
    )
    assert o.status == "placed" and o.payment_method == "cod" and o.order_number.startswith("VJ-")
    assert o.total_amount == 2 * 899 + 999 and [i.quantity for i in o.items] == [2, 1]  # duplicate lines merged
    assert (await Product.get(p1.id)).stock_quantity == 3 and (await Product.get(p2.id)).stock_quantity == 0
    recipients = {to for to, *_ in emails}
    assert recipients == {"vidushi@example.com", "asha@example.com"}
    assert any(o.order_number in subj and "Cash on Delivery" in subj for _, subj, _ in emails)

    assert [x.id for x in await shop.my_orders(user=customer)] == [o.id]
    with pytest.raises(HTTPException) as e:
        await shop.get_order(o.id, user=other)
    assert e.value.status_code == 404

    # Out of stock now
    with pytest.raises(HTTPException) as e:
        await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p2.id), quantity=1)], shipping_address=ADDRESS), user=customer)
    assert e.value.status_code == 400


async def test_customer_cancel_restores_stock(emails):
    customer, _, p1, _ = await _setup()
    o = await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=2)], shipping_address=ADDRESS), user=customer)
    cancelled = await shop.cancel_order(o.id, user=customer)
    assert cancelled.status == "cancelled" and [h.status for h in cancelled.history] == ["placed", "cancelled"]
    assert (await Product.get(p1.id)).stock_quantity == 5
    with pytest.raises(HTTPException):
        await shop.cancel_order(o.id, user=customer)


async def test_admin_status_flow_emails_customer_and_tracks(emails):
    customer, _, p1, _ = await _setup()
    o = await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=1)], shipping_address=ADDRESS), user=customer)
    emails.clear()

    assert (await admin_orders.counts())["open"] == 1
    await admin_orders.update_status(o.id, ShopOrderStatusIn(status="confirmed"))
    shipped = await admin_orders.update_status(
        o.id, ShopOrderStatusIn(status="shipped", courier="Delhivery", tracking_number="DLV123", note="Dispatched today")
    )
    assert shipped.courier == "Delhivery" and shipped.tracking_number == "DLV123"
    assert [h.status for h in shipped.history] == ["placed", "confirmed", "shipped"]
    with pytest.raises(HTTPException):
        await shop.cancel_order(o.id, user=customer)  # too late once shipped
    with pytest.raises(HTTPException):
        await admin_orders.update_status(o.id, ShopOrderStatusIn(status="placed"))  # can't go backwards
    delivered = await admin_orders.update_status(o.id, ShopOrderStatusIn(status="delivered"))
    assert delivered.status == "delivered" and (await admin_orders.counts())["open"] == 0

    assert [to for to, *_ in emails] == ["asha@example.com"] * 3
    assert "DLV123" in emails[1][2] and "Delhivery" in emails[1][2]


def test_address_validation():
    with pytest.raises(ValueError):
        ShippingAddressIn(full_name="", phone="98", line1="x", city="x", state="x", pincode="1")
