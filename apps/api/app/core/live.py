"""Live updates: every admin change bumps a revision counter for its topic,
and GET /live streams the counters so open pages refetch straight away."""
import logging

from app.models.models import Revision

log = logging.getLogger(__name__)

SITE, HOME, PRODUCTS = "site", "home", "products"


def user_topic(user_id: object) -> str:
    return f"user:{user_id}"


async def bump(*keys: str) -> None:
    """Never fails the admin request: a missed bump only delays the refresh."""
    try:
        coll = Revision.get_motor_collection()
        for key in keys:
            await coll.update_one({"key": key}, {"$inc": {"rev": 1}}, upsert=True)
    except Exception:
        log.exception("live bump failed for %s", keys)


async def current_revs(keys: list[str]) -> dict[str, int]:
    found = {r["key"]: r["rev"] async for r in Revision.get_motor_collection().find({"key": {"$in": keys}})}
    return {k: found.get(k, 0) for k in keys}
