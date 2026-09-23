from fastapi import APIRouter, HTTPException

from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.schemas.schemas import TokenOut, UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
async def register(payload: UserCreate):
    existing = await User.find_one(User.email == payload.email)
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Bootstrap: the very first account on a fresh install becomes admin, so
    # there's always a way into /admin/* without touching the database by hand.
    is_first_user = await User.find_all().count() == 0

    user = User(email=payload.email, hashed_password=hash_password(payload.password), is_admin=is_first_user)
    await user.insert()

    return TokenOut(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenOut(access_token=create_access_token(str(user.id)))
