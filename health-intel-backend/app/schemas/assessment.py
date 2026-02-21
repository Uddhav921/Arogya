from pydantic import BaseModel
from typing import Any


class AssessmentRequest(BaseModel):
    user_id: int
    symptoms: list[str]


class AssessmentResponse(BaseModel):
    triage: str                   # LOW / MEDIUM / HIGH
    top_conditions: list[str]     # ranked from inference engine
    aqi_level: int | None = None  # AQI at patient's location if available
    explanation: dict[str, Any]   # structured JSON from z.ai
    # explanation keys: explanation, risk_summary, preventive_guidance,
    #                   follow_up_questions, safety_note
