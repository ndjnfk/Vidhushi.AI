from datetime import date, datetime, time

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


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

PRODUCT_CATEGORIES = "^(bracelet|gemstone|rudraksha|yantra|other)$"


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=5000)
    price: float = Field(ge=0)
    compare_at_price: float | None = Field(default=None, ge=0)
    image_url: str | None = None
    category: str = Field(default="bracelet", pattern=PRODUCT_CATEGORIES)
    stock_quantity: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=5000)
    price: float | None = Field(default=None, ge=0)
    compare_at_price: float | None = Field(default=None, ge=0)
    image_url: str | None = None
    category: str | None = Field(default=None, pattern=PRODUCT_CATEGORIES)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductOut(BaseModel):
    id: str
    name: str
    description: str
    price: float
    compare_at_price: float | None = None
    image_url: str | None
    category: str
    stock_quantity: int
    is_active: bool = True


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class ShippingAddressIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=6, max_length=20)
    line1: str = Field(min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(min_length=1, max_length=80)
    pincode: str = Field(min_length=4, max_length=10)


class CheckoutIn(BaseModel):
    items: list[CartItemIn]
    shipping_address: ShippingAddressIn


class ShopOrderItemOut(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float


class OrderStatusEventOut(BaseModel):
    status: str
    at: datetime
    note: str


class ShopOrderOut(BaseModel):
    id: str
    order_number: str
    items: list[ShopOrderItemOut]
    total_amount: float
    status: str
    payment_method: str
    shipping_address: ShippingAddressIn
    customer_email: str
    courier: str
    tracking_number: str
    history: list[OrderStatusEventOut]
    created_at: datetime
    advance_amount: float = 0  # paid online before shipping ("partial")
    cod_amount: float = 0  # collected on delivery
    payment_reference: str = ""


class PaymentPlanIn(BaseModel):
    items: list[CartItemIn]
    pincode: str = Field(min_length=4, max_length=10)


class PaymentPlanOut(BaseModel):
    """How this order would be paid. The rule behind it stays on the server."""
    method: str  # "cod" | "partial"
    total: float
    advance_amount: float
    cod_amount: float


class ShopOrderStatusIn(BaseModel):
    status: str = Field(pattern="^(placed|confirmed|shipped|delivered|cancelled)$")
    courier: str = Field(default="", max_length=80)
    tracking_number: str = Field(default="", max_length=80)
    note: str = Field(default="", max_length=500)


class MeOut(BaseModel):
    id: str
    email: str
    is_admin: bool


class ConsultationRequestIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    place: str = Field(min_length=1, max_length=200)
    topic: str = Field(pattern="^(love|career|marriage|other)$")
    message: str = Field(default="", max_length=2000)
    session_id: str = Field(default="", pattern=r"^[a-z0-9-]{0,40}$")  # tarot session, if any
    kind: str = Field(default="consultation", pattern="^(consultation|ritual)$")
    # The client's face photo as a data: URL (PNG/JPEG/WebP). Exactly one is
    # required for tarot sessions and ritual requests (checked on create).
    photos: list[str] = Field(default_factory=list, max_length=1)
    dob: str = ""  # YYYY-MM-DD; required for tarot sessions and rituals (checked on create)

    @field_validator("dob")
    @classmethod
    def _valid_dob(cls, v: str) -> str:
        v = v.strip()
        if not v:
            return v
        try:
            d = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Date of birth must be a valid date")
        if d.year < 1900 or d > datetime.utcnow().date():
            raise ValueError("Date of birth must be a past date")
        return v


class FeeItemIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    amount: float = Field(ge=0, le=10_000_000)


class ConsultationRequestOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    place: str
    topic: str
    message: str
    status: str
    scheduled_at: datetime | None
    duration_minutes: int | None
    amount: float | None
    admin_note: str
    created_at: datetime
    payment_reference: str = ""
    session_id: str = ""
    session_name: str = ""
    fee_items: list[FeeItemIn] = Field(default_factory=list)
    kind: str = "consultation"
    photo_count: int = 0
    dob: str = ""
    channels: list[str] = Field(default_factory=lambda: ["chat", "audio", "video"])


class ConsultationApproveIn(BaseModel):
    scheduled_at: datetime  # sent by the admin UI as UTC ISO string
    duration_minutes: int = Field(gt=0, le=240)
    # Either a break-up (the total is its sum) or a single amount.
    fee_items: list[FeeItemIn] = Field(default_factory=list, max_length=8)
    amount: float | None = Field(default=None, ge=0)
    note: str = Field(default="", max_length=1000)
    # Ritual requests only: what the client gets once confirmed. (Consultations
    # follow their tarot session's setting.) None = leave unchanged.
    channels: list[str] | None = Field(default=None, min_length=1, max_length=3)

    @field_validator("channels")
    @classmethod
    def _known_channels(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if not set(v) <= {"chat", "audio", "video"}:
            raise ValueError("channels must be chat, audio or video")
        return [c for c in ("chat", "audio", "video") if c in v]

    @model_validator(mode="after")
    def _fee_given(self):
        if not self.fee_items and self.amount is None:
            raise ValueError("Enter the fee")
        return self


class ConsultationDecisionIn(BaseModel):
    note: str = Field(default="", max_length=1000)


class CallInfoOut(BaseModel):
    role: str  # "client" | "host"
    ice_servers: list[dict]
    request: ConsultationRequestOut


class CallSignalIn(BaseModel):
    kind: str = Field(pattern="^(join|offer|answer|ice|bye)$")
    data: dict = Field(default_factory=dict)


class CallSignalOut(BaseModel):
    id: str
    sender: str
    kind: str
    data: dict


class ChatMessageIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: str
    sender: str
    text: str
    created_at: datetime
    read_at: datetime | None


class ChatThreadOut(BaseModel):
    can_send: bool
    messages: list[ChatMessageOut]


class ChatConversationOut(BaseModel):
    request: "ConsultationRequestOut"
    last_message: ChatMessageOut | None
    unread: int  # client messages the host hasn't read


class UpiPaymentInfoOut(BaseModel):
    upi_id: str  # may be empty when only a QR image was uploaded
    payee_name: str
    amount: float
    note: str
    upi_uri: str | None  # when set, the client renders this as a QR (amount pre-filled)
    qr_image: str | None  # admin-uploaded QR as a data: URL (amount entered by the payer)


class PaymentSubmittedIn(BaseModel):
    reference: str = Field(default="", max_length=64)


class UpiSettingsOut(BaseModel):
    upi_id: str
    payee_name: str
    qr_image: str | None  # data: URL
    updated_at: datetime | None


class UpiSettingsIn(BaseModel):
    upi_id: str = Field(default="", max_length=100)
    payee_name: str = Field(default="Vidushi Ji", min_length=1, max_length=100)


class UpiQrIn(BaseModel):
    data_url: str  # "data:image/png;base64,..."


class AdminCountsOut(BaseModel):
    pending: int
    payment_submitted: int


class ImageUploadIn(BaseModel):
    data_url: str  # "data:image/jpeg;base64,..."


class ContactMessageIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=20)
    message: str = Field(min_length=1, max_length=4000)
    website: str = ""  # honeypot: real visitors never fill this hidden field


class ContactMessageOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    message: str
    handled: bool
    created_at: datetime


SOCIAL_PLATFORMS = "^(instagram|facebook|youtube|x|whatsapp|linkedin|telegram|website)$"


class SocialLinkIn(BaseModel):
    platform: str = Field(pattern=SOCIAL_PLATFORMS)
    url: str = Field(min_length=1, max_length=300)


class SiteSettingsIn(BaseModel):
    phone: str = Field(default="", max_length=30)
    show_phone: bool = True
    email: str = Field(default="", max_length=120)
    show_email: bool = True
    address: str = Field(default="", max_length=300)
    show_address: bool = True
    hours: str = Field(default="", max_length=120)
    show_hours: bool = True
    whatsapp: str = Field(default="", max_length=20)
    show_whatsapp: bool = False
    social_links: list[SocialLinkIn] = Field(default_factory=list, max_length=12)


class SiteSettingsOut(SiteSettingsIn):
    pass


class PublicSiteOut(BaseModel):
    """Only what is switched on; hidden fields come back empty."""
    phone: str
    email: str
    address: str
    hours: str
    whatsapp: str
    social_links: list[SocialLinkIn]


class HomeStatIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    value: int = Field(ge=0, le=100_000_000)
    suffix: str = Field(default="+", max_length=4)


class TestimonialIn(BaseModel):
    quote: str = Field(min_length=1, max_length=1000)
    name: str = Field(min_length=1, max_length=80)
    detail: str = Field(default="", max_length=80)
    rating: int = Field(default=5, ge=1, le=5)
    photo_url: str | None = None


class ValueCardIn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=500)


class HomeContentIn(BaseModel):
    hero_title: str = Field(default="", max_length=200)
    hero_text: str = Field(default="", max_length=1000)
    hero_image_url: str | None = None
    about_title: str = Field(default="", max_length=200)
    about_text: str = Field(default="", max_length=2000)
    about_image1_url: str | None = None
    about_image2_url: str | None = None
    years_experience: int = Field(default=10, ge=0, le=100)
    stats: list[HomeStatIn] = Field(default_factory=list, max_length=4)
    testimonials: list[TestimonialIn] = Field(default_factory=list, max_length=20)
    story_title: str = Field(default="", max_length=200)
    story_text: str = Field(default="", max_length=5000)
    values: list[ValueCardIn] = Field(default_factory=list, max_length=6)


class HomeContentOut(HomeContentIn):
    pass


TAROT_ICONS = "tarot|runes|oracle|dice|cartomancy|palmistry|numerology|any|love|career|health"


class TarotSessionIn(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9-]{1,40}$")
    group: str = Field(pattern="^(call|reading|area)$")
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    price: int | None = Field(default=None, ge=0, le=10_000_000)
    tag: str = Field(default="", max_length=30)
    channels: list[str] = Field(default_factory=lambda: ["chat", "audio", "video"], min_length=1, max_length=3)

    @field_validator("channels")
    @classmethod
    def _known_channels(cls, v: list[str]) -> list[str]:
        if not set(v) <= {"chat", "audio", "video"}:
            raise ValueError("channels must be chat, audio or video")
        return [c for c in ("chat", "audio", "video") if c in v]


class TarotModalityIn(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    icon: str = Field(default="any", pattern=f"^({TAROT_ICONS})$")


class TarotStepIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(default="", max_length=500)
    items: list[str] = Field(default_factory=list, max_length=10)


class TarotContentIn(BaseModel):
    tagline: str = Field(default="", max_length=200)
    badges: list[str] = Field(default_factory=list, max_length=6)
    sessions_title: str = Field(default="", max_length=120)
    sessions_subtitle: str = Field(default="", max_length=300)
    sessions: list[TarotSessionIn] = Field(default_factory=list, max_length=30)
    areas_title: str = Field(default="", max_length=120)
    areas_subtitle: str = Field(default="", max_length=300)
    areas_note: str = Field(default="", max_length=500)
    modalities_title: str = Field(default="", max_length=120)
    modalities_intro: str = Field(default="", max_length=500)
    modalities_note: str = Field(default="", max_length=800)
    modalities: list[TarotModalityIn] = Field(default_factory=list, max_length=12)
    how_title: str = Field(default="", max_length=120)
    steps: list[TarotStepIn] = Field(default_factory=list, max_length=6)
    how_note: str = Field(default="", max_length=500)


class TarotContentOut(TarotContentIn):
    pass


# ---- Reviews ----

class ReviewIn(BaseModel):
    target: str = Field(pattern="^(booking|order)$")  # a consultation/ritual booking, or a shop order
    target_id: str = Field(min_length=1, max_length=40)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=1000)


class ReviewOut(BaseModel):
    id: str
    target_kind: str  # "consultation" | "ritual" | "order"
    rating: int
    text: str
    name: str
    label: str
    created_at: datetime


class ReviewPageOut(BaseModel):
    items: list[ReviewOut]
    total: int
    average: float | None  # over every visible review


class MyReviewOut(ReviewOut):
    target_id: str


class AdminReviewOut(ReviewOut):
    target_id: str
    hidden: bool


class ReviewHiddenIn(BaseModel):
    hidden: bool
