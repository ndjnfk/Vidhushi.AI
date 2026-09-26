import pytest
from fastapi import HTTPException

from app.admin.routes import tarot_content as admin_tarot
from app.api.routes import home
from app.schemas.schemas import TarotContentIn, TarotModalityIn, TarotSessionIn, TarotStepIn


async def test_empty_by_default_so_site_uses_built_in_content():
    d = await home.public_tarot()
    assert d.tagline == "" and d.sessions == [] and d.modalities == [] and d.steps == []


async def test_edit_sessions_and_sections():
    saved = await admin_tarot.update_tarot(TarotContentIn(
        tagline=" Find clarity ",
        badges=[" One-on-one ", "  "],
        sessions=[
            TarotSessionIn(id="call-15", group="call", name=" 15-Minute Call ", description="Quick", price=1099, tag="15 min"),
            TarotSessionIn(id="area-love", group="area", name="Love", price=None),
        ],
        modalities=[TarotModalityIn(name="Runes", icon="runes")],
        steps=[TarotStepIn(title="Pick a slot", items=["Name", " "])],
    ))
    assert saved.tagline == "Find clarity" and saved.badges == ["One-on-one"]
    assert saved.sessions[0].name == "15-Minute Call" and saved.sessions[0].price == 1099
    assert saved.sessions[1].price is None and saved.steps[0].items == ["Name"]

    pub = await home.public_tarot()
    assert [s.id for s in pub.sessions] == ["call-15", "area-love"] and pub.modalities[0].icon == "runes"

    # Clearing a list goes back to the built-in default on the site.
    cleared = await admin_tarot.update_tarot(TarotContentIn(tagline="x"))
    assert cleared.sessions == [] and cleared.tagline == "x"


async def test_rejects_bad_sessions():
    with pytest.raises(HTTPException):
        await admin_tarot.update_tarot(TarotContentIn(sessions=[
            TarotSessionIn(id="a", group="call", name="A"), TarotSessionIn(id="a", group="call", name="B"),
        ]))
    with pytest.raises(ValueError):
        TarotSessionIn(id="Bad Id", group="call", name="A")
    with pytest.raises(ValueError):
        TarotSessionIn(id="a", group="vip", name="A")
    with pytest.raises(ValueError):
        TarotModalityIn(name="Crystals", icon="crystal")
