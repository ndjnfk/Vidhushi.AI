"""Admin: every customer review, with Hide/Show for the public Reviews page and
Delete, plus reviews she adds herself (e.g. from clients from before the website)."""
import secrets
from datetime import datetime, time

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.api.routes.reviews import review_out
from app.core.live import REVIEWS, bump
from app.models.models import Review
from app.schemas.schemas import AdminReviewIn, AdminReviewOut, ReviewHiddenIn

router = APIRouter(prefix="/admin/reviews", tags=["admin"], dependencies=[Depends(get_current_admin)])


def admin_out(r: Review) -> AdminReviewOut:
    return AdminReviewOut(**review_out(r).model_dump(), target_id=r.target_id, hidden=r.hidden,
                          added_by_admin=r.added_by_admin)


@router.get("", response_model=list[AdminReviewOut])
async def list_all():
    return [admin_out(r) for r in await Review.find_all().sort("-created_at").to_list()]


@router.post("", response_model=AdminReviewOut)
async def add_review(payload: AdminReviewIn):
    """Shown on the public pages like any other, dated as given (noon UTC)."""
    r = Review(
        user_id="", target_kind=payload.target_kind, target_id=f"admin-{secrets.token_hex(8)}",
        rating=payload.rating, text=payload.text, name=payload.name, label=payload.label, added_by_admin=True,
        **({"created_at": datetime.combine(payload.given_on, time(12))} if payload.given_on else {}),
    )
    await r.insert()
    await bump(REVIEWS)
    return admin_out(r)


@router.put("/{review_id}", response_model=AdminReviewOut)
async def set_hidden(review_id: str, payload: ReviewHiddenIn):
    try:
        r = await Review.get(PydanticObjectId(review_id))
    except Exception:
        r = None
    if r is None:
        raise HTTPException(status_code=404, detail="Review not found")
    r.hidden = payload.hidden
    await r.save()
    await bump(REVIEWS)
    return admin_out(r)


@router.delete("/{review_id}")
async def delete_review(review_id: str) -> dict:
    """Removes it for good (Hide keeps it). The customer could then review again."""
    try:
        r = await Review.get(PydanticObjectId(review_id))
    except Exception:
        r = None
    if r is None:
        raise HTTPException(status_code=404, detail="Review not found")
    await r.delete()
    await bump(REVIEWS)
    return {"deleted": True}
