"""Admin: "Clear data" — deletes the customer records only: every non-admin
user, every consultation (with its chat and call history), every product
and every order. Site settings, home page content, the UPI QR, contact
messages, kundlis and tarot readings are kept. Needs the admin's password
and the word DELETE."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.admin.deps import get_current_admin
from app.core.live import PRODUCTS, bump
from app.core.security import verify_password
from app.models.models import (
    BookingPhoto,
    Review,
    CallSignal,
    ChatMessage,
    ConsultationBooking,
    ConsultationMessage,
    ConsultationRequest,
    Order,
    Product,
    ProductImage,
    ShopOrder,
    User,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/maintenance", tags=["admin"])

CONFIRM_WORD = "DELETE"

# (model, filter) — what "Clear data" removes.
TARGETS = [
    (User, {"is_admin": {"$ne": True}}),
    (ConsultationRequest, {}),
    (BookingPhoto, {}),
    (Review, {}),
    (ChatMessage, {}),
    (CallSignal, {}),
    (ConsultationBooking, {}),
    (ConsultationMessage, {}),
    (Product, {}),
    (ProductImage, {}),
    (ShopOrder, {}),
    (Order, {}),
]


class ClearDataIn(BaseModel):
    password: str
    confirm: str


@router.post("/clear-data")
async def clear_data(payload: ClearDataIn, admin: User = Depends(get_current_admin)) -> dict:
    if payload.confirm.strip() != CONFIRM_WORD:
        raise HTTPException(status_code=400, detail=f'Type "{CONFIRM_WORD}" to confirm')
    # 400 (not 401) so a typo doesn't sign the admin out.
    if not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong password")

    deleted: dict[str, int] = {}
    for model, query in TARGETS:
        coll = model.get_motor_collection()
        n = (await coll.delete_many(query)).deleted_count
        if n:
            deleted[coll.name] = n
    await bump(PRODUCTS)  # open shop pages empty out straight away
    log.warning("Admin %s cleared customer data: %s", admin.email, deleted)
    return {"deleted": deleted, "total": sum(deleted.values())}
