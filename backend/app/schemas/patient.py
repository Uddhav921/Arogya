from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    known_conditions: list[str] = []


class PatientOut(BaseModel):
    id: int
    name: str
    age: int
    sex: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    known_conditions: list[str]

    model_config = {"from_attributes": True}
