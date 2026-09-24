from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.security import create_access_token, verify_password
from app.models.models import User
from app.schemas.schemas import MeOut, TokenOut, UserLogin

router = APIRouter(prefix="/admin/auth", tags=["admin"])


@router.post("/login", response_model=TokenOut)
async def admin_login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    # Same message for "wrong password" and "not an admin" so the endpoint
    # doesn't reveal which accounts are admins.
    if user is None or not user.is_admin or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return TokenOut(access_token=create_access_token(str(user.id), scope="admin"))


@router.get("/me", response_model=MeOut)
async def admin_me(user: User = Depends(get_current_admin)):
    return MeOut(id=str(user.id), email=user.email, is_admin=True)
