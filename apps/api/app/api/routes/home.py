from fastapi import APIRouter, HTTPException, Response

from app.models.models import HomeContent, SiteImage
from app.schemas.schemas import HomeContentOut

router = APIRouter(tags=["home"])


async def get_home_content() -> HomeContent:
    return await HomeContent.find_one() or HomeContent()


def home_out(h: HomeContent) -> HomeContentOut:
    return HomeContentOut(**h.model_dump(include=set(HomeContentOut.model_fields)))


@router.get("/site/home", response_model=HomeContentOut)
async def public_home():
    return home_out(await get_home_content())


@router.get("/site/images/{slot}")
async def site_image(slot: str):
    img = await SiteImage.find_one(SiteImage.slot == slot)
    if img is None:
        raise HTTPException(status_code=404, detail="No image")
    # URLs carry ?v=<timestamp>, so a replaced image gets a new URL.
    return Response(content=img.data, media_type=img.content_type,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})
