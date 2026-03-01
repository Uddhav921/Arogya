from pydantic import BaseModel
from typing import Any, Optional


class AssessmentRequest(BaseModel):
    user_id: int
    symptoms: list[str] = []
    free_text: str = ""        # Free-text symptom input (e.g. "I have headache and chest pain")


class RiskFactor(BaseModel):
    feature: str
    value: float
    impact: float
    direction: str             # "increases" or "decreases"


class DiseaseRisk(BaseModel):
    probability: float
    risk_level: str            # LOW / MEDIUM / HIGH
    top_factors: list[RiskFactor] = []


class HealthStatus(BaseModel):
    """Composite health status based on all available data."""
    overall_risk: str          # LOW / MODERATE / HIGH / CRITICAL
    risk_scores: dict[str, DiseaseRisk] = {}   # ML risk per disease
    vitals_summary: dict[str, str] = {}        # "heart_rate": "Normal (72 bpm)"
    recommendations: list[str] = []


class AssessmentResponse(BaseModel):
    triage: str                   # LOW / MEDIUM / HIGH
    top_conditions: list[str]     # ranked from inference engine
    aqi_level: int | None = None
    explanation: dict[str, Any]   # from z.ai
    health_status: Optional[HealthStatus] = None   # ML-based health status
    normalized_symptoms: list[str] = []             # What the system understood
