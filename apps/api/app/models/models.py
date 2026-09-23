from datetime import date, datetime

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel


class User(Document):
    email: str
    hashed_password: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [IndexModel("email", unique=True)]


class Kundli(Document):
    owner_id: str | None = None

    name: str
    birth_date: date
    birth_time: str  # HH:MM:SS local time (BSON has no native "time" type)
    place_name: str
    latitude: float
    longitude: float
    timezone: str

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "kundlis"


class PaymentSettings(Document):
    """Single admin-editable row: which gateway is active, and every
    gateway's credentials. Takes precedence over the .env fallback in
    app/core/config.py — lets an admin switch gateways/keys at runtime
    without a redeploy."""

    active_gateway: str = "mock"
    credentials: dict[str, dict[str, str]] = Field(default_factory=dict)
    # Which payment methods the checkout should offer (e.g. "upi", "card",
    # "netbanking", "wallet") — admin-editable; empty list = gateway default.
    enabled_payment_methods: list[str] = Field(default_factory=lambda: ["upi", "card", "netbanking", "wallet"])
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "payment_settings"


class Order(Document):
    user_id: str
    item_type: str  # "pooja" | "ritual" | "consultation"
    item_ref_id: str  # the booking document's id
    amount: float
    currency: str = "INR"
    gateway: str
    gateway_order_id: str
    gateway_payment_id: str | None = None
    status: str = "pending"  # pending | paid | failed | refunded

    # Vendor payout accounting — filled in once the order is paid, from the
    # fulfilling Vendor's commission_rate at that time.
    vendor_id: str | None = None
    platform_commission_amount: float | None = None
    vendor_payout_amount: float | None = None
    payout_status: str = "not_applicable"  # not_applicable | owed | paid_out

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"


class VendorBranding(BaseModel):
    display_name: str | None = None
    tagline: str | None = None
    logo_url: str | None = None
    primary_color: str = "#ea580c"
    about_text: str | None = None


class Vendor(Document):
    """Anyone who fulfills a paid service on the platform: an astrologer
    (consultations), a pandit (poojas), or a ritual specialist (spells)."""

    name: str
    vendor_type: str  # "astrologer" | "pandit" | "ritual_specialist"
    bio: str = ""
    contact_email: str
    contact_phone: str | None = None
    languages: list[str] = Field(default_factory=list)
    specialties: list[str] = Field(default_factory=list)
    experience_years: int = 0

    commission_rate: float = 20.0  # % the platform keeps from each order
    payout_details: dict[str, str] = Field(default_factory=dict)  # {"method": "upi"|"bank", "upi_id" | "account_number"/"ifsc": ...}

    status: str = "pending_approval"  # pending_approval | active | suspended | rejected

    rate_per_session: float | None = None  # consultations only
    is_online: bool = False
    rating: float = 0.0

    # White-label storefront — a branded page for this vendor on the same
    # backend/database. `custom_domain` is just a mapping; actually pointing
    # DNS (e.g. via Cloudflare) at this deployment is done outside the app.
    storefront_slug: str | None = None  # unique, e.g. "pandit-sharma" -> /vendor/pandit-sharma
    custom_domain: str | None = None  # e.g. "panditsharma.com", lowercase, no protocol
    is_white_label_enabled: bool = False
    branding: VendorBranding = Field(default_factory=VendorBranding)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "vendors"
        indexes = [
            # `sparse=True` alone isn't enough — Mongo's sparse index still
            # indexes fields explicitly set to null (which Pydantic always
            # sets), so it'd reject a second vendor with no slug/domain.
            # A partial index that requires the field to actually be a
            # string sidesteps that.
            IndexModel("storefront_slug", unique=True, partialFilterExpression={"storefront_slug": {"$type": "string"}}),
            IndexModel("custom_domain", unique=True, partialFilterExpression={"custom_domain": {"$type": "string"}}),
        ]


class PoojaService(Document):
    name: str
    description: str
    service_type: str  # "individual" | "group"
    price: float
    duration_minutes: int
    is_active: bool = True

    class Settings:
        name = "pooja_services"


class PoojaBooking(Document):
    user_id: str
    pooja_service_id: str
    vendor_id: str | None = None  # assigned pandit (admin can assign after booking)
    devotee_name: str
    gotra: str | None = None
    nakshatra: str | None = None
    scheduled_date: date
    order_id: str | None = None
    status: str = "pending_payment"  # pending_payment | confirmed | completed | cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "pooja_bookings"


class RitualService(Document):
    name: str
    description: str
    price_min: float
    price_max: float
    is_active: bool = True

    class Settings:
        name = "ritual_services"


class RitualBooking(Document):
    user_id: str
    ritual_service_id: str
    vendor_id: str | None = None  # assigned ritual specialist
    intention_text: str
    agreed_price: float
    weekly: bool = True
    status: str = "pending_payment"  # pending_payment | active | completed | cancelled
    next_candle_date: date | None = None
    order_id: str | None = None

    # Real auto-recurring billing (vs. the manual weekly "renew" MVP flow).
    billing_mode: str = "manual"  # "manual" | "auto"
    gateway_subscription_id: str | None = None
    subscription_status: str | None = None  # created | active | cancelled | completed

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ritual_bookings"


class RitualCharge(Document):
    """One logged weekly auto-charge, from a subscription webhook event —
    an audit trail distinct from the manual-renew Order records."""

    ritual_booking_id: str
    gateway_subscription_id: str
    gateway_payment_id: str | None = None
    amount: float
    order_id: str | None = None  # the Order created for this charge (vendor payout accounting)
    charged_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ritual_charges"


class ConsultationBooking(Document):
    user_id: str
    vendor_id: str  # the astrologer (a Vendor with vendor_type="astrologer")
    order_id: str | None = None
    status: str = "pending_payment"  # pending_payment | active | completed | cancelled
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "consultation_bookings"


class ConsultationMessage(Document):
    consultation_id: str
    sender: str  # "user" | "vendor"
    text: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "consultation_messages"


class DrawnCardEmbedded(BaseModel):
    position: str
    name: str
    is_reversed: bool


class TarotReading(Document):
    user_id: str | None = None
    spread: str  # "single" | "three_card"
    question: str | None = None
    cards: list[DrawnCardEmbedded]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tarot_readings"


class Product(Document):
    name: str
    description: str
    price: float
    image_url: str | None = None
    category: str  # "gemstone" | "rudraksha" | "yantra" | "other"
    stock_quantity: int = 0
    is_active: bool = True

    class Settings:
        name = "products"


class ShopOrderItem(BaseModel):
    product_id: str
    product_name: str  # snapshot at time of order
    quantity: int
    unit_price: float  # snapshot at time of order


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: str | None = None
    city: str
    state: str
    pincode: str


class ShopOrder(Document):
    user_id: str
    items: list[ShopOrderItem]
    shipping_address: ShippingAddress
    total_amount: float
    order_id: str | None = None  # links to the payments Order
    status: str = "pending_payment"  # pending_payment | confirmed | shipped | delivered | cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "shop_orders"


class BlogPost(Document):
    title: str
    slug: str
    excerpt: str
    body: str  # markdown
    tags: list[str] = Field(default_factory=list)
    author_name: str = "Vidushiji.ai"
    published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "blog_posts"
        indexes = [IndexModel("slug", unique=True)]
