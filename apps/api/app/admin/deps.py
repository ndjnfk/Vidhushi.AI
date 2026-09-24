from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.models.models import User

_bearer = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User:
    """Requires an admin-scoped token (from /admin/auth/login) of a user who is
    still an admin. Customer-site tokens are rejected even for admin users."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_access_token(credentials.credentials, scope="admin")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
    user = await User.get(user_id)
    if user is None or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
