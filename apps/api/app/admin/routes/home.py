"""Admin: home page content — hero, about, experience, stats, testimonials."""
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.live import HOME, bump
from app.api.routes.home import get_home_content, home_out
from app.core.config import get_settings
from app.core.upi import decode_image_upload
from app.models.models import HomeStat, SiteImage, Testimonial, ValueCard
from app.schemas.schemas import HomeContentIn, HomeContentOut, ImageUploadIn

router = APIRouter(prefix="/admin/home", tags=["admin"], dependencies=[Depends(get_current_admin)])

MAX_IMAGE_BYTES = 3 * 1024 * 1024
SLOT_RE = re.compile(r"^(hero|about1|about2|review-[a-z0-9]{1,24})$")


def _own_image(url: str | None) -> str | None:
    """Only accept image URLs this API issued (or none)."""
    if not url:
        return None
    base = f"{get_settings().api_public_url}/site/images/"
    if not url.startswith(base):
        raise HTTPException(status_code=422, detail="Images must be uploaded here")
    return url


@router.get("", response_model=HomeContentOut)
async def get_home():
    return home_out(await get_home_content())


@router.put("", response_model=HomeContentOut)
async def update_home(payload: HomeContentIn):
    h = await get_home_content()
    h.hero_title, h.hero_text = payload.hero_title.strip(), payload.hero_text.strip()
    h.about_title, h.about_text = payload.about_title.strip(), payload.about_text.strip()
    h.hero_image_url = _own_image(payload.hero_image_url)
    h.about_image1_url = _own_image(payload.about_image1_url)
    h.about_image2_url = _own_image(payload.about_image2_url)
    h.years_experience = payload.years_experience
    h.stats = [HomeStat(label=s.label.strip(), value=s.value, suffix=s.suffix.strip()) for s in payload.stats]
    h.testimonials = [
        Testimonial(quote=t.quote.strip(), name=t.name.strip(), detail=t.detail.strip(), rating=t.rating,
                    photo_url=_own_image(t.photo_url))
        for t in payload.testimonials
    ]
    h.story_title, h.story_text = payload.story_title.strip(), payload.story_text.strip()
    h.values = [ValueCard(title=v.title.strip(), body=v.body.strip()) for v in payload.values]
    h.updated_at = datetime.utcnow()
    if h.id:
        await h.save()
    else:
        await h.insert()
    await bump(HOME)
    return home_out(h)


@router.put("/images/{slot}")
async def upload_image(slot: str, payload: ImageUploadIn) -> dict:
    """Store an image and return its URL; the caller puts that URL into the
    content and saves. (Reviewer photos use slots like "review-ab12".)"""
    if not SLOT_RE.match(slot):
        raise HTTPException(status_code=422, detail="Unknown image slot")
    try:
        raw, content_type = decode_image_upload(payload.data_url, MAX_IMAGE_BYTES)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    img = await SiteImage.find_one(SiteImage.slot == slot)
    if img is None:
        img = SiteImage(slot=slot, data=raw, content_type=content_type)
        await img.insert()
    else:
        img.data, img.content_type, img.updated_at = raw, content_type, datetime.utcnow()
        await img.save()
    return {"url": f"{get_settings().api_public_url}/site/images/{slot}?v={int(img.updated_at.timestamp())}"}
