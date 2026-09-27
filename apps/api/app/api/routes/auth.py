from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.security_questions import LOCK_MINUTES, MAX_FAILURES, answer_matches, hash_answer
from app.models.models import User
from app.schemas.schemas import (
    ForgotQuestionIn,
    ForgotQuestionOut,
    ForgotResetIn,
    MeOut,
    TokenOut,
    UserCreate,
    UserLogin,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
async def register(payload: UserCreate):
    existing = await User.find_one(User.email == payload.email)
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Bootstrap: the very first account on a fresh install becomes admin, so
    # there's always a way into /admin/* without touching the database by hand.
    is_first_user = await User.find_all().count() == 0

    user = User(email=payload.email, hashed_password=hash_password(payload.password), is_admin=is_first_user,
                security_question=payload.security_question, security_answer_hash=hash_answer(payload.security_answer))
    await user.insert()

    return TokenOut(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenOut(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=MeOut)
async def me(user: User = Depends(get_current_user)):
    return MeOut(id=str(user.id), email=user.email, is_admin=user.is_admin)


# ---------------------------------------------------------------- forgot password
# Email -> the account's security question -> right answer + new password.
# Too many wrong answers lock resets for a while; the admin can always reset.

async def _reset_account(email: str) -> User:
    user = await User.find_one(User.email == email)
    if user is None:
        raise HTTPException(status_code=404, detail="No account found with this email")
    if not user.security_question or not user.security_answer_hash:
        raise HTTPException(status_code=400, detail="no_security_question")
    return user


@router.post("/forgot/question", response_model=ForgotQuestionOut)
async def forgot_question(payload: ForgotQuestionIn):
    user = await _reset_account(payload.email)
    return ForgotQuestionOut(security_question=user.security_question)


@router.post("/forgot/reset", response_model=TokenOut)
async def forgot_reset(payload: ForgotResetIn):
    user = await _reset_account(payload.email)
    now = datetime.utcnow()
    if user.reset_locked_until and user.reset_locked_until > now:
        raise HTTPException(status_code=429, detail="too_many_attempts")
    if not answer_matches(payload.security_answer, user.security_answer_hash):
        user.reset_failures += 1
        if user.reset_failures >= MAX_FAILURES:
            user.reset_failures = 0
            user.reset_locked_until = now + timedelta(minutes=LOCK_MINUTES)
        await user.save()
        raise HTTPException(status_code=400, detail="wrong_answer")
    user.hashed_password = hash_password(payload.new_password)
    user.reset_failures = 0
    user.reset_locked_until = None
    await user.save()
    return TokenOut(access_token=create_access_token(str(user.id)))
