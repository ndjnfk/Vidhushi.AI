import pytest
from fastapi import HTTPException

from app.admin.routes import home as admin_home
from app.admin.routes import rituals_page as admin_rituals
from app.api.routes import home
from app.schemas.schemas import ImageUploadIn, RitualIntentionIn, RitualsContentIn

PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


async def test_empty_by_default_so_the_site_shows_built_in_text():
    d = await home.public_rituals()
    assert d.hero_title == "" and d.hero_image_url is None and d.intentions == [] and d.steps == []


async def test_admin_edits_text_intentions_steps_and_image():
    img = await admin_home.upload_image("rituals-hero", ImageUploadIn(data_url=PNG))
    saved = await admin_rituals.update_page(RitualsContentIn(
        hero_title=" Healing Rituals by Vidushi ", hero_image_url=img["url"],
        intentions=[RitualIntentionIn(id="love", name=" Love & Marriage "), RitualIntentionIn(id="r-ab12", name="New home")],
        steps=[" Share your intention ", "  ", "Pay and relax"],
    ))
    assert saved.hero_title == "Healing Rituals by Vidushi" and saved.hero_image_url == img["url"]
    assert [(i.id, i.name) for i in saved.intentions] == [("love", "Love & Marriage"), ("r-ab12", "New home")]
    assert saved.steps == ["Share your intention", "Pay and relax"]
    assert (await home.public_rituals()).intentions[1].name == "New home"


async def test_rejects_foreign_images_and_duplicate_ids():
    with pytest.raises(HTTPException):
        await admin_rituals.update_page(RitualsContentIn(hero_image_url="https://evil.example/x.png"))
    with pytest.raises(HTTPException):
        await admin_rituals.update_page(RitualsContentIn(intentions=[
            RitualIntentionIn(id="a", name="A"), RitualIntentionIn(id="a", name="B")]))
