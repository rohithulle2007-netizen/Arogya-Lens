from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token
from app.database.models import User, Profile
from app.schemas.auth import (
    RegisterRequest,
    SendOTPResponse,
    TokenResponse,
    UserBriefResponse,
    ProfileBriefResponse,
)

# In-memory OTP storage for mock/development environment
# Key: mobile_number, Value: dict(otp, expires_at)
_otp_cache: Dict[str, Dict[str, Any]] = {}
DEV_MOCK_OTP = "123456"


def register_user(db: Session, data: RegisterRequest) -> Dict[str, Any]:
    """
    Registers a new user and creates their profile.
    Rejects duplicate mobile numbers with 400 Bad Request.
    """
    existing_user = db.query(User).filter(User.mobile_number == data.mobile_number).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered",
        )

    # Create new User
    user = User(
        mobile_number=data.mobile_number,
        is_mobile_verified=False,
        is_active=True,
    )
    db.add(user)
    db.flush()

    # Create associated Profile
    profile = Profile(
        user_id=user.id,
        name=data.name,
        age=data.age,
        sex=data.sex.value if hasattr(data.sex, "value") else str(data.sex),
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    _otp_cache[data.mobile_number] = {
        "otp": DEV_MOCK_OTP,
        "expires_at": expires_at,
    }

    return {
        "message": "User registered successfully",
        "otp": DEV_MOCK_OTP,
        "user": UserBriefResponse.model_validate(user),
        "profile": ProfileBriefResponse.model_validate(user.profile),
    }


def send_otp(db: Session, mobile_number: str) -> SendOTPResponse:
    """
    Generates and stores a mock OTP for the provided mobile number.
    Verifies user existence before dispatching.
    """
    user = db.query(User).filter(User.mobile_number == mobile_number).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number not registered. Please register first.",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    _otp_cache[mobile_number] = {
        "otp": DEV_MOCK_OTP,
        "expires_at": expires_at,
    }

    return SendOTPResponse(
        message="OTP sent successfully",
        mobile_number=mobile_number,
    )


def verify_otp(db: Session, mobile_number: str, otp: str) -> TokenResponse:
    """
    Verifies the provided OTP against mock / cached OTP.
    On success: marks mobile as verified, generates JWT, and returns auth response.
    """
    user = db.query(User).filter(User.mobile_number == mobile_number).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number not registered",
        )

    cached_entry = _otp_cache.get(mobile_number)
    now = datetime.now(timezone.utc)

    # Valid if matches mock OTP 123456 or unexpired cached OTP
    is_valid = False
    if str(otp).strip() == DEV_MOCK_OTP:
        is_valid = True
    elif cached_entry and str(cached_entry["otp"]).strip() == str(otp).strip():
        if now <= cached_entry["expires_at"]:
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Clear OTP from cache
    if mobile_number in _otp_cache:
        del _otp_cache[mobile_number]

    # Mark mobile as verified
    user.is_mobile_verified = True
    db.commit()
    db.refresh(user)

    # Generate JWT
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserBriefResponse.model_validate(user),
        profile=ProfileBriefResponse.model_validate(user.profile) if user.profile else None,
    )
