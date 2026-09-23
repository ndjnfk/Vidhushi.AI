"""Resolves the currently-active payment gateway. The admin-editable
PaymentSettings document (in Mongo) is the source of truth at runtime; the
.env-based Settings only seed it the first time / fill in credentials the
admin hasn't overridden yet.
"""
from app.core.config import get_settings
from app.models.models import PaymentSettings
from app.payments.base import PaymentGateway
from app.payments.cashfree_gateway import CashfreeGateway
from app.payments.mock_gateway import MockGateway
from app.payments.payu_gateway import PayUGateway
from app.payments.razorpay_gateway import RazorpayGateway
from app.payments.stripe_gateway import StripeGateway

SUPPORTED_GATEWAYS = ["mock", "razorpay", "payu", "stripe", "cashfree"]

_ENV_CREDENTIAL_FALLBACK = {
    "razorpay": lambda s: {"key_id": s.razorpay_key_id, "key_secret": s.razorpay_key_secret, "webhook_secret": s.razorpay_webhook_secret},
    "payu": lambda s: {"merchant_key": s.payu_merchant_key, "salt": s.payu_salt, "base_url": s.payu_base_url},
    "stripe": lambda s: {"secret_key": s.stripe_secret_key, "publishable_key": s.stripe_publishable_key, "webhook_secret": s.stripe_webhook_secret},
    "cashfree": lambda s: {"app_id": s.cashfree_app_id, "secret_key": s.cashfree_secret_key, "base_url": s.cashfree_base_url},
}


async def get_payment_settings() -> PaymentSettings:
    doc = await PaymentSettings.find_one({})
    if doc is None:
        env = get_settings()
        default_gateway = env.enabled_payment_gateways[0] if env.enabled_payment_gateways else "mock"
        doc = PaymentSettings(active_gateway=default_gateway)
        await doc.insert()
    return doc


def resolve_credentials(gateway_name: str, settings_doc: PaymentSettings) -> dict:
    creds = dict(settings_doc.credentials.get(gateway_name, {}))
    if gateway_name in _ENV_CREDENTIAL_FALLBACK:
        env_creds = _ENV_CREDENTIAL_FALLBACK[gateway_name](get_settings())
        for key, value in env_creds.items():
            creds.setdefault(key, value)
    return creds


def build_gateway(name: str, creds: dict) -> PaymentGateway:
    if name == "mock":
        return MockGateway()
    if name == "razorpay":
        return RazorpayGateway(key_id=creds.get("key_id"), key_secret=creds.get("key_secret"), webhook_secret=creds.get("webhook_secret"))
    if name == "payu":
        return PayUGateway(
            merchant_key=creds.get("merchant_key"),
            salt=creds.get("salt"),
            base_url=creds.get("base_url") or "https://secure.payu.in",
        )
    if name == "stripe":
        return StripeGateway(secret_key=creds.get("secret_key"), publishable_key=creds.get("publishable_key"), webhook_secret=creds.get("webhook_secret"))
    if name == "cashfree":
        return CashfreeGateway(
            app_id=creds.get("app_id"),
            secret_key=creds.get("secret_key"),
            base_url=creds.get("base_url") or "https://api.cashfree.com/pg",
        )
    raise ValueError(f"Unknown payment gateway: {name}")


async def get_active_gateway() -> tuple[PaymentGateway, PaymentSettings]:
    settings_doc = await get_payment_settings()
    creds = resolve_credentials(settings_doc.active_gateway, settings_doc)
    gateway = build_gateway(settings_doc.active_gateway, creds)
    return gateway, settings_doc
