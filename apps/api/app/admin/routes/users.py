"""Admin: customer accounts — find by email, set a new password, or set a new
security question/answer (for clients who forgot both)."""
import re

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.security import hash_password
from app.core.security_questions import hash_answer
from app.models.models import User
from app.schemas.schemas import AdminSetPasswordIn, AdminSetSecurityIn, AdminUserOut

router = APIRouter(prefix="/admin/users", tags=["admin"], dependencies=[Depends(get_current_admin)])


def user_out(u: User) -> AdminUserOut:
    return AdminUserOut(id=str(u.id), email=u.email, is_admin=u.is_admin, created_at=u.created_at,
                        security_question=u.security_question if u.security_answer_hash else "")


async def _user(user_id: str) -> User:
    try:
        u = await User.get(PydanticObjectId(user_id))
    except Exception:
        u = None
    if u is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return u


@router.get("", response_model=list[AdminUserOut])
async def list_users(q: str = ""):
    """Newest first; `q` filters by part of the email."""
    query = {"email": {"$regex": re.escape(q.strip()), "$options": "i"}} if q.strip() else {}
    return [user_out(u) for u in await User.find(query).sort("-created_at").limit(100).to_list()]


@router.put("/{user_id}/password", response_model=AdminUserOut)
async def set_password(user_id: str, payload: AdminSetPasswordIn):
    u = await _user(user_id)
    u.hashed_password = hash_password(payload.new_password)
    u.reset_failures, u.reset_locked_until = 0, None
    await u.save()
    return user_out(u)


@router.put("/{user_id}/security", response_model=AdminUserOut)
async def set_security(user_id: str, payload: AdminSetSecurityIn):
    u = await _user(user_id)
    u.security_question = payload.security_question
    u.security_answer_hash = hash_answer(payload.security_answer)
    u.reset_failures, u.reset_locked_until = 0, None
    await u.save()
    return user_out(u)
