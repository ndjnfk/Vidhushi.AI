from app.models.models import BlogPost


async def test_only_published_posts_are_listed():
    await BlogPost(title="Live Post", slug="live-post", excerpt="e", body="b", published=True).insert()
    await BlogPost(title="Draft Post", slug="draft-post", excerpt="e", body="b", published=False).insert()

    published = await BlogPost.find({"published": True}).to_list()
    assert len(published) == 1
    assert published[0].slug == "live-post"


async def test_slug_uniqueness_enforced_by_index():
    await BlogPost(title="First", slug="dup-slug", excerpt="e", body="b").insert()
    with __import__("pytest").raises(Exception):
        await BlogPost(title="Second", slug="dup-slug", excerpt="e", body="b").insert()


async def test_tag_filtering():
    await BlogPost(title="A", slug="a", excerpt="e", body="b", tags=["kundli", "basics"]).insert()
    await BlogPost(title="B", slug="b", excerpt="e", body="b", tags=["compatibility"]).insert()

    tagged = await BlogPost.find({"published": True, "tags": "kundli"}).to_list()
    assert len(tagged) == 1
    assert tagged[0].slug == "a"


# ---- Admin editor + public API ----

import pytest as _pytest
from fastapi import HTTPException

from app.admin.routes import catalog
from app.api.routes import blog
from app.core.config import get_settings
from app.schemas.schemas import BlogPostCreate, BlogPostUpdate


def _post(**kw) -> BlogPostCreate:
    data = {"title": "What is Manglik Dosha?", "slug": "manglik-dosha", "excerpt": "Short summary.", "body": "word " * 450}
    return BlogPostCreate(**{**data, **kw})


async def test_draft_is_hidden_until_published():
    p = await catalog.create_post(_post(tags=[" Kundli ", "kundli", "Marriage"]))
    assert not p.published and p.published_at is None
    assert p.tags == ["kundli", "marriage"]  # trimmed, lower-cased, de-duplicated
    assert await blog.list_posts() == []
    with _pytest.raises(HTTPException):
        await blog.get_post("manglik-dosha")

    live = await catalog.update_post(p.id, BlogPostUpdate(published=True, seo_title="Manglik Dosha: Meaning & Remedies"))
    assert live.published and live.published_at is not None
    listed = await blog.list_posts(tag="Kundli")
    assert [x.slug for x in listed] == ["manglik-dosha"] and listed[0].reading_minutes == 3
    full = await blog.get_post("manglik-dosha")
    assert full.seo_title == "Manglik Dosha: Meaning & Remedies"

    # Unpublishing and republishing keeps the original publish date.
    await catalog.update_post(p.id, BlogPostUpdate(published=False))
    again = await catalog.update_post(p.id, BlogPostUpdate(published=True))
    assert again.published_at == live.published_at


async def test_slug_rules():
    with _pytest.raises(ValueError):
        _post(slug="Not A Slug")
    a = await catalog.create_post(_post())
    with _pytest.raises(HTTPException):
        await catalog.create_post(_post(title="Other"))
    b = await catalog.create_post(_post(slug="sade-sati"))
    with _pytest.raises(HTTPException):
        await catalog.update_post(b.id, BlogPostUpdate(slug="manglik-dosha"))
    renamed = await catalog.update_post(a.id, BlogPostUpdate(slug="manglik-dosha-remedies"))
    assert renamed.slug == "manglik-dosha-remedies"


async def test_cover_must_be_an_uploaded_image():
    with _pytest.raises(HTTPException):
        await catalog.create_post(_post(cover_image_url="https://evil.example/x.png"))
    url = f"{get_settings().api_public_url}/site/images/blog-abc123?v=1"
    p = await catalog.create_post(_post(cover_image_url=url, cover_image_alt="Mars in a birth chart"))
    assert p.cover_image_url == url
    cleared = await catalog.update_post(p.id, BlogPostUpdate(cover_image_url=None))
    assert cleared.cover_image_url is None and cleared.cover_image_alt == "Mars in a birth chart"


async def test_admin_lists_drafts_and_deletes():
    p = await catalog.create_post(_post())
    assert [x.slug for x in await catalog.admin_list_posts()] == ["manglik-dosha"]
    assert (await catalog.admin_get_post(p.id)).body.startswith("word")
    await catalog.delete_post(p.id)
    with _pytest.raises(HTTPException):
        await catalog.admin_get_post(p.id)
    with _pytest.raises(HTTPException):
        await catalog.admin_get_post("not-an-id")
