"""Admin: every customer review, with Hide/Show for the public Reviews page and
Delete, plus reviews she adds herself (e.g. from clients from before the website)."""
import secrets
from datetime import datetime, time

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.api.routes.reviews import review_out, screenshot_out
from app.core.live import REVIEWS, bump
from app.core.upi import decode_image_upload
from app.models.models import Review, ReviewScreenshot
from app.schemas.schemas import AdminReviewIn, AdminReviewOut, ReviewHiddenIn, ReviewScreenshotIn, ReviewScreenshotOut

router = APIRouter(prefix="/admin/reviews", tags=["admin"], dependencies=[Depends(get_current_admin)])

MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024  # the browser shrinks them well below this


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


@router.post("/screenshots", response_model=ReviewScreenshotOut)
async def add_screenshot(payload: ReviewScreenshotIn):
    """A screenshot of a review from WhatsApp etc., for the Reviews page slider."""
    try:
        data, content_type = decode_image_upload(payload.data_url, MAX_SCREENSHOT_BYTES)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    s = ReviewScreenshot(data=data, content_type=content_type, caption=payload.caption.strip())
    await s.insert()
    await bump(REVIEWS)
    return screenshot_out(s)


@router.delete("/screenshots/{screenshot_id}")
async def delete_screenshot(screenshot_id: str) -> dict:
    try:
        s = await ReviewScreenshot.get(PydanticObjectId(screenshot_id))
    except Exception:
        s = None
    if s is None:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    await s.delete()
    await bump(REVIEWS)
    return {"deleted": True}


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
