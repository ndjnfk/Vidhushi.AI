"""Admin: shop products (bracelets etc.) — add, edit, hide/show, photo upload."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.live import PRODUCTS, bump
from app.core.config import get_settings
from app.core.upi import decode_image_upload
from app.models.models import Product, ProductImage
from app.schemas.schemas import ImageUploadIn, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/admin/products", tags=["admin"], dependencies=[Depends(get_current_admin)])

MAX_IMAGE_BYTES = 3 * 1024 * 1024


def product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=str(p.id), name=p.name, description=p.description, price=p.price,
        compare_at_price=p.compare_at_price, image_url=p.image_url, category=p.category,
        stock_quantity=p.stock_quantity, is_active=p.is_active,
    )


async def _get(product_id: str) -> Product:
    try:
        p = await Product.get(product_id)
    except Exception:
        p = None
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


def _check_prices(price: float, compare_at: float | None) -> None:
    if compare_at is not None and compare_at <= price:
        raise HTTPException(status_code=422, detail="The original (struck-through) price must be higher than the selling price")


@router.get("", response_model=list[ProductOut])
async def list_products():
    return [product_out(p) for p in await Product.find_all().sort("name").to_list()]


@router.post("", response_model=ProductOut)
async def create_product(payload: ProductCreate):
    _check_prices(payload.price, payload.compare_at_price)
    product = Product(**payload.model_dump())
    await product.insert()
    await bump(PRODUCTS)
    return product_out(product)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, payload: ProductUpdate):
    product = await _get(product_id)
    changes = payload.model_dump(exclude_unset=True)
    _check_prices(changes.get("price", product.price), changes.get("compare_at_price", product.compare_at_price))
    for field, value in changes.items():
        setattr(product, field, value)
    await product.save()
    await bump(PRODUCTS)
    return product_out(product)


@router.put("/{product_id}/image", response_model=ProductOut)
async def upload_image(product_id: str, payload: ImageUploadIn):
    product = await _get(product_id)
    try:
        raw, content_type = decode_image_upload(payload.data_url, MAX_IMAGE_BYTES)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    img = await ProductImage.find_one(ProductImage.product_id == product_id)
    if img is None:
        img = ProductImage(product_id=product_id, data=raw, content_type=content_type)
        await img.insert()
    else:
        img.data, img.content_type, img.updated_at = raw, content_type, datetime.utcnow()
        await img.save()
    # Version in the URL so browsers pick up a replaced photo straight away.
    version = int(img.updated_at.timestamp())
    product.image_url = f"{get_settings().api_public_url}/shop/products/{product_id}/image?v={version}"
    await product.save()
    await bump(PRODUCTS)
    return product_out(product)
