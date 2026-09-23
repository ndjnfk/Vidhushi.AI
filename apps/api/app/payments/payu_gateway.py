"""Real PayU integration — their "classic" hash-based checkout: no order-
creation API call; the client auto-submits a form (key/txnid/amount/hash/...)
to PayU's hosted payment page, and PayU redirects back with a reverse hash
to verify. Needs real `merchant_key`/`salt` from admin-configured
PaymentSettings (or PAYU_MERCHANT_KEY/PAYU_SALT env vars) to work live.
"""
import hashlib

from app.payments.base import OrderCreateResult, PaymentGateway, PaymentVerificationResult


class PayUGateway(PaymentGateway):
    name = "payu"

    def __init__(self, merchant_key: str | None, salt: str | None, base_url: str):
        self.merchant_key = merchant_key
        self.salt = salt
        self.base_url = base_url.rstrip("/")

    async def create_order(
        self, *, amount: float, currency: str, receipt: str, notes: dict
    ) -> OrderCreateResult:
        if not self.merchant_key or not self.salt:
            raise ValueError("PayU is not configured (missing merchant_key/salt)")

        product_info = notes.get("product_info", "Vidushiji.ai order")
        firstname = notes.get("firstname", "Guest")
        email = notes.get("email", "guest@example.com")
        amount_str = f"{amount:.2f}"

        hash_input = "|".join([
            self.merchant_key, receipt, amount_str, product_info, firstname, email,
            "", "", "", "", "", "", "", "", "", "", self.salt,
        ])
        txn_hash = hashlib.sha512(hash_input.encode()).hexdigest()

        return OrderCreateResult(
            gateway_order_id=receipt,
            amount=amount,
            currency=currency,
            client_config={
                "action_url": f"{self.base_url}/_payment",
                "key": self.merchant_key,
                "txnid": receipt,
                "amount": amount_str,
                "productinfo": product_info,
                "firstname": firstname,
                "email": email,
                "hash": txn_hash,
            },
        )

    async def verify_payment(self, *, gateway_order_id: str, payload: dict) -> PaymentVerificationResult:
        if not self.salt or not self.merchant_key:
            return PaymentVerificationResult(success=False, raw=payload)

        status = payload.get("status", "")
        reverse_input = "|".join([
            self.salt, status, "", "", "", "", "", "", "", "", "",
            payload.get("email", ""), payload.get("firstname", ""),
            payload.get("productinfo", ""), payload.get("amount", ""),
            payload.get("txnid", gateway_order_id), self.merchant_key,
        ])
        expected = hashlib.sha512(reverse_input.encode()).hexdigest()

        success = status == "success" and expected == payload.get("hash")
        return PaymentVerificationResult(
            success=success, gateway_payment_id=payload.get("mihpayid"), raw=payload
        )
