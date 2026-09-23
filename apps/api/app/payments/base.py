"""Gateway-agnostic payment interface. Every concrete gateway (mock, Razorpay,
PayU, Stripe, Cashfree) implements this — feature routes (poojas/rituals/
consultations) never talk to a gateway SDK directly, only to this interface.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class PaymentGatewayError(Exception):
    """Raised when a real gateway rejects a request (bad/missing credentials,
    upstream outage, ...) — distinct from a caller/validation error."""


@dataclass
class OrderCreateResult:
    gateway_order_id: str
    amount: float
    currency: str
    # Whatever the frontend's checkout widget needs (key id, publishable
    # key, client secret, redirect url, payment session id, ...). Shape is
    # gateway-specific by design — the frontend branches on `gateway` name.
    client_config: dict = field(default_factory=dict)


@dataclass
class PaymentVerificationResult:
    success: bool
    gateway_payment_id: str | None = None
    raw: dict = field(default_factory=dict)


@dataclass
class SubscriptionCreateResult:
    gateway_subscription_id: str
    client_config: dict = field(default_factory=dict)


@dataclass
class WebhookEvent:
    """Normalized shape every gateway's webhook parser returns, so the
    route handler (app/api/routes/payments.py) never branches on gateway
    name for event processing — only gateway-specific parsing lives in the
    gateway class."""

    event_type: str  # "subscription.charged" | "subscription.cancelled" | "subscription.completed" | "unknown"
    gateway_subscription_id: str | None
    gateway_payment_id: str | None
    amount: float | None
    raw: dict = field(default_factory=dict)


class PaymentGateway(ABC):
    name: str
    supports_subscriptions: bool = False

    @abstractmethod
    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        """Create an order/intent on the gateway's side, in the given currency's
        smallest-unit-agnostic decimal amount (e.g. 499.00, not paise)."""

    @abstractmethod
    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        """Verify a client-reported payment against the gateway (signature
        check, or a server-side lookup), given whatever the client's
        checkout widget returned in `payload`."""

    async def create_subscription(
        self, *, amount: float, currency: str, interval_days: int, notes: dict
    ) -> SubscriptionCreateResult:
        """Create a real auto-recurring subscription (gateway charges the
        customer on its own schedule, not us). Only gateways with
        `supports_subscriptions = True` implement this."""
        raise NotImplementedError(f"{self.name} does not support recurring subscriptions")

    def verify_and_parse_webhook(self, *, payload: bytes, headers: dict) -> WebhookEvent:
        """Verify a webhook's signature and normalize its event into a
        WebhookEvent. Only gateways with `supports_subscriptions = True`
        implement this (it's only used for recurring-billing events)."""
        raise NotImplementedError(f"{self.name} does not support webhook subscription events")
