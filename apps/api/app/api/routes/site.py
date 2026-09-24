from fastapi import APIRouter

from app.core.site import get_site_settings
from app.schemas.schemas import PublicSiteOut, SocialLinkIn

router = APIRouter(prefix="/site", tags=["site"])


@router.get("", response_model=PublicSiteOut)
async def public_site():
    s = await get_site_settings()
    return PublicSiteOut(
        phone=s.phone if s.show_phone else "",
        email=s.email if s.show_email else "",
        address=s.address if s.show_address else "",
        hours=s.hours if s.show_hours else "",
        whatsapp=s.whatsapp if s.show_whatsapp else "",
        social_links=[SocialLinkIn(**l.model_dump()) for l in s.social_links],
    )
