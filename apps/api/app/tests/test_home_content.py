import base64

import pytest
from fastapi import HTTPException

from app.admin.routes import home as admin_home
from app.api.routes import home
from app.schemas.schemas import HomeContentIn, HomeLayoutIn, HomeStatIn, ImageUploadIn, RateItemIn, TestimonialIn, ValueCardIn

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



async def test_rate_list():
    d = await home.public_home()
    assert d.rates_title == "" and len(d.rates) == 10 and d.rates[0].price == 2222
    saved = await admin_home.update_home(HomeContentIn(
        rates_title=" Candle Spells ", rates=[RateItemIn(name=" Visa Success ", price=3100), RateItemIn(name="Custom")],
    ))
    assert saved.rates_title == "Candle Spells" and saved.rates[0].name == "Visa Success"
    pub = await home.public_home()
    assert [r.price for r in pub.rates] == [3100, None]
    with pytest.raises(ValueError):
        RateItemIn(name="x", price=-1)



async def test_layout_hide_and_reorder():
    d = await home.public_home()
    assert d.hidden_sections == [] and d.section_order == []
    saved = await admin_home.update_layout(HomeLayoutIn(hidden_sections=["stats", "rates", "stats"],
                                                        section_order=["reviews", "hero"]))
    assert saved.hidden_sections == ["stats", "rates"]
    assert saved.section_order[:3] == ["reviews", "hero", "about"] and len(saved.section_order) == 10
    # Saving the content keeps the layout.
    await admin_home.update_home(HomeContentIn(hero_title="Hi"))
    pub = await home.public_home()
    assert pub.hidden_sections == ["stats", "rates"] and pub.section_order[0] == "reviews"
    with pytest.raises(ValueError):
        HomeLayoutIn(hidden_sections=["nope"])
