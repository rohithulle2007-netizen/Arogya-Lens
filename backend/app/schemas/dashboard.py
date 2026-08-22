from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DashboardScreeningItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    screening_id: int
    date: date
    time: time
    estimated_hb: Optional[float] = None
    confidence: Optional[float] = None
    status: str


class DashboardResponse(BaseModel):
    total_screenings: int
    possible_anemia_count: int
    high_risk_count: int
    low_confidence_count: int
    average_estimated_hb: Optional[float] = None
    latest_screening: Optional[DashboardScreeningItem] = None
    recent_screenings: List[DashboardScreeningItem] = []


class TrendPointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    estimated_hb: float
