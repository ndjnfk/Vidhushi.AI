import re

from app.models.models import SiteSettings


async def get_site_settings() -> SiteSettings:
    return await SiteSettings.find_one() or SiteSettings()


def normalize_url(url: str) -> str:
    """Accept "instagram.com/x" as well as full links; only http(s) is allowed."""
    url = url.strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url.lstrip("/")
    if not re.match(r"^https?://[^\s/]+\.[^\s]+$", url, re.I):
        raise ValueError(f"Not a valid link: {url}")
    return url
