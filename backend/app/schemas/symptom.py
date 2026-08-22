from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator
from app.database.models import SymptomEnum

SYMPTOM_ALIASES = {
    "cold_hands": SymptomEnum.COLD_HANDS_FEET,
    "cold_feet": SymptomEnum.COLD_HANDS_FEET,
    "cold_hands_feet": SymptomEnum.COLD_HANDS_FEET,
    "fatigue_weakness": SymptomEnum.FATIGUE,
    "shortness_breath": SymptomEnum.SHORTNESS_OF_BREATH,
    "rapid_heartbeat": SymptomEnum.RAPID_OR_IRREGULAR_HEARTBEAT,
    "irregular_heartbeat": SymptomEnum.RAPID_OR_IRREGULAR_HEARTBEAT,
}


class SymptomInput(BaseModel):
    symptom_name: SymptomEnum = Field(..., description="Standard symptom identifier")
    custom_symptom: Optional[str] = Field(None, max_length=255, description="Custom details if symptom is 'other'")

    @field_validator("symptom_name", mode="before")
    @classmethod
    def normalize_symptom(cls, v: Any) -> Any:
        if isinstance(v, str):
            clean = v.strip().lower().replace(" ", "_").replace("-", "_")
            if clean in SYMPTOM_ALIASES:
                return SYMPTOM_ALIASES[clean]
            for member in SymptomEnum:
                if member.value == clean or member.name.lower() == clean:
                    return member
        return v


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
