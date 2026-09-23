from datetime import date, datetime, time

from pydantic import BaseModel, EmailStr, Field


class BirthDetailsIn(BaseModel):
    name: str
    birth_date: date
    birth_time: time
    place_name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class PlanetOut(BaseModel):
    planet: str
    longitude: float
    sign: str
    degree_in_sign: float
    nakshatra: str
    nakshatra_lord: str
    pada: int
    house: int
    is_retrograde: bool


class ChartOut(BaseModel):
    ascendant_sign: str
    ascendant_degree: float
    planets: list[PlanetOut]


class AntardashaOut(BaseModel):
    lord: str
    start: datetime
    end: datetime


class MahadashaOut(BaseModel):
    lord: str
    start: datetime
    end: datetime
    antardashas: list[AntardashaOut]


class PanchangOut(BaseModel):
    date: str
    vara: str
    tithi: str
    tithi_paksha: str
    nakshatra: str
    yoga: str
    karana: str
    sunrise_utc: datetime
    sunset_utc: datetime


class KundliOut(BaseModel):
    id: str
    name: str
    birth_date: date
    birth_time: time
    place_name: str
    timezone: str
    d1_chart: ChartOut
    d9_chart: ChartOut
    dasha: list[MahadashaOut]
    panchang: PanchangOut


class GunaMilanIn(BaseModel):
    boy: BirthDetailsIn
    girl: BirthDetailsIn


class KootaOut(BaseModel):
    name: str
    points: float
    max_points: int
    note: str = ""


class GunaMilanOut(BaseModel):
    kootas: list[KootaOut]
    total_points: float
    max_points: int


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Payments ----

class PaymentSettingsOut(BaseModel):
    active_gateway: str
    enabled_payment_methods: list[str]
    configured_gateways: list[str]  # gateways that currently have usable credentials


class PaymentSettingsUpdate(BaseModel):
    active_gateway: str
    enabled_payment_methods: list[str] | None = None
    # credentials, keyed by gateway name: {"razorpay": {"key_id": "...", "key_secret": "..."}}
    credentials: dict[str, dict[str, str]] | None = None


class OrderCreateOut(BaseModel):
    order_id: str
    gateway: str
    gateway_order_id: str
    amount: float
    currency: str
    client_config: dict
    enabled_payment_methods: list[str]


class PaymentVerifyIn(BaseModel):
    order_id: str
    payload: dict = Field(default_factory=dict)


class PaymentVerifyOut(BaseModel):
    success: bool
    order_status: str


# ---- Vendors (astrologers / pandits / ritual specialists) ----

class VendorCreate(BaseModel):
    name: str
    vendor_type: str
    bio: str = ""
    contact_email: EmailStr
    contact_phone: str | None = None
    languages: list[str] = Field(default_factory=list)
    specialties: list[str] = Field(default_factory=list)
    experience_years: int = 0
    commission_rate: float = 20.0
    rate_per_session: float | None = None


class VendorStatusUpdate(BaseModel):
    status: str  # pending_approval | active | suspended | rejected


class VendorOut(BaseModel):
    id: str
    name: str
    vendor_type: str
    bio: str
    languages: list[str]
    specialties: list[str]
    experience_years: int
    rate_per_session: float | None
    is_online: bool
    rating: float


class VendorAdminOut(VendorOut):
    contact_email: str
    contact_phone: str | None
    commission_rate: float
    status: str
    storefront_slug: str | None = None
    custom_domain: str | None = None
    is_white_label_enabled: bool = False


# ---- White-label storefronts ----

class VendorBrandingIn(BaseModel):
    display_name: str | None = None
    tagline: str | None = None
    logo_url: str | None = None
    primary_color: str = "#ea580c"
    about_text: str | None = None


class StorefrontUpdate(BaseModel):
    storefront_slug: str | None = None
    custom_domain: str | None = None
    is_white_label_enabled: bool | None = None
    branding: VendorBrandingIn | None = None


class StorefrontOut(BaseModel):
    vendor_id: str
    name: str
    vendor_type: str
    bio: str
    languages: list[str]
    specialties: list[str]
    experience_years: int
    rate_per_session: float | None
    rating: float
    storefront_slug: str | None
    custom_domain: str | None
    branding: VendorBrandingIn


# ---- Poojas ----

class PoojaServiceCreate(BaseModel):
    name: str
    description: str
    service_type: str  # "individual" | "group"
    price: float
    duration_minutes: int


class PoojaServiceOut(BaseModel):
    id: str
    name: str
    description: str
    service_type: str
    price: float
    duration_minutes: int


class PoojaBookingCreate(BaseModel):
    pooja_service_id: str
    devotee_name: str
    gotra: str | None = None
    nakshatra: str | None = None
    scheduled_date: date
    gateway: str | None = None  # optional override; defaults to the admin-active gateway


class PoojaBookingOut(BaseModel):
    id: str
    pooja_service_id: str
    devotee_name: str
    scheduled_date: date
    status: str
    order: OrderCreateOut | None = None


# ---- Rituals / Spells ----

class RitualServiceCreate(BaseModel):
    name: str
    description: str
    price_min: float
    price_max: float


class RitualServiceOut(BaseModel):
    id: str
    name: str
    description: str
    price_min: float
    price_max: float


class RitualBookingCreate(BaseModel):
    ritual_service_id: str
    intention_text: str
    agreed_price: float
    gateway: str | None = None


class RitualBookingOut(BaseModel):
    id: str
    ritual_service_id: str
    intention_text: str
    agreed_price: float
    weekly: bool
    status: str
    next_candle_date: date | None
    billing_mode: str = "manual"
    subscription_status: str | None = None
    order: OrderCreateOut | None = None


class SubscriptionEnableOut(BaseModel):
    gateway: str
    gateway_subscription_id: str
    client_config: dict


# ---- Consultations ----

class ConsultationRequestIn(BaseModel):
    vendor_id: str
    gateway: str | None = None


class ConsultationBookingOut(BaseModel):
    id: str
    vendor_id: str
    status: str
    order: OrderCreateOut | None = None


class ConsultationMessageIn(BaseModel):
    text: str


class ConsultationMessageOut(BaseModel):
    id: str
    sender: str
    text: str
    sent_at: datetime


# ---- Tarot ----

class TarotCardMeaningOut(BaseModel):
    name: str
    arcana: str
    suit: str | None
    rank: str
    keywords: list[str]
    upright_meaning: str
    reversed_meaning: str


class DrawnCardOut(BaseModel):
    position: str
    name: str
    is_reversed: bool
    keywords: list[str]
    meaning: str  # the meaning for the orientation actually drawn


class TarotReadingCreate(BaseModel):
    spread: str  # "single" | "three_card"
    question: str | None = None


class TarotReadingOut(BaseModel):
    id: str
    spread: str
    question: str | None
    cards: list[DrawnCardOut]
    created_at: datetime


# ---- Blog ----

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    body: str
    tags: list[str] = Field(default_factory=list)
    author_name: str = "Vidushiji.ai"
    published: bool = True


class BlogPostUpdate(BaseModel):
    title: str | None = None
    excerpt: str | None = None
    body: str | None = None
    tags: list[str] | None = None
    published: bool | None = None


class BlogPostSummaryOut(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    tags: list[str]
    author_name: str
    created_at: datetime


class BlogPostOut(BlogPostSummaryOut):
    body: str
    updated_at: datetime


# ---- Shop ----

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str | None = None
    category: str
    stock_quantity: int = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
    stock_quantity: int | None = None
    is_active: bool | None = None


class ProductOut(BaseModel):
    id: str
    name: str
    description: str
    price: float
    image_url: str | None
    category: str
    stock_quantity: int


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class ShippingAddressIn(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: str | None = None
    city: str
    state: str
    pincode: str


class CheckoutIn(BaseModel):
    items: list[CartItemIn]
    shipping_address: ShippingAddressIn
    gateway: str | None = None


class ShopOrderItemOut(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float


class ShopOrderOut(BaseModel):
    id: str
    items: list[ShopOrderItemOut]
    total_amount: float
    status: str
    order: OrderCreateOut | None = None
