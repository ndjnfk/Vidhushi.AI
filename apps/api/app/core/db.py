from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongo_uri)

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

    await init_beanie(
        database=_client[settings.mongo_db_name],
        document_models=[
            User,
            Kundli,
            PaymentSettings,
            Order,
            Vendor,
            PoojaService,
            PoojaBooking,
            RitualService,
            RitualBooking,
            RitualCharge,
            ConsultationBooking,
            ConsultationMessage,
            TarotReading,
            BlogPost,
            Product,
            ShopOrder,
        ],
    )
