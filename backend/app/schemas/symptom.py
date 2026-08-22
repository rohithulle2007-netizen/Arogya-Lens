from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.database.models import SymptomEnum


class SymptomInput(BaseModel):
    symptom_name: SymptomEnum = Field(..., description="Standard symptom identifier")
    custom_symptom: Optional[str] = Field(None, max_length=255, description="Custom details if symptom is 'other'")


class AddSymptomsRequest(BaseModel):
    symptoms: List[SymptomInput] = Field(..., description="List of user-reported symptoms")

    @model_validator(mode="after")
    def validate_none_exclusivity(self) -> "AddSymptomsRequest":
        names = [s.symptom_name.value if hasattr(s.symptom_name, "value") else str(s.symptom_name) for s in self.symptoms]
        if SymptomEnum.NONE.value in names and len(names) > 1:
            raise ValueError("'none' cannot be combined with other symptoms")
        return self


class SymptomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    screening_id: int
    symptom_name: str
    custom_symptom: Optional[str] = None
    created_at: datetime


class BilingualSymptomItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    symptom_name: str
    custom_symptom: Optional[str] = None
    label_en: str
    label_hi: str
    created_at: datetime


class ScreeningSymptomsListResponse(BaseModel):
    screening_id: int
    symptoms: List[BilingualSymptomItem]
