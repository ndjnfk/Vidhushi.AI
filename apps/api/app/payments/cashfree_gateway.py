"""Real Cashfree integration via their Payment Gateway REST API. Needs real
`app_id`/`secret_key` from admin-configured PaymentSettings (or
CASHFREE_APP_ID/CASHFREE_SECRET_KEY env vars) to work live.
"""
import httpx

from app.payments.base import OrderCreateResult, PaymentGateway, PaymentVerificationResult


class CashfreeGateway(PaymentGateway):
    name = "cashfree"

    def __init__(self, app_id: str | None, secret_key: str | None, base_url: str):
        self.app_id = app_id
        self.secret_key = secret_key
        self.base_url = base_url.rstrip("/")

    def _headers(self) -> dict:
        return {
            "x-client-id": self.app_id or "",
            "x-client-secret": self.secret_key or "",
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json",
        }

    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        if not self.app_id or not self.secret_key:
            raise ValueError("Cashfree is not configured (missing app_id/secret_key)")

        customer_id = notes.get("user_id", "guest")
        body = {
            "order_id": receipt,
            "order_amount": amount,
            "order_currency": currency,
            "customer_details": {
                "customer_id": customer_id,
                "customer_email": notes.get("email", "guest@example.com"),
                "customer_phone": notes.get("phone", "9999999999"),
            },
            "order_meta": {"notes": notes},
        }

        async with httpx.AsyncClient(headers=self._headers(), timeout=15) as client:
            resp = await client.post(f"{self.base_url}/orders", json=body)
            resp.raise_for_status()
            data = resp.json()

        return OrderCreateResult(
            gateway_order_id=data["order_id"],
            amount=amount,
            currency=currency,
            client_config={"payment_session_id": data.get("payment_session_id")},
        )

    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        async with httpx.AsyncClient(headers=self._headers(), timeout=15) as client:
            resp = await client.get(f"{self.base_url}/orders/{gateway_order_id}")
            resp.raise_for_status()
            order = resp.json()

        success = order.get("order_status") == "PAID"
        return PaymentVerificationResult(
            success=success, gateway_payment_id=order.get("cf_order_id"), raw=order
        )
