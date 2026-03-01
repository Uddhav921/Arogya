from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProfileCreate(BaseModel):
    location: Optional[str] = None
    family_history: list[str] = []
    eating_habits: Optional[str] = None
    lifestyle: Optional[str] = None                # e.g. "sedentary", "active"
    exercise_frequency: Optional[str] = None       # e.g. "rarely", "3x/week"
    sleep_hours: Optional[float] = None
    stress_level: Optional[str] = None             # LOW / MEDIUM / HIGH
    alcohol_use: Optional[str] = None              # none / occasional / regular
    smoking_status: Optional[str] = None           # never / former / current
    notes: Optional[str] = None


class ProfileOut(BaseModel):
    id: int
    patient_id: int
    location: Optional[str]
    family_history: list[str]
    eating_habits: Optional[str]
    lifestyle: Optional[str]
    exercise_frequency: Optional[str]
    sleep_hours: Optional[float]
    stress_level: Optional[str]
    alcohol_use: Optional[str]
    smoking_status: Optional[str]
    notes: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}
