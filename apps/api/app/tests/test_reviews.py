from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

import app.api.routes.reviews as reviews_mod
from app.admin.routes import bookings as admin_bookings
from app.admin.routes import reviews as admin_reviews
from app.api.routes import bookings, reviews
from app.models.models import ConsultationRequest, OrderStatusEvent, ShippingAddress, ShopOrder, ShopOrderItem, User
from app.schemas.schemas import ConsultationApproveIn, ReviewHiddenIn, ReviewIn


@pytest.fixture(autouse=True)
def _quiet(monkeypatch):
    async def nothing(*a, **k):
        return None

    monkeypatch.setattr(reviews_mod, "notify_admins", nothing)


async def _user(email="asha@example.com"):
    u = User(email=email, hashed_password="x")
    await u.insert()
    return u


async def _booking(user, status="completed", kind="consultation", session_name="15-Minute Call Session"):
    b = ConsultationRequest(user_id=str(user.id), name="asha verma", email=user.email, phone="9876543210",
                            place="Delhi", topic="other", status=status, kind=kind, session_name=session_name)
    await b.insert()
    return str(b.id)


async def _order(user, status="delivered"):
    o = ShopOrder(user_id=str(user.id), items=[ShopOrderItem(product_id="p1", product_name="Rudraksha Bracelet",
                                                               quantity=1, unit_price=899)],
                  shipping_address=ShippingAddress(full_name="Ravi Kumar", phone="9876543210", line1="x", city="y",
                                                   state="z", pincode="247001"),
                  total_amount=899, status=status, history=[OrderStatusEvent(status=status)])
    await o.insert()
    return str(o.id)


async def test_review_after_completion_shows_publicly():
    asha = await _user()
    bid = await _booking(asha)
    r = await reviews.create_review(ReviewIn(target="booking", target_id=bid, rating=5, text=" Very accurate! "), user=asha)
    assert (r.target_kind, r.rating, r.text, r.name, r.label) == ("consultation", 5, "Very accurate!", "Asha V.",
                                                                 "15-Minute Call Session")
    page = await reviews.list_reviews(skip=0, limit=10)
    assert page.total == 1 and page.average == 5.0 and page.items[0].id == r.id
    assert [m.target_id for m in await reviews.my_reviews(user=asha)] == [bid]

    with pytest.raises(HTTPException) as e:  # only once per booking
        await reviews.create_review(ReviewIn(target="booking", target_id=bid, rating=1, text="again"), user=asha)
    assert e.value.status_code == 409


async def test_ritual_and_order_reviews():
    asha = await _user()
    rid = await _booking(asha, kind="ritual")
    oid = await _order(asha)
    ritual = await reviews.create_review(ReviewIn(target="booking", target_id=rid, rating=4, text="Felt calm"), user=asha)
    order = await reviews.create_review(ReviewIn(target="order", target_id=oid, rating=3, text="Nice bracelet"), user=asha)
    assert (ritual.target_kind, ritual.label) == ("ritual", "Healing ritual")
    assert (order.target_kind, order.label, order.name) == ("order", "Rudraksha Bracelet", "Ravi K.")
    assert (await reviews.list_reviews(skip=0, limit=10)).average == 3.5


async def test_only_owner_and_only_when_finished():
    asha, other = await _user(), await _user("other@example.com")
    pending = await _booking(asha, status="confirmed")
    shipped = await _order(asha, status="shipped")
    done = await _booking(asha)
    for target, tid in (("booking", pending), ("order", shipped)):
        with pytest.raises(HTTPException) as e:
            await reviews.create_review(ReviewIn(target=target, target_id=tid, rating=5, text="Great!"), user=asha)
        assert e.value.status_code == 400
    with pytest.raises(HTTPException) as e:
        await reviews.create_review(ReviewIn(target="booking", target_id=done, rating=5, text="Great!"), user=other)
    assert e.value.status_code == 404
    with pytest.raises(ValueError):
        ReviewIn(target="booking", target_id=done, rating=6, text="Great!")


async def test_pagination_and_admin_hide():
    asha = await _user()
    ids = []
    for i in range(12):
        r = await reviews.create_review(
            ReviewIn(target="booking", target_id=await _booking(asha), rating=5 if i % 2 else 4, text=f"Review {i}"),
            user=asha)
        ids.append(r.id)
    first = await reviews.list_reviews(skip=0, limit=10)
    second = await reviews.list_reviews(skip=10, limit=10)
    assert first.total == 12 and len(first.items) == 10 and len(second.items) == 2
    assert first.items[0].text == "Review 11"  # newest first
    assert first.average == 4.5

    hidden = await admin_reviews.set_hidden(ids[0], ReviewHiddenIn(hidden=True))
    assert hidden.hidden
    after = await reviews.list_reviews(skip=0, limit=50)
    assert after.total == 11 and ids[0] not in [x.id for x in after.items]
    assert len(await admin_reviews.list_all()) == 12  # the admin still sees it


async def test_completed_via_admin_flow_can_be_reviewed(monkeypatch):
    async def no_mail(*a, **k):
        return None

    monkeypatch.setattr(admin_bookings, "send_email", no_mail)
    asha = await _user()
    bid = await _booking(asha, status="pending")
    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    await admin_bookings.approve(bid, ConsultationApproveIn(scheduled_at=start, duration_minutes=15, amount=999))
    await admin_bookings.payment_received(bid)
    await admin_bookings.complete(bid)
    r = await reviews.create_review(ReviewIn(target="booking", target_id=bid, rating=5, text="Thank you!"), user=asha)
    assert r.rating == 5
    assert (await bookings.get_request(bid, user=asha)).status == "completed"
