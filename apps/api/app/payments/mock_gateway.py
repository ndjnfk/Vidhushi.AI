"""Always-succeeds gateway for local development and tests — lets the whole
booking -> pay -> confirm flow be exercised with zero external credentials.
"""
import json
import uuid

from app.payments.base import (
    OrderCreateResult,
    PaymentGateway,
    PaymentVerificationResult,
    SubscriptionCreateResult,
    WebhookEvent,
)


class MockGateway(PaymentGateway):
    name = "mock"
    supports_subscriptions = True

    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        order_id = f"mock_order_{uuid.uuid4().hex[:16]}"
        return OrderCreateResult(
            gateway_order_id=order_id,
            amount=amount,
            currency=currency,
            client_config={"mock": True, "auto_success": True},
        )

    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            success=True,
            gateway_payment_id=f"mock_payment_{uuid.uuid4().hex[:16]}",
            raw={"gateway_order_id": gateway_order_id, **payload},
        )

    async def create_subscription(
        self, *, amount: float, currency: str, interval_days: int, notes: dict
    ) -> SubscriptionCreateResult:
        sub_id = f"mock_sub_{uuid.uuid4().hex[:16]}"
        return SubscriptionCreateResult(
            gateway_subscription_id=sub_id,
            client_config={"mock": True, "auto_success": True, "subscription_id": sub_id},
        )

    def verify_and_parse_webhook(self, *, payload: bytes, headers: dict) -> WebhookEvent:
        # No real signature scheme in dev — the payload is trusted as-is.
        # Used by tests to exercise the webhook -> charge-processing path
        # without needing a live Razorpay/Stripe account.
        data = json.loads(payload)
        return WebhookEvent(
            event_type=data.get("event_type", "unknown"),
            gateway_subscription_id=data.get("gateway_subscription_id"),
            gateway_payment_id=data.get("gateway_payment_id", f"mock_payment_{uuid.uuid4().hex[:16]}"),
            amount=data.get("amount"),
            raw=data,
        )
