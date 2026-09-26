from fastapi import APIRouter

from app.admin.routes import auth, bookings, catalog, chats, home, maintenance, messages, orders, payments, products, site, tarot_content

router = APIRouter()
router.include_router(auth.router)
router.include_router(bookings.router)
router.include_router(chats.router)
router.include_router(payments.router)
router.include_router(orders.router)
router.include_router(products.router)
router.include_router(messages.router)
router.include_router(site.router)
router.include_router(home.router)
router.include_router(tarot_content.router)
router.include_router(catalog.router)
router.include_router(maintenance.router)
