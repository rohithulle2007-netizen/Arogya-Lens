import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.database.models import SexEnum


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    mobile_number: str = Field(..., description="Mobile number (10-15 digits)")
    sex: SexEnum = Field(..., description="Sex of user (male, female, other, prefer_not_to_say)")
    age: int = Field(..., ge=1, le=120, description="Age in years (1 to 120)")

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
        if not cleaned.isdigit() or len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError("Mobile number must contain between 10 and 15 digits")
        return cleaned

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Name cannot be blank")
        return trimmed


class SendOTPRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile number to receive OTP")

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
        if not cleaned.isdigit() or len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError("Mobile number must contain between 10 and 15 digits")
        return cleaned


class SendOTPResponse(BaseModel):
    message: str
    mobile_number: str


class VerifyOTPRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile number")
    otp: str = Field(..., min_length=4, max_length=10, description="One-time password")

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
        if not cleaned.isdigit() or len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError("Mobile number must contain between 10 and 15 digits")
        return cleaned

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("OTP cannot be empty")
        return trimmed


class ProfileBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    age: int
    sex: str
    created_at: datetime
    updated_at: datetime


class UserBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mobile_number: str
    is_mobile_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBriefResponse
    profile: Optional[ProfileBriefResponse] = None


class AuthMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mobile_number: str
    is_mobile_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[ProfileBriefResponse] = None
