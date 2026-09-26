from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.email import send_email
from app.core.notify import notify_admins
from app.core.live import bump, user_topic
from app.core.orders import (
    address_text,
    items_text,
    new_order_number,
    order_out,
    payment_plan,
    release_stock,
    reserve_stock,
    set_status,
)
from app.core.upi import get_upi_settings, qr_data_url, upi_uri
from app.models.models import OrderStatusEvent, Product, ProductImage, ShopOrder, ShopOrderItem, ShippingAddress, User
from app.schemas.schemas import (
    CartItemIn,
    CheckoutIn,
    PaymentPlanIn,
    PaymentPlanOut,
    PaymentSubmittedIn,
    ProductOut,
    ShopOrderOut,
    UpiPaymentInfoOut,
)

router = APIRouter(prefix="/shop", tags=["shop"])


def _product_out(p: Product) -> ProductOut:
    return ProductOut(
        id=str(p.id), name=p.name, description=p.description, price=p.price,
        compare_at_price=p.compare_at_price, image_url=p.image_url, category=p.category, stock_quantity=p.stock_quantity,
    )


@router.get("/products", response_model=list[ProductOut])
async def list_products(category: str | None = None):
    query: dict = {"is_active": True}
    if category:
        query["category"] = category
    products = await Product.find(query).to_list()
    return [_product_out(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    product = await Product.get(product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_out(product)


@router.get("/products/{product_id}/image")
async def product_image(product_id: str):
    img = await ProductImage.find_one(ProductImage.product_id == product_id)
    if img is None:
        raise HTTPException(status_code=404, detail="No image")
    # URLs carry ?v=<timestamp>, so a new upload gets a new URL: cache hard.
    return Response(content=img.data, media_type=img.content_type,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})


async def _cart(items: list[CartItemIn], check_stock: bool) -> list[tuple[Product, int]]:
    """Merge duplicate lines and load each product (optionally checking stock)."""
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    wanted: dict[str, int] = {}
    for line in items:
        wanted[line.product_id] = wanted.get(line.product_id, 0) + line.quantity
    products = []
    for pid, qty in wanted.items():
        try:
            product = await Product.get(pid)
        except Exception:
            product = None
        if product is None or not product.is_active:
            raise HTTPException(status_code=404, detail="A product in your cart is no longer available")
        if check_stock and product.stock_quantity < qty:
            raise HTTPException(status_code=400, detail=f"'{product.name}' has only {product.stock_quantity} in stock")
        products.append((product, qty))
    return products


def _total(products: list[tuple[Product, int]]) -> float:
    return round(sum(p_.price * q_ for p_, q_ in products), 2)


@router.post("/payment-plan", response_model=PaymentPlanOut)
async def get_payment_plan(payload: PaymentPlanIn):
    """What checkout will ask for, so the page can show it before ordering."""
    total = _total(await _cart(payload.items, check_stock=False))
    method, advance, cod = payment_plan(payload.pincode, total)
    return PaymentPlanOut(method=method, total=total, advance_amount=advance, cod_amount=cod)


@router.post("/checkout", response_model=ShopOrderOut)
async def checkout(payload: CheckoutIn, user: User = Depends(get_current_user)):
    """Place an order. Stock is reserved immediately. Depending on the delivery
    pincode it is fully Cash on Delivery, or needs an online advance first."""
    # Validate everything before touching stock.
    products = await _cart(payload.items, check_stock=True)

    reserved = []
    for product, qty in products:
        if not await reserve_stock(product.id, qty):
            for p_, q_ in reserved:  # someone else bought it meanwhile: undo
                await Product.get_motor_collection().update_one({"_id": p_.id}, {"$inc": {"stock_quantity": q_}})
            raise HTTPException(status_code=409, detail=f"'{product.name}' just went out of stock")
        reserved.append((product, qty))

    total = _total(products)
    method, advance, cod = payment_plan(payload.shipping_address.pincode, total)
    status = "placed" if method == "cod" else "pending_payment"
    order = ShopOrder(
        user_id=str(user.id),
        items=[ShopOrderItem(product_id=str(p_.id), product_name=p_.name, quantity=q_, unit_price=p_.price)
               for p_, q_ in products],
        shipping_address=ShippingAddress(**payload.shipping_address.model_dump()),
        total_amount=total, status=status, payment_method=method, advance_amount=advance, cod_amount=cod,
        order_number=new_order_number(), customer_email=user.email,
        history=[OrderStatusEvent(status=status)],
    )
    await order.insert()

    s = get_settings()
    if method == "partial":
        await notify_admins(
            f"New order {order.order_number} — Rs {total:,.0f} (awaiting Rs {advance:,.0f} advance)",
            f"A new order has been placed. It ships once the online advance is received.\n\n"
            f"Order: {order.order_number}\nCustomer: {user.email}\n\nItems:\n{items_text(order)}\n\n"
            f"Total: Rs {total:,.0f}\nAdvance (UPI): Rs {advance:,.0f}\nTo collect on delivery: Rs {cod:,.0f}\n\n"
            f"Ship to:\n{address_text(order)}\n\nManage it in the admin panel: {s.frontend_url}/admin/orders\n",
        )
        await send_email(
            user.email,
            f"Order {order.order_number} — please pay the advance to confirm",
            f"Namaste {order.shipping_address.full_name},\n\nThank you for your order!\n\nOrder: {order.order_number}\n"
            f"Items:\n{items_text(order)}\n\nTotal: Rs {total:,.0f}\n"
            f"  Pay now (UPI): Rs {advance:,.0f}\n  Pay on delivery: Rs {cod:,.0f}\n\n"
            f"Please pay the advance by scanning the UPI QR code on your order page. Your order is confirmed "
            f"and shipped once Vidushi Ji receives it:\n{s.frontend_url}/orders/{order.id}\n\n"
            f"Delivering to:\n{address_text(order)}\n\n— Vidushi Ji",
        )
        return order_out(order)

    await notify_admins(
        f"New order {order.order_number} — Rs {order.total_amount:,.0f} (Cash on Delivery)",
        f"A new Cash on Delivery order has been placed.\n\nOrder: {order.order_number}\n"
        f"Customer: {user.email}\n\nItems:\n{items_text(order)}\n\nTotal to collect: Rs {order.total_amount:,.0f}\n\n"
        f"Ship to:\n{address_text(order)}\n\nManage it in the admin panel: {s.frontend_url}/admin/orders\n",
    )
    await send_email(
        user.email,
        f"Order {order.order_number} placed — Cash on Delivery",
        f"Namaste {order.shipping_address.full_name},\n\nThank you for your order!\n\nOrder: {order.order_number}\n"
        f"Items:\n{items_text(order)}\n\nAmount to pay on delivery: Rs {order.total_amount:,.0f}\n\n"
        f"Delivering to:\n{address_text(order)}\n\nTrack your order: {s.frontend_url}/orders/{order.id}\n\n— Vidushi Ji",
    )
    return order_out(order)


async def _my_order(order_id: str, user: User) -> ShopOrder:
    try:
        o = await ShopOrder.get(order_id)
    except Exception:
        o = None
    if o is None or o.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@router.get("/orders", response_model=list[ShopOrderOut])
async def my_orders(user: User = Depends(get_current_user)):
    rows = await ShopOrder.find(ShopOrder.user_id == str(user.id)).sort("-created_at").to_list()
    return [order_out(o) for o in rows]


@router.get("/orders/{order_id}", response_model=ShopOrderOut)
async def get_order(order_id: str, user: User = Depends(get_current_user)):
    return order_out(await _my_order(order_id, user))


@router.post("/orders/{order_id}/cancel", response_model=ShopOrderOut)
async def cancel_order(order_id: str, user: User = Depends(get_current_user)):
    """Customers can cancel until the order ships; stock goes back. (Once they
    say they've paid the advance, only Vidushi Ji can cancel — she refunds.)"""
    o = await _my_order(order_id, user)
    if o.status not in ("pending_payment", "placed", "confirmed"):
        raise HTTPException(status_code=400, detail="This order can no longer be cancelled")
    set_status(o, "cancelled", "Cancelled by customer")
    await o.save()
    await release_stock(o)
    await notify_admins(
        f"Order {o.order_number} cancelled by the customer",
        f"{o.customer_email} cancelled order {o.order_number} (Rs {o.total_amount:,.0f}). Stock has been restored.\n",
    )
    return order_out(o)


# ---------------------------------------------------------------- online advance (UPI)
# Same flow as consultations: QR -> "I have paid" -> Vidushi Ji confirms in the
# admin panel (app.admin.routes.orders.payment_received).

@router.get("/orders/{order_id}/payment-info", response_model=UpiPaymentInfoOut)
async def payment_info(order_id: str, user: User = Depends(get_current_user)):
    o = await _my_order(order_id, user)
    if o.status not in ("pending_payment", "payment_submitted") or o.advance_amount <= 0:
        raise HTTPException(status_code=400, detail="This order is not awaiting payment")
    upi = await get_upi_settings()
    qr = qr_data_url(upi)
    if not qr and not upi.upi_id:
        raise HTTPException(status_code=503, detail="upi_not_configured")
    note = f"Vidushi Ji order {o.order_number}"
    return UpiPaymentInfoOut(
        upi_id=upi.upi_id, payee_name=upi.payee_name, amount=o.advance_amount, note=note,
        upi_uri=None if qr else upi_uri(upi.upi_id, upi.payee_name, o.advance_amount, note),
        qr_image=qr,
    )


@router.post("/orders/{order_id}/payment-submitted", response_model=ShopOrderOut)
async def payment_submitted(order_id: str, payload: PaymentSubmittedIn, user: User = Depends(get_current_user)):
    """Customer says they've paid the advance; Vidushi Ji confirms it arrived."""
    o = await _my_order(order_id, user)
    if o.status not in ("pending_payment", "payment_submitted"):
        raise HTTPException(status_code=400, detail="This order is not awaiting payment")
    o.payment_reference = payload.reference.strip()
    o.payment_submitted_at = datetime.utcnow()
    if o.status != "payment_submitted":
        set_status(o, "payment_submitted")
    await o.save()
    await bump(user_topic(o.user_id))
    s = get_settings()
    await notify_admins(
        f"{o.shipping_address.full_name} says they paid Rs {o.advance_amount:,.0f} for order {o.order_number}",
        f"Order {o.order_number}: the customer marked the Rs {o.advance_amount:,.0f} advance as paid by UPI.\n"
        f"Transaction reference: {o.payment_reference or '(not given)'}\n\n"
        f"Please check your UPI app, then click \"Payment received\" in the admin panel:\n{s.frontend_url}/admin/orders\n",
    )
    return order_out(o)
