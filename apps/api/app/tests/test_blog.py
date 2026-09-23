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
