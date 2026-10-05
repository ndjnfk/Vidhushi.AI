import math
import re

from fastapi import APIRouter, HTTPException, Query

from app.models.models import BlogPost
from app.schemas.schemas import BlogPageOut, BlogPostAdminOut, BlogPostOut, BlogPostSummaryOut

router = APIRouter(prefix="/blog", tags=["blog"])

WORDS_PER_MINUTE = 200


def reading_minutes(body: str) -> int:
    words = len(re.sub(r"[#*_>`\[\]()!-]", " ", body).split())
    return max(1, math.ceil(words / WORDS_PER_MINUTE))


def _summary(p: BlogPost) -> BlogPostSummaryOut:
    return BlogPostSummaryOut(
        id=str(p.id), title=p.title, slug=p.slug, excerpt=p.excerpt,
        tags=p.tags, author_name=p.author_name, created_at=p.created_at, updated_at=p.updated_at,
        published_at=p.published_at, cover_image_url=p.cover_image_url, cover_image_alt=p.cover_image_alt,
        reading_minutes=reading_minutes(p.body),
    )


def full_out(p: BlogPost) -> BlogPostOut:
    return BlogPostOut(**_summary(p).model_dump(), body=p.body, seo_title=p.seo_title, meta_description=p.meta_description)


def admin_out(p: BlogPost) -> BlogPostAdminOut:
    return BlogPostAdminOut(**full_out(p).model_dump(), published=p.published)


# Newest first by publish date; older posts saved before published_at existed
# fall back to their creation date.
_NEWEST = [("published_at", -1), ("created_at", -1)]


@router.get("", response_model=list[BlogPostSummaryOut])
async def list_posts(tag: str | None = None, limit: int = 100):
    query: dict = {"published": True}
    if tag:
        query["tags"] = tag.strip().lower()
    posts = await BlogPost.find(query).sort(_NEWEST).limit(min(max(limit, 1), 100)).to_list()
    return [_summary(p) for p in posts]


@router.get("/_page", response_model=BlogPageOut)
async def list_page(tag: str | None = None, skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=50)):
    """One page of the blog list (the /blog page), plus the total and all topics.
    ("_page" can never be a post's slug, so it doesn't shadow /blog/{slug}.)"""
    query: dict = {"published": True}
    if tag:
        query["tags"] = tag.strip().lower()
    posts = await BlogPost.find(query).sort(_NEWEST).skip(skip).limit(limit).to_list()
    total = await BlogPost.find(query).count()
    tags = await BlogPost.get_motor_collection().distinct("tags", {"published": True})
    return BlogPageOut(items=[_summary(p) for p in posts], total=total, tags=sorted(tags))


@router.get("/{slug}", response_model=BlogPostOut)
async def get_post(slug: str):
    post = await BlogPost.find_one({"slug": slug, "published": True})
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return full_out(post)
