from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.database.models import SexEnum


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    mobile_number: str
    age: int
    sex: str
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated full name")
    age: Optional[int] = Field(None, ge=1, le=120, description="Updated age in years")
    sex: Optional[SexEnum] = Field(None, description="Updated sex")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Name cannot be blank")
            return trimmed
        return v
