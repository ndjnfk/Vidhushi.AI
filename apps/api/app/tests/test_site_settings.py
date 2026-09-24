import pytest
from fastapi import HTTPException

from app.admin.routes import site as admin_site
from app.api.routes import site
from app.schemas.schemas import SiteSettingsIn, SocialLinkIn


async def test_defaults_then_edit_and_hide():
    pub = await site.public_site()
    assert pub.phone and pub.email and pub.whatsapp == ""  # defaults, whatsapp off

    saved = await admin_site.update_site(SiteSettingsIn(
        phone=" +91 98765 43210 ", email="vidushi@example.com", address="Delhi", show_address=False,
        hours="Daily 9–6", whatsapp="+91 98765-43210", show_whatsapp=True,
        social_links=[SocialLinkIn(platform="instagram", url="instagram.com/vidushiji"),
                      SocialLinkIn(platform="youtube", url="https://youtube.com/@vidushiji")],
    ))
    assert saved.phone == "+91 98765 43210" and saved.whatsapp == "919876543210"
    assert saved.social_links[0].url == "https://instagram.com/vidushiji"

    pub = await site.public_site()
    assert pub.address == "" and pub.phone == "+91 98765 43210" and pub.whatsapp == "919876543210"
    assert [l.platform for l in pub.social_links] == ["instagram", "youtube"]
    assert (await admin_site.get_site()).address == "Delhi"  # admin still sees hidden value


@pytest.mark.parametrize("bad", [
    dict(phone="", show_phone=True),
    dict(email="not-an-email"),
    dict(social_links=[SocialLinkIn(platform="instagram", url="javascript:alert(1)")]),
])
async def test_validation(bad):
    base = dict(phone="1", email="a@b.co", address="x", hours="x")
    with pytest.raises(HTTPException):
        await admin_site.update_site(SiteSettingsIn(**{**base, **bad}))


def test_platform_whitelist():
    with pytest.raises(ValueError):
        SocialLinkIn(platform="myspace", url="https://x.com")
