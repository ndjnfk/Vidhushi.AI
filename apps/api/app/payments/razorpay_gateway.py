"""Real Razorpay integration via their REST Orders + Subscriptions API (no
SDK dependency). Needs real `key_id`/`key_secret` from the admin-configured
PaymentSettings (or RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET env vars as a
fallback) to work live; `webhook_secret` additionally for recurring billing.
"""
import hashlib
import hmac
import json

import httpx

from app.payments.base import (
    OrderCreateResult,
    PaymentGateway,
    PaymentVerificationResult,
    SubscriptionCreateResult,
    WebhookEvent,
)

_API_BASE = "https://api.razorpay.com/v1"

_RAZORPAY_EVENT_MAP = {
    "subscription.charged": "subscription.charged",
    "subscription.cancelled": "subscription.cancelled",
    "subscription.completed": "subscription.completed",
}


class RazorpayGateway(PaymentGateway):
    name = "razorpay"
    supports_subscriptions = True

    def __init__(self, key_id: str | None, key_secret: str | None, webhook_secret: str | None = None):
        self.key_id = key_id
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret

    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        if not self.key_id or not self.key_secret:
            raise ValueError("Razorpay is not configured (missing key_id/key_secret)")

        async with httpx.AsyncClient(auth=(self.key_id, self.key_secret), timeout=15) as client:
            resp = await client.post(
                f"{_API_BASE}/orders",
                json={
                    "amount": round(amount * 100),  # paise
                    "currency": currency,
                    "receipt": receipt,
                    "notes": notes,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        return OrderCreateResult(
            gateway_order_id=data["id"],
            amount=amount,
            currency=currency,
            client_config={"key": self.key_id, "order_id": data["id"], "amount": data["amount"], "currency": currency},
        )

    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        payment_id = payload.get("razorpay_payment_id")
        signature = payload.get("razorpay_signature")
        if not payment_id or not signature or not self.key_secret:
            return PaymentVerificationResult(success=False, raw=payload)

        expected = hmac.new(
            self.key_secret.encode(), f"{gateway_order_id}|{payment_id}".encode(), hashlib.sha256
        ).hexdigest()
        success = hmac.compare_digest(expected, signature)
        return PaymentVerificationResult(success=success, gateway_payment_id=payment_id, raw=payload)

    async def create_subscription(
        self, *, amount: float, currency: str, interval_days: int, notes: dict
    ) -> SubscriptionCreateResult:
        if not self.key_id or not self.key_secret:
            raise ValueError("Razorpay is not configured (missing key_id/key_secret)")

        # Razorpay bills on fixed periods (daily/weekly/monthly/...), not an
        # arbitrary day count — map the common case (weekly rituals) and
        # fall back to daily * interval_days otherwise.
        period, interval = ("weekly", 1) if interval_days == 7 else ("daily", interval_days)

        async with httpx.AsyncClient(auth=(self.key_id, self.key_secret), timeout=15) as client:
            plan_resp = await client.post(
                f"{_API_BASE}/plans",
                json={
                    "period": period,
                    "interval": interval,
                    "item": {"name": notes.get("product_info", "Vidushiji.ai ritual"), "amount": round(amount * 100), "currency": currency},
                },
            )
            plan_resp.raise_for_status()
            plan_id = plan_resp.json()["id"]

            sub_resp = await client.post(
                f"{_API_BASE}/subscriptions",
                json={
                    "plan_id": plan_id,
                    "customer_notify": 1,
                    # Razorpay requires a finite total_count — 520 weekly
                    # cycles (~10 years) approximates "until cancelled".
                    "total_count": 520,
                    "notes": notes,
                },
            )
            sub_resp.raise_for_status()
            sub_data = sub_resp.json()

        return SubscriptionCreateResult(
            gateway_subscription_id=sub_data["id"],
            client_config={"key": self.key_id, "subscription_id": sub_data["id"]},
        )

    def verify_and_parse_webhook(self, *, payload: bytes, headers: dict) -> WebhookEvent:
        if not self.webhook_secret:
            raise PermissionError("Razorpay webhook_secret is not configured")

        signature = headers.get("x-razorpay-signature", "")
        expected = hmac.new(self.webhook_secret.encode(), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise PermissionError("Invalid Razorpay webhook signature")

        data = json.loads(payload)
        event_type = _RAZORPAY_EVENT_MAP.get(data.get("event", ""), "unknown")
        sub_entity = data.get("payload", {}).get("subscription", {}).get("entity", {})
        payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})

        return WebhookEvent(
            event_type=event_type,
            gateway_subscription_id=sub_entity.get("id"),
            gateway_payment_id=payment_entity.get("id"),
            amount=(payment_entity["amount"] / 100) if payment_entity.get("amount") is not None else None,
            raw=data,
        )
