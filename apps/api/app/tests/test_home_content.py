import base64

import pytest
from fastapi import HTTPException

from app.admin.routes import home as admin_home
from app.api.routes import home
from app.schemas.schemas import HomeContentIn, HomeStatIn, ImageUploadIn, TestimonialIn, ValueCardIn

PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


async def test_defaults_edit_and_images():
    d = await home.public_home()
    assert d.hero_title == "" and d.years_experience == 10 and len(d.stats) == 3 and len(d.testimonials) == 3

    up = await admin_home.upload_image("hero", ImageUploadIn(data_url=PNG))
    assert "/site/images/hero?v=" in up["url"]
    img = await home.site_image("hero")
    assert img.media_type == "image/png" and img.body == base64.b64decode(PNG.split(",")[1])
    rv = await admin_home.upload_image("review-ab12", ImageUploadIn(data_url=PNG))

    saved = await admin_home.update_home(HomeContentIn(
        hero_title=" The cards know ", hero_text="Hello", hero_image_url=up["url"], years_experience=15,
        stats=[HomeStatIn(label="Readings", value=2500)],
        testimonials=[TestimonialIn(quote="Life-changing", name="Riya", detail="Delhi", rating=4, photo_url=rv["url"])],
    ))
    assert saved.hero_title == "The cards know" and saved.years_experience == 15
    pub = await home.public_home()
    assert pub.stats[0].value == 2500 and pub.testimonials[0].photo_url == rv["url"] and pub.hero_image_url == up["url"]


async def test_rejects_foreign_images_and_bad_slots():
    with pytest.raises(HTTPException):
        await admin_home.update_home(HomeContentIn(hero_image_url="https://evil.example/x.png"))
    with pytest.raises(HTTPException):
        await admin_home.upload_image("../etc", ImageUploadIn(data_url=PNG))
    with pytest.raises(ValueError):
        TestimonialIn(quote="x", name="y", rating=6)
    with pytest.raises(ValueError):
        HomeContentIn(stats=[HomeStatIn(label="a", value=1)] * 5)


async def test_about_page_story_and_values():
    assert (await home.public_home()).values == []
    saved = await admin_home.update_home(HomeContentIn(
        story_title="My journey", story_text="Para one.\n\nPara two.",
        values=[ValueCardIn(title=" Trust ", body="Honest advice")],
    ))
    assert saved.story_title == "My journey" and saved.values[0].title == "Trust"

