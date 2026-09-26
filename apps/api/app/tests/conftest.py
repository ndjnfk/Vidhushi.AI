import pytest
import pytest_asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.models.models import (
    BlogPost,
    CallSignal,
    ChatMessage,
    HomeContent,
    BookingPhoto,
    Review,
    TarotContent,
    SiteImage,
    Revision,
    SiteSettings,
    ContactMessage,
    ProductImage,
    UpiSettings,
    ConsultationRequest,
    ConsultationBooking,
    ConsultationMessage,
    Kundli,
    Order,
    PaymentSettings,
    PoojaBooking,
    PoojaService,
    Product,
    RitualBooking,
    RitualCharge,
    RitualService,
    ShopOrder,
    TarotReading,
    User,
    Vendor,
)


@pytest.fixture(autouse=True)
def _no_real_email(monkeypatch):
    """Tests must never send real email, whatever SMTP settings .env holds."""
    settings = get_settings()
    monkeypatch.setattr(settings, "smtp_host", None)
    monkeypatch.setattr(settings, "smtp_user", None)
    monkeypatch.setattr(settings, "smtp_password", None)


@pytest_asyncio.fixture(autouse=True)
async def _test_db():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri)
    db_name = f"{settings.mongo_db_name}_test"
    await init_beanie(
        database=client[db_name],
        document_models=[
            User, Kundli, PaymentSettings, Order, Vendor,
            PoojaService, PoojaBooking, RitualService, RitualBooking, RitualCharge,
            ConsultationBooking, ConsultationMessage, TarotReading, BlogPost,
            Product, ShopOrder, ConsultationRequest, CallSignal, ChatMessage, UpiSettings, ProductImage, ContactMessage, SiteSettings, HomeContent, BookingPhoto, Review, TarotContent, SiteImage, Revision,
        ],
    )
    yield
    await client.drop_database(db_name)
    client.close()
