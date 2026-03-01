from datetime import datetime
from pydantic import BaseModel


class PatientCreate(BaseModel):
    age: int
    sex: str
    known_conditions: list[str] = []


class PatientOut(BaseModel):
    id: int
    age: int
    sex: str
    known_conditions: list[str]

    model_config = {"from_attributes": True}
