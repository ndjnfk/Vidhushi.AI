"""Admin: public contact details, visibility toggles and social links."""
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.live import SITE, bump
from app.core.site import get_site_settings, normalize_url
from app.models.models import SocialLink
from app.schemas.schemas import SiteSettingsIn, SiteSettingsOut

router = APIRouter(prefix="/admin/site", tags=["admin"], dependencies=[Depends(get_current_admin)])


def _out(s) -> SiteSettingsOut:
    return SiteSettingsOut(**s.model_dump(include=set(SiteSettingsIn.model_fields)))


@router.get("", response_model=SiteSettingsOut)
async def get_site():
    return _out(await get_site_settings())


@router.put("", response_model=SiteSettingsOut)
async def update_site(payload: SiteSettingsIn):
    data = payload.model_dump()
    for field in ("phone", "email", "address", "hours", "whatsapp"):
        data[field] = data[field].strip()
    data["whatsapp"] = re.sub(r"\D", "", data["whatsapp"])
    for field in ("phone", "email", "address", "hours", "whatsapp"):
        if data[f"show_{field}"] and not data[field]:
            raise HTTPException(status_code=422, detail=f"Fill in the {field} or switch it off")
    if data["email"] and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", data["email"]):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    links = []
    for link in payload.social_links:
        try:
            links.append(SocialLink(platform=link.platform, url=normalize_url(link.url)))
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
    data["social_links"] = links

    s = await get_site_settings()
    for k, v in data.items():
        setattr(s, k, v)
    s.updated_at = datetime.utcnow()
    if s.id:
        await s.save()
    else:
        await s.insert()
    await bump(SITE)
    return _out(s)
