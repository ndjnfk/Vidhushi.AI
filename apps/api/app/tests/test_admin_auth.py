import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.admin.deps import get_current_admin
from app.admin.routes.auth import admin_login
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password
from app.models.models import User
from app.schemas.schemas import UserLogin


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


async def _make(email: str, is_admin: bool) -> User:
    u = User(email=email, hashed_password=hash_password("Secret123"), is_admin=is_admin)
    await u.insert()
    return u


async def test_admin_login_issues_admin_token_only_for_admins():
    admin = await _make("boss@example.com", True)
    await _make("cust@example.com", False)

    tok = await admin_login(UserLogin(email="boss@example.com", password="Secret123"))
    assert (await get_current_admin(_bearer(tok.access_token))).id == admin.id

    for email, pw in [("cust@example.com", "Secret123"), ("boss@example.com", "wrong")]:
        with pytest.raises(HTTPException) as e:
            await admin_login(UserLogin(email=email, password=pw))
        assert e.value.status_code == 401


async def test_tokens_are_scoped():
    admin = await _make("boss@example.com", True)
    customer_token = create_access_token(str(admin.id))  # site login, even for an admin
    admin_token = create_access_token(str(admin.id), scope="admin")

    with pytest.raises(HTTPException) as e:
        await get_current_admin(_bearer(customer_token))
    assert e.value.status_code == 401
    with pytest.raises(HTTPException):
        await get_current_user(_bearer(admin_token))
    assert (await get_current_user(_bearer(customer_token))).id == admin.id


async def test_demoted_admin_token_stops_working():
    admin = await _make("boss@example.com", True)
    token = create_access_token(str(admin.id), scope="admin")
    admin.is_admin = False
    await admin.save()
    with pytest.raises(HTTPException) as e:
        await get_current_admin(_bearer(token))
    assert e.value.status_code == 403
