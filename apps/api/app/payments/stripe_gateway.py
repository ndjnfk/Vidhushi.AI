"""Real Stripe integration via their REST API (no SDK dependency). Needs a
real `secret_key`/`publishable_key` from admin-configured PaymentSettings
(or STRIPE_SECRET_KEY/STRIPE_PUBLISHABLE_KEY env vars) to work live;
`webhook_secret` additionally for recurring billing.
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

_API_BASE = "https://api.stripe.com/v1"

# Currencies Stripe treats as having no minor unit (amount is NOT *100).
_ZERO_DECIMAL_CURRENCIES = {"jpy", "krw", "vnd"}

_STRIPE_EVENT_MAP = {
    "invoice.paid": "subscription.charged",
    "customer.subscription.deleted": "subscription.cancelled",
}


class StripeGateway(PaymentGateway):
    name = "stripe"
    supports_subscriptions = True

    def __init__(self, secret_key: str | None, publishable_key: str | None, webhook_secret: str | None = None):
        self.secret_key = secret_key
        self.publishable_key = publishable_key
        self.webhook_secret = webhook_secret

    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        if not self.secret_key:
            raise ValueError("Stripe is not configured (missing secret_key)")

        currency_lower = currency.lower()
        minor_amount = round(amount) if currency_lower in _ZERO_DECIMAL_CURRENCIES else round(amount * 100)

        data = {
            "amount": minor_amount,
            "currency": currency_lower,
            "automatic_payment_methods[enabled]": "true",
            **{f"metadata[{k}]": v for k, v in {"receipt": receipt, **notes}.items()},
        }

        async with httpx.AsyncClient(auth=(self.secret_key, ""), timeout=15) as client:
            resp = await client.post(f"{_API_BASE}/payment_intents", data=data)
            resp.raise_for_status()
            payload = resp.json()

        return OrderCreateResult(
            gateway_order_id=payload["id"],
            amount=amount,
            currency=currency,
            client_config={"publishable_key": self.publishable_key, "client_secret": payload["client_secret"]},
        )

    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        if not self.secret_key:
            return PaymentVerificationResult(success=False, raw=payload)

        async with httpx.AsyncClient(auth=(self.secret_key, ""), timeout=15) as client:
            resp = await client.get(f"{_API_BASE}/payment_intents/{gateway_order_id}")
            resp.raise_for_status()
            intent = resp.json()

        success = intent.get("status") == "succeeded"
        return PaymentVerificationResult(success=success, gateway_payment_id=intent.get("id"), raw=intent)

    async def create_subscription(
        self, *, amount: float, currency: str, interval_days: int, notes: dict
    ) -> SubscriptionCreateResult:
        if not self.secret_key:
            raise ValueError("Stripe is not configured (missing secret_key)")

        currency_lower = currency.lower()
        minor_amount = round(amount) if currency_lower in _ZERO_DECIMAL_CURRENCIES else round(amount * 100)
        # Stripe recurring prices bill on fixed intervals — map the common
        # case (weekly rituals) and fall back to a monthly cadence otherwise.
        interval = "week" if interval_days == 7 else "month"

        async with httpx.AsyncClient(auth=(self.secret_key, ""), timeout=15) as client:
            customer_resp = await client.post(f"{_API_BASE}/customers", data={"email": notes.get("email", "guest@example.com")})
            customer_resp.raise_for_status()
            customer_id = customer_resp.json()["id"]

            price_resp = await client.post(
                f"{_API_BASE}/prices",
                data={
                    "unit_amount": minor_amount,
                    "currency": currency_lower,
                    "recurring[interval]": interval,
                    "product_data[name]": notes.get("product_info", "Vidushiji.ai ritual"),
                },
            )
            price_resp.raise_for_status()
            price_id = price_resp.json()["id"]

            sub_resp = await client.post(
                f"{_API_BASE}/subscriptions",
                data={
                    "customer": customer_id,
                    "items[0][price]": price_id,
                    "payment_behavior": "default_incomplete",
                    "expand[]": "latest_invoice.payment_intent",
                },
            )
            sub_resp.raise_for_status()
            sub_data = sub_resp.json()

        client_secret = sub_data.get("latest_invoice", {}).get("payment_intent", {}).get("client_secret")
        return SubscriptionCreateResult(
            gateway_subscription_id=sub_data["id"],
            client_config={"publishable_key": self.publishable_key, "client_secret": client_secret},
        )

    def verify_and_parse_webhook(self, *, payload: bytes, headers: dict) -> WebhookEvent:
        if not self.webhook_secret:
            raise PermissionError("Stripe webhook_secret is not configured")

        sig_header = headers.get("stripe-signature", "")
        parts = dict(p.split("=", 1) for p in sig_header.split(",") if "=" in p)
        timestamp, signature = parts.get("t"), parts.get("v1")
        if not timestamp or not signature:
            raise PermissionError("Malformed Stripe-Signature header")

        signed_payload = f"{timestamp}.".encode() + payload
        expected = hmac.new(self.webhook_secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise PermissionError("Invalid Stripe webhook signature")

        data = json.loads(payload)
        stripe_event_type = data.get("type", "")
        event_type = _STRIPE_EVENT_MAP.get(stripe_event_type, "unknown")
        obj = data.get("data", {}).get("object", {})

        return WebhookEvent(
            event_type=event_type,
            gateway_subscription_id=obj.get("subscription") or obj.get("id"),
            gateway_payment_id=obj.get("payment_intent"),
            amount=(obj["amount_paid"] / 100) if obj.get("amount_paid") is not None else None,
            raw=data,
        )
