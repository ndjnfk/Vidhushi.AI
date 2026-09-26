from fastapi import APIRouter, HTTPException, Response

from app.models.models import HomeContent, SiteImage, TarotContent
from app.schemas.schemas import HomeContentOut, TarotContentOut

router = APIRouter(tags=["home"])


async def get_home_content() -> HomeContent:
    return await HomeContent.find_one() or HomeContent()


def home_out(h: HomeContent) -> HomeContentOut:
    return HomeContentOut(**h.model_dump(include=set(HomeContentOut.model_fields)))


async def get_tarot_content() -> TarotContent:
    return await TarotContent.find_one() or TarotContent()


def tarot_out(c: TarotContent) -> TarotContentOut:
    return TarotContentOut(**c.model_dump(include=set(TarotContentOut.model_fields)))


@router.get("/site/home", response_model=HomeContentOut)
async def public_home():
    return home_out(await get_home_content())


@router.get("/site/tarot", response_model=TarotContentOut)
async def public_tarot():
    """Home page tarot sections. Empty fields = the site's built-in defaults."""
    return tarot_out(await get_tarot_content())


@router.get("/site/images/{slot}")
async def site_image(slot: str):
    img = await SiteImage.find_one(SiteImage.slot == slot)
    if img is None:
        raise HTTPException(status_code=404, detail="No image")
    # URLs carry ?v=<timestamp>, so a replaced image gets a new URL.
    return Response(content=img.data, media_type=img.content_type,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})
