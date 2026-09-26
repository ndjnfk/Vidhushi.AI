"""Admin: bracelet/shop orders — list, details, status updates with
courier/tracking, and confirming online advances. Every status change emails
the customer."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.config import get_settings
from app.core.email import send_email
from app.core.live import bump, user_topic
from app.core.orders import email_customer_status, order_out, release_stock, set_status
from app.models.models import ShopOrder
from app.schemas.schemas import ShopOrderOut, ShopOrderStatusIn

router = APIRouter(prefix="/admin/orders", tags=["admin"], dependencies=[Depends(get_current_admin)])

# Allowed moves; delivered and cancelled are final.
_NEXT = {
    # Awaiting the online advance: "Payment received" (below) confirms it.
    "pending_payment": {"cancelled"},
    "payment_submitted": {"cancelled"},
    "placed": {"confirmed", "shipped", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


@router.get("", response_model=list[ShopOrderOut])
async def list_orders(status: str | None = None):
    query = ShopOrder.find(ShopOrder.status == status) if status else ShopOrder.find_all()
    return [order_out(o) for o in await query.sort("-created_at").to_list()]


@router.get("/counts")
async def counts() -> dict:
    """Orders still needing action (for the sidebar badge)."""
    return {"open": await ShopOrder.find({"status": {"$in": ["placed", "confirmed", "payment_submitted"]}}).count()}


async def _order(order_id: str) -> ShopOrder:
    try:
        o = await ShopOrder.get(order_id)
    except Exception:
        o = None
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@router.post("/{order_id}/payment-received", response_model=ShopOrderOut)
async def payment_received(order_id: str):
    """Vidushi Ji saw the UPI advance arrive: the order is confirmed."""
    o = await _order(order_id)
    if o.status not in ("pending_payment", "payment_submitted"):
        raise HTTPException(status_code=400, detail="This order isn't awaiting payment")
    o.payment_received_at = datetime.utcnow()
    set_status(o, "confirmed", f"Advance of Rs {o.advance_amount:,.0f} received")
    await o.save()
    await bump(user_topic(o.user_id))
    s = get_settings()
    await send_email(
        o.customer_email,
        f"Order {o.order_number}: payment received — confirmed",
        f"Namaste {o.shipping_address.full_name},\n\nWe have received your payment of Rs {o.advance_amount:,.0f}. "
        f"Your order {o.order_number} is confirmed and will be shipped soon.\n\n"
        + (f"Amount to pay on delivery: Rs {o.cod_amount:,.0f}\n\n" if o.cod_amount else "")
        + f"Track your order: {s.frontend_url}/orders/{o.id}\n\n— Vidushi Ji",
    )
    return order_out(o)


@router.put("/{order_id}/status", response_model=ShopOrderOut)
async def update_status(order_id: str, payload: ShopOrderStatusIn):
    o = await _order(order_id)
    if payload.status != o.status and payload.status not in _NEXT.get(o.status, set()):
        raise HTTPException(status_code=400, detail=f"Can't move an order from {o.status} to {payload.status}")
    if payload.courier:
        o.courier = payload.courier.strip()
    if payload.tracking_number:
        o.tracking_number = payload.tracking_number.strip()
    changed = payload.status != o.status
    if changed:
        set_status(o, payload.status, payload.note.strip())
    await o.save()
    await bump(user_topic(o.user_id))
    if changed and payload.status == "cancelled":
        await release_stock(o)
    if changed:
        await email_customer_status(o)
    return order_out(o)
