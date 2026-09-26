"""Customer reviews: after a consultation/ritual is completed or a shop order
is delivered, its owner can rate it once. Visible reviews are listed on the
public Reviews page, 10 at a time. The admin side is app.admin.routes.reviews."""
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import DuplicateKeyError

from app.core.deps import get_current_user
from app.core.notify import notify_admins
from app.models.models import ConsultationRequest, Review, ShopOrder, User
from app.schemas.schemas import MyReviewOut, ReviewIn, ReviewOut, ReviewPageOut

router = APIRouter(prefix="/reviews", tags=["reviews"])

PAGE = 10


def review_out(r: Review) -> ReviewOut:
    return ReviewOut(id=str(r.id), target_kind=r.target_kind, rating=r.rating, text=r.text, name=r.name,
                     label=r.label, created_at=r.created_at)


def short_name(full: str) -> str:
    """"Asha Verma" -> "Asha V." — enough to feel real, without the full name."""
    parts = full.split()
    if not parts:
        return "Customer"
    return parts[0].title() + (f" {parts[-1][0].upper()}." if len(parts) > 1 else "")


async def _get(model, target_id: str):
    try:
        return await model.get(PydanticObjectId(target_id))
    except Exception:
        return None


@router.get("", response_model=ReviewPageOut)
async def list_reviews(skip: int = Query(0, ge=0), limit: int = Query(PAGE, ge=1, le=50)):
    visible = {"hidden": False}
    rows = await Review.find(visible).sort("-created_at").skip(skip).limit(limit).to_list()
    total = await Review.find(visible).count()
    avg = await Review.get_motor_collection().aggregate(
        [{"$match": visible}, {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}]
    ).to_list(1)
    return ReviewPageOut(items=[review_out(r) for r in rows], total=total,
                         average=round(avg[0]["avg"], 1) if avg else None)


@router.get("/mine", response_model=list[MyReviewOut])
async def my_reviews(user: User = Depends(get_current_user)):
    """What this customer has already reviewed (so pages show it instead of the form)."""
    rows = await Review.find(Review.user_id == str(user.id)).to_list()
    return [MyReviewOut(**review_out(r).model_dump(), target_id=r.target_id) for r in rows]


@router.post("", response_model=ReviewOut)
async def create_review(payload: ReviewIn, user: User = Depends(get_current_user)):
    if payload.target == "booking":
        b = await _get(ConsultationRequest, payload.target_id)
        if b is None or b.user_id != str(user.id):
            raise HTTPException(status_code=404, detail="Booking not found")
        if b.status != "completed":
            raise HTTPException(status_code=400, detail="You can review it once it's completed")
        kind = "ritual" if b.kind == "ritual" else "consultation"
        name = b.name
        label = "Healing ritual" if kind == "ritual" else (b.session_name or "Consultation")
    else:
        o = await _get(ShopOrder, payload.target_id)
        if o is None or o.user_id != str(user.id):
            raise HTTPException(status_code=404, detail="Order not found")
        if o.status != "delivered":
            raise HTTPException(status_code=400, detail="You can review it once it's delivered")
        kind = "order"
        name = o.shipping_address.full_name
        label = o.items[0].product_name + (" & more" if len(o.items) > 1 else "") if o.items else "Shop order"

    r = Review(user_id=str(user.id), target_kind=kind, target_id=payload.target_id, rating=payload.rating,
               text=payload.text.strip(), name=short_name(name), label=label)
    try:
        await r.insert()
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="You've already reviewed this")
    await notify_admins(
        f"New {r.rating}-star review from {r.name}",
        f"{r.name} rated \"{r.label}\" {r.rating}/5:\n\n\"{r.text}\"\n\n"
        f"It's now on the Reviews page. You can hide it from the admin panel (Reviews) if needed.\n",
    )
    return review_out(r)
