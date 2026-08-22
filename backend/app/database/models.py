import enum
from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import (
    Integer,
    String,
    Boolean,
    Float,
    Date,
    Time,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SexEnum(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class ScreeningStatusEnum(str, enum.Enum):
    LIKELY_NORMAL = "likely_normal"
    POSSIBLE_ANEMIA = "possible_anemia"
    HIGH_RISK = "high_risk"
    LOW_CONFIDENCE = "low_confidence"
    IMAGE_QUALITY_FAILED = "image_quality_failed"


class ImageQualityEnum(str, enum.Enum):
    GOOD = "good"
    POOR = "poor"
    FAILED = "failed"


class SymptomEnum(str, enum.Enum):
    FATIGUE = "fatigue"
    DIZZINESS = "dizziness"
    SHORTNESS_OF_BREATH = "shortness_of_breath"
    RAPID_OR_IRREGULAR_HEARTBEAT = "rapid_or_irregular_heartbeat"
    HEADACHE = "headache"
    PALE_SKIN = "pale_skin"
    COLD_HANDS_FEET = "cold_hands_feet"
    BRITTLE_NAILS = "brittle_nails"
    POOR_APPETITE = "poor_appetite"
    NONE = "none"
    OTHER = "other"


class User(Base):
    """
    User Table
    Stores user account information and mobile authentication state.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    mobile_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    is_mobile_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    # One User -> One Profile
    profile: Mapped[Optional["Profile"]] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    # One User -> Many Screenings
    screenings: Mapped[List["Screening"]] = relationship(
        "Screening",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, mobile_number='{self.mobile_number}', is_active={self.is_active})>"


class Profile(Base):
    """
    Profile Table
    Stores demographic and personal profile information for a user.
    Relationship: One user -> One profile (user_id is a unique foreign key).
    """
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile(id={self.id}, user_id={self.user_id}, name='{self.name}', sex='{self.sex}')>"


class Screening(Base):
    """
    Screening Table
    Stores non-invasive anaemia checkup records, predicted Hb, status, and image metadata.
    Relationship: One user -> Many screenings.
    """
    __tablename__ = "screenings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    checkup_date: Mapped[date] = mapped_column(Date, server_default=func.current_date(), nullable=False)
    checkup_time: Mapped[time] = mapped_column(Time, server_default=func.current_time(), nullable=False)
    estimated_hb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    left_eye_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    right_eye_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    left_thumb_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    right_thumb_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_quality: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="screenings")
    # One Screening -> Many Symptoms
    symptoms: Mapped[List["ScreeningSymptom"]] = relationship(
        "ScreeningSymptom",
        back_populates="screening",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Screening(id={self.id}, user_id={self.user_id}, status='{self.status}', estimated_hb={self.estimated_hb})>"


class ScreeningSymptom(Base):
    """
    Screening Symptoms Table
    Stores user-reported symptoms associated with a screening.
    Relationship: One screening -> Many symptoms.
    
    IMPORTANT NOTE:
    Symptoms are only user-reported information. Do not use symptoms as a diagnosis.
    """
    __tablename__ = "screening_symptoms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    screening_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("screenings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symptom_name: Mapped[str] = mapped_column(String(100), nullable=False)
    custom_symptom: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    screening: Mapped["Screening"] = relationship("Screening", back_populates="symptoms")

    def __repr__(self) -> str:
        return f"<ScreeningSymptom(id={self.id}, screening_id={self.screening_id}, symptom_name='{self.symptom_name}')>"
