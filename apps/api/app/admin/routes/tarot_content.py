"""Admin: the home page's tarot sections — sessions & prices, guidance areas,
modalities and booking steps."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.api.routes.home import get_tarot_content, tarot_out
from app.core.live import HOME, bump
from app.models.models import TarotModality, TarotSession, TarotStep
from app.schemas.schemas import TarotContentIn, TarotContentOut

router = APIRouter(prefix="/admin/tarot", tags=["admin"], dependencies=[Depends(get_current_admin)])


def _clean(items: list[str]) -> list[str]:
    return [s.strip() for s in items if s.strip()]


@router.get("", response_model=TarotContentOut)
async def get_tarot():
    return tarot_out(await get_tarot_content())


@router.put("", response_model=TarotContentOut)
async def update_tarot(payload: TarotContentIn):
    ids = [s.id for s in payload.sessions]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Two sessions share the same id")

    c = await get_tarot_content()
    c.tagline = payload.tagline.strip()
    c.badges = _clean(payload.badges)
    c.sessions_title, c.sessions_subtitle = payload.sessions_title.strip(), payload.sessions_subtitle.strip()
    c.sessions = [
        TarotSession(id=s.id, group=s.group, name=s.name.strip(), description=s.description.strip(),
                     price=s.price, tag=s.tag.strip(), channels=s.channels)
        for s in payload.sessions
    ]
    c.areas_title, c.areas_subtitle = payload.areas_title.strip(), payload.areas_subtitle.strip()
    c.areas_note = payload.areas_note.strip()
    c.modalities_title, c.modalities_intro = payload.modalities_title.strip(), payload.modalities_intro.strip()
    c.modalities_note = payload.modalities_note.strip()
    c.modalities = [TarotModality(name=m.name.strip(), icon=m.icon) for m in payload.modalities]
    c.how_title = payload.how_title.strip()
    c.steps = [TarotStep(title=s.title.strip(), body=s.body.strip(), items=_clean(s.items)) for s in payload.steps]
    c.how_note = payload.how_note.strip()
    c.updated_at = datetime.utcnow()
    if c.id:
        await c.save()
    else:
        await c.insert()
    await bump(HOME)
    return tarot_out(c)
