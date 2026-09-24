from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "vidushiji"
    jwt_secret: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    cors_origins: list[str] = ["http://localhost:3000"]

    # Payment gateways — "mock" always works with no credentials, for local
    # dev and tests. Add real gateway names once credentials are supplied.
    enabled_payment_gateways: list[str] = ["mock"]

    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None
    razorpay_webhook_secret: str | None = None

    payu_merchant_key: str | None = None
    payu_salt: str | None = None
    payu_base_url: str = "https://secure.payu.in"

    stripe_secret_key: str | None = None
    stripe_publishable_key: str | None = None
    stripe_webhook_secret: str | None = None

    cashfree_app_id: str | None = None
    cashfree_secret_key: str | None = None
    cashfree_base_url: str = "https://api.cashfree.com/pg"

    # Outgoing email (consultation notifications). Leave blank in dev: emails
    # are then written to the API log instead of being sent.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    # Where new consultation requests are announced (Vidushi Ji's inbox).
    admin_notify_email: str | None = None
    # Vidushi Ji's UPI ID for consultation payments (shown to clients as a
    # QR code). Leave blank until set; the site then says payment is unavailable.
    upi_id: str | None = None
    upi_payee_name: str = "Vidushi Ji"
    # Public URL of this API, used for links to images it serves.
    api_public_url: str = "http://localhost:8000"
    # Public URL of the website, used for links inside emails.
    frontend_url: str = "http://localhost:3001"

    # WebRTC ICE servers for in-site audio/video calls. STUN works for most
    # networks; add a TURN server here for users behind strict firewalls.
    ice_servers: list[dict] = [{"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}]


@lru_cache
def get_settings() -> Settings:
    return Settings()
