"""Shop (bracelet) orders: Cash on Delivery only. Shared by the customer
routes (app.api.routes.shop) and the admin routes (app.admin.routes.orders)."""
import secrets
from datetime import datetime

from app.core.config import get_settings
from app.core.email import send_email
from app.models.models import OrderStatusEvent, Product, ShopOrder
from app.schemas.schemas import OrderStatusEventOut, ShippingAddressIn, ShopOrderItemOut, ShopOrderOut

STATUS_LABEL = {
    "placed": "Order placed",
    "confirmed": "Confirmed",
    "shipped": "Shipped",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    "pending_payment": "Awaiting payment",
}
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I


def new_order_number() -> str:
    return "VJ-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))


def order_out(o: ShopOrder) -> ShopOrderOut:
    history = o.history or [OrderStatusEvent(status=o.status, at=o.created_at)]
    return ShopOrderOut(
        id=str(o.id), order_number=o.order_number or str(o.id)[-8:].upper(),
        items=[ShopOrderItemOut(**i.model_dump()) for i in o.items],
        total_amount=o.total_amount, status=o.status, payment_method=o.payment_method,
        shipping_address=ShippingAddressIn(**o.shipping_address.model_dump()),
        customer_email=o.customer_email, courier=o.courier, tracking_number=o.tracking_number,
        history=[OrderStatusEventOut(**h.model_dump()) for h in history], created_at=o.created_at,
    )


async def reserve_stock(product_id, quantity: int) -> bool:
    """Atomically take `quantity` from stock; False if not enough left."""
    res = await Product.get_motor_collection().update_one(
        {"_id": product_id, "stock_quantity": {"$gte": quantity}}, {"$inc": {"stock_quantity": -quantity}}
    )
    return res.modified_count == 1


async def release_stock(o: ShopOrder) -> None:
    from beanie import PydanticObjectId

    for item in o.items:
        await Product.get_motor_collection().update_one(
            {"_id": PydanticObjectId(item.product_id)}, {"$inc": {"stock_quantity": item.quantity}}
        )


def set_status(o: ShopOrder, status: str, note: str = "") -> None:
    o.status = status
    o.updated_at = datetime.utcnow()
    o.history.append(OrderStatusEvent(status=status, note=note))


def items_text(o: ShopOrder) -> str:
    return "\n".join(f"  - {i.product_name} x {i.quantity}  = Rs {i.unit_price * i.quantity:,.0f}" for i in o.items)


def address_text(o: ShopOrder) -> str:
    a = o.shipping_address
    lines = [a.full_name, a.line1, a.line2 or "", f"{a.city}, {a.state} - {a.pincode}", f"Phone: {a.phone}"]
    return "\n".join("  " + x for x in lines if x)


async def email_customer_status(o: ShopOrder) -> None:
    if not o.customer_email:
        return
    s = get_settings()
    extra = ""
    if o.status == "shipped" and (o.courier or o.tracking_number):
        extra = f"\nCourier: {o.courier or '-'}\nTracking number: {o.tracking_number or '-'}\n"
    note = o.history[-1].note if o.history else ""
    await send_email(
        o.customer_email,
        f"Order {o.order_number}: {STATUS_LABEL.get(o.status, o.status)}",
        f"Namaste {o.shipping_address.full_name},\n\nYour order {o.order_number} is now: "
        f"{STATUS_LABEL.get(o.status, o.status)}.\n{extra}"
        + (f"\nNote: {note}\n" if note else "")
        + f"\nTrack your order: {s.frontend_url}/orders/{o.id}\n\n— Vidushi Ji",
    )
