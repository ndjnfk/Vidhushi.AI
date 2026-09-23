"""Shared "create an Order for this booking" flow — used identically by
poojas, rituals, and consultations so the payment wiring only lives once.
"""
import httpx

from app.models.models import Order
from app.payments.base import PaymentGateway, PaymentGatewayError
from app.payments.factory import build_gateway, get_payment_settings, resolve_credentials
from app.schemas.schemas import OrderCreateOut


async def create_order_for_booking(
    *, user_id: str, item_type: str, item_ref_id: str, amount: float, notes: dict,
    gateway_override: str | None = None,
) -> tuple[Order, OrderCreateOut]:
    settings_doc = await get_payment_settings()

    if gateway_override and gateway_override != settings_doc.active_gateway:
        # Only the admin-selected gateway is exposed to users — matches the
        # "jo admin se enable hoga wahi dikhega" requirement.
        raise ValueError(f"Payment gateway '{gateway_override}' is not currently enabled")

    creds = resolve_credentials(settings_doc.active_gateway, settings_doc)
    gateway: PaymentGateway = build_gateway(settings_doc.active_gateway, creds)

    receipt = f"{item_type}_{item_ref_id}"
    try:
        result = await gateway.create_order(
            amount=amount, currency="INR", receipt=receipt, notes={"user_id": user_id, **notes}
        )
    except httpx.HTTPStatusError as e:
        raise PaymentGatewayError(
            f"{settings_doc.active_gateway} rejected the order request ({e.response.status_code})"
        ) from e
    except httpx.RequestError as e:
        raise PaymentGatewayError(f"Could not reach {settings_doc.active_gateway}: {e}") from e

    order = Order(
        user_id=user_id,
        item_type=item_type,
        item_ref_id=item_ref_id,
        amount=amount,
        currency="INR",
        gateway=settings_doc.active_gateway,
        gateway_order_id=result.gateway_order_id,
    )
    await order.insert()

    order_out = OrderCreateOut(
        order_id=str(order.id),
        gateway=settings_doc.active_gateway,
        gateway_order_id=result.gateway_order_id,
        amount=amount,
        currency="INR",
        client_config=result.client_config,
        enabled_payment_methods=settings_doc.enabled_payment_methods,
    )
    return order, order_out
