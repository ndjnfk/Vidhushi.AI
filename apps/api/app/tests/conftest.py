import pytest_asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.models.models import (
    BlogPost,
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
            Product, ShopOrder,
        ],
    )
    yield
    await client.drop_database(db_name)
    client.close()
