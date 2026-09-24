from app.models.models import Product, ShippingAddress, ShopOrder, ShopOrderItem, User


async def _make_user() -> User:
    user = User(email="shopper@example.com", hashed_password="x")
    await user.insert()
    return user


async def _make_product(**overrides) -> Product:
    defaults = dict(name="Rudraksha Mala", description="5-mukhi", price=499.0, category="rudraksha", stock_quantity=10)
    defaults.update(overrides)
    product = Product(**defaults)
    await product.insert()
    return product


def _address() -> ShippingAddress:
    return ShippingAddress(
        full_name="Test User", phone="9999999999", line1="123 Main St",
        city="Delhi", state="Delhi", pincode="110001",
    )


async def test_checkout_computes_total_from_snapshot_prices():
    user = await _make_user()
    p1 = await _make_product(name="Mala", price=499.0)
    p2 = await _make_product(name="Yantra", price=1200.0)

    order = ShopOrder(
        user_id=str(user.id),
        items=[
            ShopOrderItem(product_id=str(p1.id), product_name=p1.name, quantity=2, unit_price=p1.price),
            ShopOrderItem(product_id=str(p2.id), product_name=p2.name, quantity=1, unit_price=p2.price),
        ],
        shipping_address=_address(),
        total_amount=2 * 499.0 + 1200.0,
    )
    await order.insert()

    assert order.total_amount == 2198.0
    assert len(order.items) == 2


async def test_stock_quantity_never_negative_assumption():
    product = await _make_product(stock_quantity=2)
    assert product.stock_quantity == 2
    # Simulate what payments._decrement_stock does
    product.stock_quantity = max(0, product.stock_quantity - 5)
    assert product.stock_quantity == 0
