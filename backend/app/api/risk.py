"""
app/api/risk.py — ML-based disease risk prediction API.

Combines the existing weight-based inference with XGBoost ML models.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Patient, HealthSnapshot
from app.ml.predictor import predict_risks, models_available

router = APIRouter(prefix="/risk", tags=["risk-prediction"])


class RiskRequest(BaseModel):
    patient_id: int
    symptoms: list[str] = []


@router.post("")
def predict_risk(payload: RiskRequest, db: Session = Depends(get_db)):
    """
    Run ML risk prediction for a patient.

    Uses XGBoost models trained on clinical features to predict
    probability of diabetes, hypertension, and heart disease.
    Returns probabilities, risk levels, and SHAP-based explanations.
    """
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {payload.patient_id} not found")

    if not models_available():
        return {
            "available": False,
            "message": "ML models not trained yet. Run: python scripts/train_risk_models.py",
            "risks": {},
        }

    # Get latest vitals
    latest_snap = (
        db.query(HealthSnapshot)
        .filter(HealthSnapshot.patient_id == payload.patient_id)
        .order_by(HealthSnapshot.recorded_at.desc())
        .first()
    )

    vitals = {}
    if latest_snap:
        vitals = {
            "heart_rate": latest_snap.heart_rate,
            "spo2": latest_snap.spo2,
            "blood_pressure_systolic": latest_snap.blood_pressure_systolic,
            "blood_pressure_diastolic": latest_snap.blood_pressure_diastolic,
            "body_temp_c": latest_snap.body_temp_c,
            "sleep_hours_last_night": latest_snap.sleep_hours_last_night,
        }

    # Get profile
    profile_data = {}
    if patient.profile:
        p = patient.profile
        profile_data = {
            "smoking_status": p.smoking_status,
            "alcohol_use": p.alcohol_use,
            "exercise_frequency": p.exercise_frequency,
            "family_history": p.family_history_list if hasattr(p, "family_history_list") else [],
            "sleep_hours": p.sleep_hours,
        }

    patient_data = {
        "age": patient.age,
        "sex": patient.sex,
        "bmi": patient.bmi,
        "weight_kg": patient.weight_kg,
        "height_cm": patient.height_cm,
    }

    result = predict_risks(patient_data, vitals, profile_data, payload.symptoms)
    return result


@router.get("/status")
def risk_status():
    """Check if ML models are loaded."""
    return {
        "models_available": models_available(),
        "diseases": ["diabetes", "hypertension", "heart_disease"],
    }
