from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.symptom import BilingualSymptomItem


class ScreeningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    checkup_date: date
    checkup_time: time
    estimated_hb: Optional[float] = None
    confidence: Optional[float] = None
    status: str
    image_path: Optional[str] = None
    image_quality: str
    created_at: datetime


class ScreeningDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    checkup_date: date
    checkup_time: time
    estimated_hb: Optional[float] = None
    confidence: Optional[float] = None
    status: str
    image_path: Optional[str] = None
    image_quality: str
    created_at: datetime
    symptoms: List[BilingualSymptomItem] = []


class HistoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    screening_id: int
    date: date
    time: time
    estimated_hb: Optional[float] = None
    confidence: Optional[float] = None
    status: str
    image_quality: str
    created_at: Optional[datetime] = None
    symptoms: List[BilingualSymptomItem] = []


class UserSummaryResponse(BaseModel):
    total_screenings: int
    first_screening_date: Optional[date] = None
    latest_screening_date: Optional[date] = None
    latest_estimated_hb: Optional[float] = None
    previous_estimated_hb: Optional[float] = None
    average_estimated_hb: Optional[float] = None
    minimum_estimated_hb: Optional[float] = None
    maximum_estimated_hb: Optional[float] = None
    change_from_previous: Optional[float] = None
    latest_confidence: Optional[float] = None
    latest_status: Optional[str] = None
