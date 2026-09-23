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


@lru_cache
def get_settings() -> Settings:
    return Settings()
