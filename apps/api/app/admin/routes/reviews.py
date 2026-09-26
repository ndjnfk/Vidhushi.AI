"""Admin: every customer review, with Hide/Show for the public Reviews page."""
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.api.routes.reviews import review_out
from app.models.models import Review
from app.schemas.schemas import AdminReviewOut, ReviewHiddenIn

router = APIRouter(prefix="/admin/reviews", tags=["admin"], dependencies=[Depends(get_current_admin)])


def admin_out(r: Review) -> AdminReviewOut:
    return AdminReviewOut(**review_out(r).model_dump(), target_id=r.target_id, hidden=r.hidden)


@router.get("", response_model=list[AdminReviewOut])
async def list_all():
    return [admin_out(r) for r in await Review.find_all().sort("-created_at").to_list()]


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
    return admin_out(r)
