"""GET /live — Server-Sent Events carrying the revision counters a page
cares about: the public ones, plus the signed-in user's bookings/orders.
Each message is the full map, e.g. {"site": 3, "home": 1, "products": 7, "me": 2}."""
import asyncio
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.deps import get_current_user_optional
from app.core.live import HOME, PRODUCTS, SITE, current_revs, user_topic
from app.models.models import User

router = APIRouter(tags=["live"])

CHECK_SECONDS = 1.5
PING_SECONDS = 20


@router.get("/live")
async def live(request: Request, user: User | None = Depends(get_current_user_optional)):
    names = {SITE: SITE, HOME: HOME, PRODUCTS: PRODUCTS}
    if user is not None:
        names[user_topic(user.id)] = "me"

    async def stream():
        last: dict | None = None
        quiet = 0.0
        while not await request.is_disconnected():
            revs = await current_revs(list(names))
            now = {names[k]: v for k, v in revs.items()}
            if now != last:
                last, quiet = now, 0.0
                yield f"data: {json.dumps(now)}\n\n"
            elif quiet >= PING_SECONDS:
                quiet = 0.0
                yield ": ping\n\n"  # keeps proxies from closing an idle stream
            await asyncio.sleep(CHECK_SECONDS)
            quiet += CHECK_SECONDS

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
