"""Point saved image URLs at a new API address (e.g. after moving the site to HTTPS).

Uploaded images are stored with their full URL (API_PUBLIC_URL + path), so
changing API_PUBLIC_URL leaves older images on the old address. This rewrites
the old prefix to the new one in the home page content and the products.

Shows what would change first; add --apply to save:

    python -m app.scripts.rewrite_image_urls http://93.127.195.27/api https://vidushiji.com/api
    python -m app.scripts.rewrite_image_urls http://93.127.195.27/api https://vidushiji.com/api --apply
"""
import asyncio
import sys

from app.core.db import init_db
from app.models.models import HomeContent, Product


def _swap(url: str | None, old: str, new: str) -> str | None:
    return new + url[len(old):] if url and url.startswith(old) else url


async def main(old: str, new: str, apply: bool) -> None:
    await init_db()
    old, new = old.rstrip("/"), new.rstrip("/")
    changes = 0

    for h in await HomeContent.find_all().to_list():
        before = h.model_dump()
        h.hero_image_url = _swap(h.hero_image_url, old, new)
        h.about_image1_url = _swap(h.about_image1_url, old, new)
        h.about_image2_url = _swap(h.about_image2_url, old, new)
        for t in h.testimonials:
            t.photo_url = _swap(t.photo_url, old, new)
        if h.model_dump() != before:
            changes += 1
            print("home page content: image URLs updated")
            if apply:
                await h.save()

    for p in await Product.find_all().to_list():
        url = _swap(p.image_url, old, new)
        if url != p.image_url:
            changes += 1
            print(f"product {p.name!r}: {p.image_url} -> {url}")
            if apply:
                p.image_url = url
                await p.save()

    if not changes:
        print(f"Nothing starts with {old} — nothing to change.")
    elif apply:
        print(f"Done: {changes} record(s) updated.")
    else:
        print(f"{changes} record(s) would change. Run again with --apply to save.")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--apply"]
    if len(args) != 2:
        sys.exit(__doc__)
    asyncio.run(main(args[0], args[1], "--apply" in sys.argv))
