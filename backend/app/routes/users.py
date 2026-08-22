from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.user import UserProfileResponse, UpdateProfileRequest
from app.schemas.screening import UserSummaryResponse
from app.services.user_service import get_user_profile, update_user_profile
from app.services.history_service import get_user_summary

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get profile of the currently authenticated user",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the user profile (id, name, mobile_number, age, sex, created_at).
    Requires a valid JWT Bearer token.
    """
    return get_user_profile(current_user)


@router.put(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update profile for the currently authenticated user",
)
def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates mutable profile fields (name, age, sex).
    Mobile number cannot be modified through this endpoint.
    """
    return update_user_profile(db, current_user, payload)


@router.get(
    "/me/summary",
    response_model=UserSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user anaemia screening metrics and Hb summary",
)
def get_my_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculates analytical patient metrics and Hb trajectory across all checkups.
    """
    return get_user_summary(db, current_user)
