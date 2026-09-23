from fastapi import APIRouter, HTTPException

from app.models.models import BlogPost
from app.schemas.schemas import BlogPostOut, BlogPostSummaryOut

router = APIRouter(prefix="/blog", tags=["blog"])


def _summary(p: BlogPost) -> BlogPostSummaryOut:
    return BlogPostSummaryOut(
        id=str(p.id), title=p.title, slug=p.slug, excerpt=p.excerpt,
        tags=p.tags, author_name=p.author_name, created_at=p.created_at,
    )


def _full(p: BlogPost) -> BlogPostOut:
    return BlogPostOut(**_summary(p).model_dump(), body=p.body, updated_at=p.updated_at)


@router.get("", response_model=list[BlogPostSummaryOut])
async def list_posts(tag: str | None = None):
    query: dict = {"published": True}
    if tag:
        query["tags"] = tag
    posts = await BlogPost.find(query).sort("-created_at").to_list()
    return [_summary(p) for p in posts]


@router.get("/{slug}", response_model=BlogPostOut)
async def get_post(slug: str):
    post = await BlogPost.find_one({"slug": slug, "published": True})
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return _full(post)
