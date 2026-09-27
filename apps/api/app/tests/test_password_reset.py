from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.admin.routes import users as admin_users
from app.api.routes import auth
from app.core.security import verify_password
from app.models.models import User
from app.schemas.schemas import (
    AdminSetPasswordIn,
    AdminSetSecurityIn,
    ForgotQuestionIn,
    ForgotResetIn,
    UserCreate,
    UserLogin,
)

EMAIL = "asha@example.com"


async def _register():
    await auth.register(UserCreate(email=EMAIL, password="oldpass123", security_question="first_pet",
                                   security_answer="  Moti  "))
    return await User.find_one(User.email == EMAIL)


async def test_register_needs_a_security_question_and_hashes_the_answer():
    u = await _register()
    assert u.security_question == "first_pet" and u.security_answer_hash and "moti" not in u.security_answer_hash.lower()
    with pytest.raises(ValueError):
        UserCreate(email="x@example.com", password="password1")  # no question
    with pytest.raises(ValueError):
        UserCreate(email="x@example.com", password="password1", security_question="favourite_colour", security_answer="red")


async def test_forgot_password_with_the_right_answer():
    await _register()
    assert (await auth.forgot_question(ForgotQuestionIn(email=EMAIL))).security_question == "first_pet"
    # Case and extra spaces don't matter.
    token = await auth.forgot_reset(ForgotResetIn(email=EMAIL, security_answer="MOTI", new_password="newpass123"))
    assert token.access_token
    assert (await auth.login(UserLogin(email=EMAIL, password="newpass123"))).access_token
    with pytest.raises(HTTPException):
        await auth.login(UserLogin(email=EMAIL, password="oldpass123"))


async def test_wrong_answers_lock_resets():
    await _register()
    for _ in range(5):
        with pytest.raises(HTTPException) as e:
            await auth.forgot_reset(ForgotResetIn(email=EMAIL, security_answer="Tommy", new_password="newpass123"))
        assert e.value.detail == "wrong_answer"
    with pytest.raises(HTTPException) as e:  # locked now, even with the right answer
        await auth.forgot_reset(ForgotResetIn(email=EMAIL, security_answer="moti", new_password="newpass123"))
    assert e.value.status_code == 429
    u = await User.find_one(User.email == EMAIL)
    assert u.reset_locked_until and u.reset_locked_until > datetime.utcnow() + timedelta(minutes=14)


async def test_unknown_email_and_old_accounts():
    with pytest.raises(HTTPException) as e:
        await auth.forgot_question(ForgotQuestionIn(email="nobody@example.com"))
    assert e.value.status_code == 404
    await User(email="old@example.com", hashed_password="x").insert()  # made before security questions
    with pytest.raises(HTTPException) as e:
        await auth.forgot_question(ForgotQuestionIn(email="old@example.com"))
    assert e.value.detail == "no_security_question"


async def test_admin_resets_password_and_security_answer():
    u = await _register()
    for _ in range(5):  # client locked themselves out
        with pytest.raises(HTTPException):
            await auth.forgot_reset(ForgotResetIn(email=EMAIL, security_answer="no", new_password="newpass123"))

    found = await admin_users.list_users(q="ASHA")
    assert [x.email for x in found] == [EMAIL] and found[0].security_question == "first_pet"

    out = await admin_users.set_password(str(u.id), AdminSetPasswordIn(new_password="adminset123"))
    assert out.email == EMAIL
    assert (await auth.login(UserLogin(email=EMAIL, password="adminset123"))).access_token

    await admin_users.set_security(str(u.id), AdminSetSecurityIn(security_question="birth_city", security_answer="Saharanpur"))
    u = await User.find_one(User.email == EMAIL)
    assert u.reset_locked_until is None and u.security_question == "birth_city"
    token = await auth.forgot_reset(ForgotResetIn(email=EMAIL, security_answer="saharanpur", new_password="final12345"))
    assert token.access_token and verify_password("final12345", (await User.find_one(User.email == EMAIL)).hashed_password)

    with pytest.raises(HTTPException) as e:
        await admin_users.set_password("000000000000000000000000", AdminSetPasswordIn(new_password="whatever1"))
    assert e.value.status_code == 404
