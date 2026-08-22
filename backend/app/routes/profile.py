"""
Profile Route Alias (/api/profile) for seamless frontend integration.
Mirrors /api/users/me functionality.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.user import UserProfileResponse, UpdateProfileRequest
from app.services.user_service import get_user_profile, update_user_profile

router = APIRouter(prefix="/api/profile", tags=["Profile Alias"])


@router.get(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get profile of the currently authenticated user",
)
def get_my_profile_alias(
    current_user: User = Depends(get_current_user),
):
    """
    Returns user demographic profile.
    """
    return get_user_profile(current_user)


@router.put(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update profile for the currently authenticated user",
)
def update_my_profile_alias(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates user demographic profile.
    """
    return update_user_profile(db, current_user, payload)
