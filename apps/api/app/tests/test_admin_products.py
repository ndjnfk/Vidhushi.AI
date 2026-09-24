import base64

import pytest
from fastapi import HTTPException

from app.admin.routes import products as admin_products
from app.api.routes import shop
from app.schemas.schemas import ImageUploadIn, ProductCreate, ProductUpdate

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


async def test_create_edit_hide_and_upload_image():
    p = await admin_products.create_product(ProductCreate(
        name="Moonstone Bracelet", description="Calming moonstone beads.", price=1299, compare_at_price=1599, stock_quantity=10,
    ))
    assert p.category == "bracelet" and p.is_active
    assert [x.name for x in await shop.list_products(category="bracelet")] == ["Moonstone Bracelet"]

    edited = await admin_products.update_product(p.id, ProductUpdate(price=1199, description="Updated text"))
    assert edited.price == 1199 and edited.description == "Updated text" and edited.compare_at_price == 1599

    await admin_products.update_product(p.id, ProductUpdate(is_active=False))
    assert await shop.list_products(category="bracelet") == []  # hidden from the shop
    assert len(await admin_products.list_products()) == 1  # still visible to the admin

    up = await admin_products.upload_image(p.id, ImageUploadIn(data_url="data:image/png;base64," + base64.b64encode(PNG).decode()))
    assert f"/shop/products/{p.id}/image?v=" in up.image_url
    resp = await shop.product_image(p.id)
    assert resp.body == PNG and resp.media_type == "image/png"


async def test_validation():
    with pytest.raises(HTTPException):  # sale price must be below the original price
        await admin_products.create_product(ProductCreate(name="X", price=1000, compare_at_price=900))
    with pytest.raises(ValueError):
        ProductCreate(name="X", price=-1)
    with pytest.raises(ValueError):
        ProductCreate(name="X", price=10, category="shoes")
    p = await admin_products.create_product(ProductCreate(name="Y", price=10))
    with pytest.raises(HTTPException) as e:
        await admin_products.upload_image(p.id, ImageUploadIn(data_url="data:image/png;base64,bm90IGFuIGltYWdl"))
    assert e.value.status_code == 422
    with pytest.raises(HTTPException) as e:
        await shop.product_image(p.id)
    assert e.value.status_code == 404
