"""Admin: the Rituals page content — hero text and image, intentions, the
urgent-wish section and the enquiry steps. Empty = the built-in text."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.admin.routes.home import _own_image
from app.api.routes.home import get_rituals_content, rituals_out
from app.core.live import HOME, bump
from app.models.models import RitualIntentionItem
from app.schemas.schemas import RitualsContentIn, RitualsContentOut

router = APIRouter(prefix="/admin/rituals-page", tags=["admin"], dependencies=[Depends(get_current_admin)])

TEXT_FIELDS = ("hero_title", "hero_text", "charges_note", "intentions_title", "intentions_subtitle",
               "urgent_title", "urgent_lead", "urgent_body", "how_title", "how_intro")


@router.get("", response_model=RitualsContentOut)
async def get_page():
    return rituals_out(await get_rituals_content())


@router.put("", response_model=RitualsContentOut)
async def update_page(payload: RitualsContentIn):
    ids = [i.id for i in payload.intentions]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Two intentions share the same id")
    c = await get_rituals_content()
    for field in TEXT_FIELDS:
        setattr(c, field, getattr(payload, field).strip())
    c.hero_image_url = _own_image(payload.hero_image_url)
    c.intentions = [RitualIntentionItem(id=i.id, name=i.name.strip()) for i in payload.intentions]
    c.steps = [s.strip() for s in payload.steps if s.strip()]
    c.updated_at = datetime.utcnow()
    if c.id:
        await c.save()
    else:
        await c.insert()
    await bump(HOME)
    return rituals_out(c)
