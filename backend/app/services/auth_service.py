import os
import secrets
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
from app.services.sms_service import is_sms_configured, send_sms_otp

# In-memory OTP storage
# Key: mobile_number, Value: dict(otp, expires_at, last_sent_at, attempts, delivery_mode)
_otp_cache: Dict[str, Dict[str, Any]] = {}
DEV_MOCK_OTP = "123456"


def clear_otp_cache():
    """Clears the in-memory OTP cache. Used primarily for test teardown."""
    _otp_cache.clear()


def _generate_and_dispatch_otp(mobile_number: str, is_resend: bool = False) -> tuple[str, str, Optional[str]]:
    """
    Generates OTP and dispatches it via real SMS provider if configured,
    or prepares development mock code.
    Enforces cooldown only on consecutive resend requests.
    Returns: (otp_code, delivery_mode, dev_otp_for_response)
    """
    now = datetime.now(timezone.utc)

    # Check cooldown / rate-limit for resend requests
    if is_resend and mobile_number in _otp_cache:
        last_sent_at = _otp_cache[mobile_number].get("last_send_otp_at")
        if last_sent_at:
            elapsed = (now - last_sent_at).total_seconds()
            if elapsed < settings.OTP_COOLDOWN_SECONDS:
                remaining = max(1, int(settings.OTP_COOLDOWN_SECONDS - elapsed))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining} seconds before requesting a new OTP.",
                )

    if is_sms_configured():
        # Cryptographically secure 6-digit random code
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        success, err_msg = send_sms_otp(mobile_number, otp_code)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=err_msg or "Failed to deliver SMS. Please try again later.",
            )
        delivery_mode = "sms"
        dev_otp = None
    else:
        # Development / Demo Mode Handling
        is_demo_active = bool(settings.DEMO_OTP_ENABLED or settings.ALLOW_MOCK_OTP)
        if settings.ENVIRONMENT == "production" and not is_demo_active:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SMS gateway service is not configured on this production instance and Demo OTP mode is disabled. To enable demonstration logins, configure DEMO_OTP_ENABLED=true in environment settings.",
            )

        otp_code = DEV_MOCK_OTP
        delivery_mode = "mock"
        dev_otp = DEV_MOCK_OTP

    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    _otp_cache[mobile_number] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "last_send_otp_at": now if is_resend else _otp_cache.get(mobile_number, {}).get("last_send_otp_at"),
        "attempts": 0,
        "delivery_mode": delivery_mode,
    }

    return otp_code, delivery_mode, dev_otp


def register_user(db: Session, data: RegisterRequest) -> Dict[str, Any]:
    """
    Registers a new user and creates their demographic profile.
    Generates verification OTP and rejects duplicates.
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

    otp_code, delivery_mode, dev_otp = _generate_and_dispatch_otp(data.mobile_number)

    return {
        "message": "User registered successfully",
        "otp": dev_otp,
        "delivery_mode": delivery_mode,
        "dev_otp": dev_otp,
        "cooldown_seconds": settings.OTP_COOLDOWN_SECONDS,
        "user": UserBriefResponse.model_validate(user),
        "profile": ProfileBriefResponse.model_validate(user.profile),
    }


def send_otp(db: Session, mobile_number: str) -> SendOTPResponse:
    """
    Generates and stores an OTP for an existing registered user.
    Enforces cooldown and dispatch security.
    """
    user = db.query(User).filter(User.mobile_number == mobile_number).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number not registered. Please register first.",
        )

    otp_code, delivery_mode, dev_otp = _generate_and_dispatch_otp(mobile_number, is_resend=True)

    return SendOTPResponse(
        message="OTP sent successfully",
        mobile_number=mobile_number,
        delivery_mode=delivery_mode,
        dev_otp=dev_otp,
        cooldown_seconds=settings.OTP_COOLDOWN_SECONDS,
    )


def verify_otp(db: Session, mobile_number: str, otp: str) -> TokenResponse:
    """
    Verifies the provided OTP against the active cached entry.
    Enforces expiration, maximum attempt limits, and marks mobile verified.
    """
    user = db.query(User).filter(User.mobile_number == mobile_number).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number not registered",
        )

    cached_entry = _otp_cache.get(mobile_number)
    now = datetime.now(timezone.utc)

    if not cached_entry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Please request a new code.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration
    if now > cached_entry["expires_at"]:
        del _otp_cache[mobile_number]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Code has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check attempt limit
    if cached_entry.get("attempts", 0) >= settings.OTP_MAX_ATTEMPTS:
        del _otp_cache[mobile_number]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Maximum verification attempts exceeded. Please request a new OTP.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate OTP value
    if str(otp).strip() != str(cached_entry["otp"]).strip():
        cached_entry["attempts"] = cached_entry.get("attempts", 0) + 1
        remaining_attempts = settings.OTP_MAX_ATTEMPTS - cached_entry["attempts"]
        if remaining_attempts <= 0:
            del _otp_cache[mobile_number]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Maximum verification attempts exceeded. Please request a new OTP.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired OTP. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Valid OTP verified: remove from cache
    del _otp_cache[mobile_number]

    # Mark mobile as verified in database
    user.is_mobile_verified = True
    db.commit()
    db.refresh(user)

    # Generate JWT bearer access token
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserBriefResponse.model_validate(user),
        profile=ProfileBriefResponse.model_validate(user.profile) if user.profile else None,
    )
