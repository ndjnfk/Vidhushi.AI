from fastapi import APIRouter, Depends, HTTPException

from datetime import datetime

from app.core.deps import get_current_admin_user
from app.models.models import BlogPost, PoojaService, Product, RitualService, ShopOrder, User, Vendor, VendorBranding
from app.payments.factory import SUPPORTED_GATEWAYS, get_payment_settings, resolve_credentials
from app.schemas.schemas import (
    BlogPostCreate,
    BlogPostOut,
    BlogPostUpdate,
    PaymentSettingsOut,
    PaymentSettingsUpdate,
    PoojaServiceCreate,
    PoojaServiceOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    RitualServiceCreate,
    RitualServiceOut,
    ShopOrderOut,
    StorefrontUpdate,
    VendorAdminOut,
    VendorCreate,
    VendorStatusUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin_user)])


def _vendor_out(v: Vendor) -> VendorAdminOut:
    return VendorAdminOut(
        id=str(v.id), name=v.name, vendor_type=v.vendor_type, bio=v.bio,
        languages=v.languages, specialties=v.specialties, experience_years=v.experience_years,
        rate_per_session=v.rate_per_session, is_online=v.is_online, rating=v.rating,
        contact_email=v.contact_email, contact_phone=v.contact_phone,
        commission_rate=v.commission_rate, status=v.status,
        storefront_slug=v.storefront_slug, custom_domain=v.custom_domain,
        is_white_label_enabled=v.is_white_label_enabled,
    )


# ---- Payment settings ----

@router.get("/payment-settings", response_model=PaymentSettingsOut)
async def get_payment_settings_route():
    settings_doc = await get_payment_settings()
    configured = [
        name for name in SUPPORTED_GATEWAYS
        if name == "mock" or _has_credentials(name, resolve_credentials(name, settings_doc))
    ]
    return PaymentSettingsOut(
        active_gateway=settings_doc.active_gateway,
        enabled_payment_methods=settings_doc.enabled_payment_methods,
        configured_gateways=configured,
    )


def _has_credentials(name: str, creds: dict) -> bool:
    required = {
        "razorpay": ["key_id", "key_secret"],
        "payu": ["merchant_key", "salt"],
        "stripe": ["secret_key"],
        "cashfree": ["app_id", "secret_key"],
    }.get(name, [])
    return all(creds.get(k) for k in required)


@router.put("/payment-settings", response_model=PaymentSettingsOut)
async def update_payment_settings(payload: PaymentSettingsUpdate):
    if payload.active_gateway not in SUPPORTED_GATEWAYS:
        raise HTTPException(status_code=400, detail=f"Unknown gateway '{payload.active_gateway}'")

    settings_doc = await get_payment_settings()
    settings_doc.active_gateway = payload.active_gateway
    if payload.enabled_payment_methods is not None:
        settings_doc.enabled_payment_methods = payload.enabled_payment_methods
    if payload.credentials:
        for gateway_name, creds in payload.credentials.items():
            settings_doc.credentials.setdefault(gateway_name, {}).update(creds)
    await settings_doc.save()

    configured = [
        name for name in SUPPORTED_GATEWAYS
        if name == "mock" or _has_credentials(name, resolve_credentials(name, settings_doc))
    ]
    return PaymentSettingsOut(
        active_gateway=settings_doc.active_gateway,
        enabled_payment_methods=settings_doc.enabled_payment_methods,
        configured_gateways=configured,
    )


# ---- Vendor management ----

@router.get("/vendors", response_model=list[VendorAdminOut])
async def list_vendors(status: str | None = None):
    query = Vendor.find({"status": status}) if status else Vendor.find_all()
    vendors = await query.to_list()
    return [_vendor_out(v) for v in vendors]


@router.post("/vendors", response_model=VendorAdminOut)
async def create_vendor(payload: VendorCreate):
    vendor = Vendor(**payload.model_dump())
    await vendor.insert()
    return _vendor_out(vendor)


@router.put("/vendors/{vendor_id}/status", response_model=VendorAdminOut)
async def update_vendor_status(vendor_id: str, payload: VendorStatusUpdate):
    vendor = await Vendor.get(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if payload.status not in {"pending_approval", "active", "suspended", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    vendor.status = payload.status
    await vendor.save()
    return _vendor_out(vendor)


@router.put("/vendors/{vendor_id}/storefront", response_model=VendorAdminOut)
async def update_vendor_storefront(vendor_id: str, payload: StorefrontUpdate):
    """White-label setup: domain/slug are just a mapping in our DB — actually
    pointing DNS (e.g. via Cloudflare) at this deployment happens outside
    the app, so there's no verification flow here, just the mapping."""
    vendor = await Vendor.get(vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if payload.storefront_slug is not None:
        existing = await Vendor.find_one({"storefront_slug": payload.storefront_slug, "_id": {"$ne": vendor.id}})
        if existing is not None:
            raise HTTPException(status_code=400, detail=f"Slug '{payload.storefront_slug}' is already in use")
        vendor.storefront_slug = payload.storefront_slug

    if payload.custom_domain is not None:
        normalized = payload.custom_domain.lower().strip()
        existing = await Vendor.find_one({"custom_domain": normalized, "_id": {"$ne": vendor.id}})
        if existing is not None:
            raise HTTPException(status_code=400, detail=f"Domain '{normalized}' is already in use")
        vendor.custom_domain = normalized

    if payload.is_white_label_enabled is not None:
        vendor.is_white_label_enabled = payload.is_white_label_enabled

    if payload.branding is not None:
        vendor.branding = VendorBranding(**payload.branding.model_dump())

    await vendor.save()
    return _vendor_out(vendor)


@router.get("/vendors/{vendor_id}/payouts")
async def vendor_payouts(vendor_id: str):
    from app.models.models import Order

    orders = await Order.find({"vendor_id": vendor_id, "status": "paid"}).to_list()
    owed = sum(o.vendor_payout_amount or 0 for o in orders if o.payout_status == "owed")
    paid_out = sum(o.vendor_payout_amount or 0 for o in orders if o.payout_status == "paid_out")
    return {"vendor_id": vendor_id, "owed": owed, "paid_out": paid_out, "order_count": len(orders)}


@router.post("/vendors/{vendor_id}/payouts/mark-paid")
async def mark_vendor_payouts_paid(vendor_id: str):
    from app.models.models import Order

    orders = await Order.find({"vendor_id": vendor_id, "payout_status": "owed"}).to_list()
    for order in orders:
        order.payout_status = "paid_out"
        await order.save()
    return {"vendor_id": vendor_id, "marked_count": len(orders)}


# ---- Catalog management ----

@router.post("/poojas", response_model=PoojaServiceOut)
async def create_pooja_service(payload: PoojaServiceCreate):
    service = PoojaService(**payload.model_dump())
    await service.insert()
    return PoojaServiceOut(
        id=str(service.id), name=service.name, description=service.description,
        service_type=service.service_type, price=service.price, duration_minutes=service.duration_minutes,
    )


@router.post("/rituals", response_model=RitualServiceOut)
async def create_ritual_service(payload: RitualServiceCreate):
    service = RitualService(**payload.model_dump())
    await service.insert()
    return RitualServiceOut(
        id=str(service.id), name=service.name, description=service.description,
        price_min=service.price_min, price_max=service.price_max,
    )


# ---- Blog management ----

def _blog_out(p: BlogPost) -> BlogPostOut:
    return BlogPostOut(
        id=str(p.id), title=p.title, slug=p.slug, excerpt=p.excerpt, body=p.body,
        tags=p.tags, author_name=p.author_name, created_at=p.created_at, updated_at=p.updated_at,
    )


@router.get("/blog", response_model=list[BlogPostOut])
async def admin_list_posts():
    posts = await BlogPost.find_all().sort("-created_at").to_list()
    return [_blog_out(p) for p in posts]


@router.post("/blog", response_model=BlogPostOut)
async def create_post(payload: BlogPostCreate):
    existing = await BlogPost.find_one({"slug": payload.slug})
    if existing is not None:
        raise HTTPException(status_code=400, detail=f"Slug '{payload.slug}' already in use")
    post = BlogPost(**payload.model_dump())
    await post.insert()
    return _blog_out(post)


@router.put("/blog/{post_id}", response_model=BlogPostOut)
async def update_post(post_id: str, payload: BlogPostUpdate):
    post = await BlogPost.get(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    post.updated_at = datetime.utcnow()
    await post.save()
    return _blog_out(post)


@router.delete("/blog/{post_id}")
async def delete_post(post_id: str):
    post = await BlogPost.get(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    await post.delete()
    return {"deleted": True}


# ---- Shop management ----

def _product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=str(p.id), name=p.name, description=p.description, price=p.price,
        image_url=p.image_url, category=p.category, stock_quantity=p.stock_quantity,
    )


@router.get("/products", response_model=list[ProductOut])
async def admin_list_products():
    products = await Product.find_all().to_list()
    return [_product_out(p) for p in products]


@router.post("/products", response_model=ProductOut)
async def create_product(payload: ProductCreate):
    product = Product(**payload.model_dump())
    await product.insert()
    return _product_out(product)


@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, payload: ProductUpdate):
    product = await Product.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await product.save()
    return _product_out(product)


@router.get("/shop-orders", response_model=list[ShopOrderOut])
async def admin_list_shop_orders(status: str | None = None):
    query = ShopOrder.find({"status": status}) if status else ShopOrder.find_all()
    orders = await query.sort("-created_at").to_list()
    from app.schemas.schemas import ShopOrderItemOut

    return [
        ShopOrderOut(
            id=str(o.id),
            items=[ShopOrderItemOut(**item.model_dump()) for item in o.items],
            total_amount=o.total_amount, status=o.status, order=None,
        )
        for o in orders
    ]


@router.put("/shop-orders/{order_id}/status")
async def update_shop_order_status(order_id: str, status: str):
    if status not in {"pending_payment", "confirmed", "shipped", "delivered", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = await ShopOrder.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    await order.save()
    return {"id": str(order.id), "status": order.status}
    return {"deleted": True}
