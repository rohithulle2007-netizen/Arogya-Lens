from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User
from app.core.security import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    TokenResponse,
    AuthMeResponse,
    UserBriefResponse,
    ProfileBriefResponse,
)
from app.services.auth_service import register_user, send_otp, verify_otp

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Registers a new user and creates their profile.
    Checks for duplicate mobile numbers and validates demographic constraints.
    """
    return register_user(db, payload)


@router.post(
    "/send-otp",
    response_model=SendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP to registered mobile number",
)
def send_otp_endpoint(
    payload: SendOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Sends a mock OTP (123456 in dev mode) for the given mobile number.
    """
    return send_otp(db, payload.mobile_number)


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify OTP and issue JWT access token",
)
def verify_otp_endpoint(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Verifies the provided OTP, marks the mobile number as verified,
    and returns a JWT bearer access token along with user and profile data.
    """
    return verify_otp(db, payload.mobile_number, payload.otp)


@router.get(
    "/me",
    response_model=AuthMeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user identity and state",
)
def get_auth_me(
    current_user: User = Depends(get_current_user),
):
    """
    Protected route returning identity details for the authenticated user.
    Requires a valid JWT Bearer token.
    """
    return AuthMeResponse(
        id=current_user.id,
        mobile_number=current_user.mobile_number,
        is_mobile_verified=current_user.is_mobile_verified,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        profile=ProfileBriefResponse.model_validate(current_user.profile) if current_user.profile else None,
    )
