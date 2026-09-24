from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.api.routes import live
from app.api.routes import astrologers, auth, blog, bookings, chat, contact, home, site, consultations, kundli, matching, panchang, payments, poojas, rituals, shop, storefront, tarot
from app.core.config import get_settings
from app.core import email
from app.core.db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await email.drain()  # let queued emails finish sending


app = FastAPI(title="Vidushiji.ai Astrology API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kundli.router)
app.include_router(panchang.router)
app.include_router(matching.router)
app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(poojas.router)
app.include_router(rituals.router)
app.include_router(astrologers.router)
app.include_router(consultations.router)
app.include_router(bookings.router)
app.include_router(chat.router)
app.include_router(contact.router)
app.include_router(site.router)
app.include_router(live.router)
app.include_router(home.router)
app.include_router(admin_router)
app.include_router(tarot.router)
app.include_router(blog.router)
app.include_router(shop.router)
app.include_router(storefront.router)


@app.get("/health")
def health():
    return {"status": "ok"}
