"""Orders outside the local pincode: 60% online advance (UPI), 40% on delivery."""
import pytest
from fastapi import HTTPException

import app.admin.routes.orders as admin_orders_mod
from app.admin.routes import orders as admin_orders
from app.api.routes import shop
from app.core.orders import payment_plan
from app.models.models import Product, UpiSettings
from app.schemas.schemas import CartItemIn, CheckoutIn, PaymentPlanIn, PaymentSubmittedIn, ShippingAddressIn, ShopOrderStatusIn
from app.tests.test_orders_cod import ADDRESS, _setup, emails  # noqa: F401 (fixture)

FAR = ShippingAddressIn(full_name="Ravi Kumar", phone="9876543210", line1="5 Park St", city="Kolkata",
                        state="West Bengal", pincode="700016")


def test_payment_plan_rule():
    assert payment_plan("247001", 1798) == ("cod", 0.0, 1798)
    assert payment_plan(" 247 001 ", 999) == ("cod", 0.0, 999)
    assert payment_plan("700016", 1798) == ("partial", 1079.0, 719.0)  # 60% rounded to the rupee
    assert payment_plan("110001", 999) == ("partial", 599.0, 400.0)


async def test_plan_endpoint_shows_amounts_only(emails):
    customer, _, p1, _ = await _setup()
    local = await shop.get_payment_plan(PaymentPlanIn(items=[CartItemIn(product_id=str(p1.id), quantity=2)], pincode="247001"))
    assert (local.method, local.total, local.advance_amount, local.cod_amount) == ("cod", 1798, 0, 1798)
    far = await shop.get_payment_plan(PaymentPlanIn(items=[CartItemIn(product_id=str(p1.id), quantity=2)], pincode="700016"))
    assert (far.method, far.advance_amount, far.cod_amount) == ("partial", 1079, 719)
    assert "247001" not in far.model_dump_json()


async def test_advance_order_flow(emails, monkeypatch):
    customer, other, p1, _ = await _setup()
    admin_sent = []

    async def fake(to, subject, body):
        admin_sent.append((to, subject, body))

    monkeypatch.setattr(admin_orders_mod, "send_email", fake)
    await UpiSettings(upi_id="vidushi@upi", payee_name="Vidushi Ji").insert()

    o = await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=2)], shipping_address=FAR),
                            user=customer)
    assert o.status == "pending_payment" and o.payment_method == "partial"
    assert (o.total_amount, o.advance_amount, o.cod_amount) == (1798, 1079, 719)
    assert (await Product.get(p1.id)).stock_quantity == 3  # reserved straight away
    customer_mail = next(m for m in emails if m[0] == customer.email)
    assert "Pay now (UPI): Rs 1,079" in customer_mail[2] and "Pay on delivery: Rs 719" in customer_mail[2]
    assert "247001" not in customer_mail[2]

    info = await shop.payment_info(o.id, user=customer)
    assert info.amount == 1079 and info.upi_uri and "am=1079.00" in info.upi_uri
    with pytest.raises(HTTPException):
        await shop.payment_info(o.id, user=other)

    # Can't ship before the advance is confirmed.
    with pytest.raises(HTTPException):
        await admin_orders.update_status(o.id, ShopOrderStatusIn(status="shipped"))

    submitted = await shop.payment_submitted(o.id, PaymentSubmittedIn(reference=" UTR123 "), user=customer)
    assert submitted.status == "payment_submitted" and submitted.payment_reference == "UTR123"
    with pytest.raises(HTTPException):
        await shop.cancel_order(o.id, user=customer)  # money may have moved: admin handles it
    assert (await admin_orders.counts())["open"] == 1

    confirmed = await admin_orders.payment_received(o.id)
    assert confirmed.status == "confirmed" and confirmed.history[-1].note == "Advance of Rs 1,079 received"
    assert "Amount to pay on delivery: Rs 719" in admin_sent[-1][2]
    with pytest.raises(HTTPException):
        await admin_orders.payment_received(o.id)
    with pytest.raises(HTTPException):
        await shop.payment_info(o.id, user=customer)  # nothing more to pay online


async def test_local_order_is_fully_cod(emails):
    customer, _, p1, _ = await _setup()
    o = await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=1)], shipping_address=ADDRESS),
                            user=customer)
    assert (o.status, o.payment_method, o.advance_amount, o.cod_amount) == ("placed", "cod", 0, 899)
    with pytest.raises(HTTPException):
        await shop.payment_info(o.id, user=customer)


async def test_unpaid_advance_order_can_be_cancelled(emails):
    customer, _, p1, _ = await _setup()
    o = await shop.checkout(CheckoutIn(items=[CartItemIn(product_id=str(p1.id), quantity=1)], shipping_address=FAR),
                            user=customer)
    cancelled = await shop.cancel_order(o.id, user=customer)
    assert cancelled.status == "cancelled" and (await Product.get(p1.id)).stock_quantity == 5
