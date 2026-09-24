import json
from datetime import datetime, timedelta, timezone

from app.admin.routes import bookings as admin_bookings
from app.admin.routes import site as admin_site
from app.api.routes import bookings, live
from app.core.live import bump, current_revs, user_topic
from app.models.models import User
from app.schemas.schemas import ConsultationApproveIn, ConsultationRequestIn, SiteSettingsIn


class _Request:
    """Stands in for a browser that reads one batch and then disconnects."""

    def __init__(self, reads: int = 1):
        self.reads = reads

    async def is_disconnected(self) -> bool:
        self.reads -= 1
        return self.reads < 0


async def _read(user=None, reads=1) -> list[str]:
    resp = await live.live(_Request(reads), user=user)
    return [chunk async for chunk in resp.body_iterator]


async def test_bump_counts_per_topic():
    assert await current_revs(["site", "home"]) == {"site": 0, "home": 0}
    await bump("site")
    await bump("site", "home")
    assert await current_revs(["site", "home"]) == {"site": 2, "home": 1}


async def test_admin_edits_bump_public_and_user_topics():
    await admin_site.update_site(SiteSettingsIn(phone="+91 98765 43210", show_email=False, show_address=False, show_hours=False))
    assert (await current_revs(["site"]))["site"] == 1

    client = User(email="client@example.com", hashed_password="x")
    await client.insert()
    req = await bookings.create_request(ConsultationRequestIn(
        name="Asha", email="asha@example.com", phone="9876543210", place="Delhi", topic="career"), user=client)
    await admin_bookings.approve(req.id, ConsultationApproveIn(
        scheduled_at=datetime.now(timezone.utc) + timedelta(hours=1), duration_minutes=30, amount=501))
    assert (await current_revs([user_topic(client.id)]))[user_topic(client.id)] == 1


async def test_stream_sends_public_revs_and_own_topic_only():
    await bump("products")
    anon = await _read()
    assert json.loads(anon[0].removeprefix("data: ")) == {"site": 0, "home": 0, "products": 1}

    user = User(email="u@example.com", hashed_password="x")
    await user.insert()
    await bump(user_topic(user.id), user_topic("someone-else"))
    mine = await _read(user)
    assert json.loads(mine[0].removeprefix("data: "))["me"] == 1
