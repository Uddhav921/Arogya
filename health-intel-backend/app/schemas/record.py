from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RecordCreate(BaseModel):
    record_type: str  # diagnosis, lab_result, allergy, report, vaccination, surgery
    title: Optional[str] = None   # e.g. "Blood Test Report - Jan 2025"
    summary: str


class RecordOut(BaseModel):
    id: int
    patient_id: int
    record_type: str
    title: Optional[str]
    summary: str
    created_at: datetime

    model_config = {"from_attributes": True}
