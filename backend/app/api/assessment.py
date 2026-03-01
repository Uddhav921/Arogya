import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, HealthSnapshot, SymptomSession
from app.schemas.assessment import (
    AssessmentRequest, AssessmentResponse, HealthStatus, DiseaseRisk, RiskFactor,
)

from app.logic.symptom_normalizer import normalize_symptoms, normalize_free_text
from app.logic.context_builder import build_context, extract_risk_flags
from app.logic.inference_engine import infer
from app.logic.triage_engine import triage
from app.ai.explainability import get_explanation
from app.services.aqi_service import fetch_aqi
from app.ml.predictor import predict_risks, models_available
from app.ml.features import NORMAL_RANGES

router = APIRouter(prefix="/assess", tags=["assessment"])


def _build_health_status(
    patient, vitals_dict: dict, profile_data: dict, normalized: list[str], triage_level: str
) -> HealthStatus | None:
    """Build composite health status from ML risk + vitals + triage."""
    patient_data = {
        "age": patient.age,
        "sex": patient.sex,
        "bmi": patient.bmi,
        "weight_kg": patient.weight_kg,
        "height_cm": patient.height_cm,
    }

    # ML risk prediction
    ml_result = predict_risks(patient_data, vitals_dict, profile_data, normalized)

    if not ml_result.get("available"):
        return None

    # Parse ML risks
    risk_scores = {}
    max_risk = "LOW"
    for disease, data in ml_result.get("risks", {}).items():
        factors = [RiskFactor(**f) for f in data.get("top_factors", [])]
        risk_scores[disease] = DiseaseRisk(
            probability=data["probability"],
            risk_level=data["risk_level"],
            top_factors=factors,
        )
        if data["risk_level"] == "HIGH":
            max_risk = "HIGH"
        elif data["risk_level"] == "MEDIUM" and max_risk != "HIGH":
            max_risk = "MODERATE"

    # Override with triage if higher
    if triage_level == "HIGH":
        max_risk = "CRITICAL"
    elif triage_level == "MEDIUM" and max_risk == "LOW":
        max_risk = "MODERATE"

    # Vitals summary
    vitals_summary = {}
    for key, (lo, hi) in NORMAL_RANGES.items():
        val = vitals_dict.get(key) or vitals_dict.get(f"blood_pressure_{key.replace('_bp', '')}")
        if key == "heart_rate":
            val = vitals_dict.get("heart_rate")
        elif key == "systolic_bp":
            val = vitals_dict.get("blood_pressure_systolic")
        elif key == "diastolic_bp":
            val = vitals_dict.get("blood_pressure_diastolic")
        elif key == "bmi":
            val = patient.bmi

        if val is not None:
            status = "Normal" if lo <= val <= hi else ("High" if val > hi else "Low")
            label = key.replace("_", " ").title()
            vitals_summary[key] = f"{status} ({val:.0f})" if isinstance(val, float) else f"{status} ({val})"

    # Recommendations based on risks
    recommendations = []
    for disease, dr in risk_scores.items():
        if dr.risk_level in ("MEDIUM", "HIGH"):
            name = disease.replace("_", " ").title()
            recommendations.append(f"Your {name} risk is {dr.risk_level.lower()} ({dr.probability:.0%}). Consider consulting a doctor.")
    if not recommendations:
        recommendations.append("Your risk levels are within normal range. Keep maintaining a healthy lifestyle!")

    return HealthStatus(
        overall_risk=max_risk,
        risk_scores=risk_scores,
        vitals_summary=vitals_summary,
        recommendations=recommendations,
    )


@router.post("", response_model=AssessmentResponse, status_code=200)
def assess(payload: AssessmentRequest, db: Session = Depends(get_db)):
    """
    Main assessment endpoint — full end-to-end flow:

    1.  Fetch patient + records from SQLite
    2.  Build longitudinal context (history, profile, family history)
    3.  Normalize symptoms (exact match → fuzzy match → free-text parse)
    4.  Weighted inference (knowledge graph)
    5.  Deterministic triage
    6.  Fetch AQI if patient has a location profile
    7.  Fetch latest health snapshot (wearable data)
    8.  ML risk prediction (XGBoost + SHAP)
    9.  Call z.ai ONLY for plain-language explanation
    10. Save SymptomSession to DB
    11. Return structured JSON with triage, conditions, AQI, ML risk, explanation
    """
    # ── 1. Fetch patient ──────────────────────────────────────────────────────
    patient = db.query(Patient).filter(Patient.id == payload.user_id).first()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Patient {payload.user_id} not found. "
                "Create the patient first via POST /api/v1/patients"
            ),
        )

    records = patient.records
    profile = patient.profile  # May be None

    # ── 2. Build longitudinal context ─────────────────────────────────────────
    # Merge symptom list + free text
    all_symptoms = list(payload.symptoms)
    if payload.free_text.strip():
        free_text_symptoms = normalize_free_text(payload.free_text)
        all_symptoms.extend(free_text_symptoms)

    context = build_context(patient, records, all_symptoms)

    # Enrich context with profile if available
    profile_data = {}
    if profile:
        profile_data = {
            "location": profile.location,
            "family_history": profile.family_history_list,
            "eating_habits": profile.eating_habits,
            "lifestyle": profile.lifestyle,
            "exercise_frequency": profile.exercise_frequency,
            "sleep_hours": profile.sleep_hours,
            "stress_level": profile.stress_level,
            "alcohol_use": profile.alcohol_use,
            "smoking_status": profile.smoking_status,
        }
        context["lifestyle_profile"] = profile_data

    # ── 3. Normalize symptoms ─────────────────────────────────────────────────
    normalized = normalize_symptoms(all_symptoms)

    # ── 4. Weighted inference ─────────────────────────────────────────────────
    top_conditions = infer(normalized)

    # ── 5. Triage logic (deterministic, separate from inference) ──────────────
    history_flags = extract_risk_flags(records)

    if profile:
        if (profile.stress_level or "").upper() == "HIGH":
            history_flags["high_stress"] = True
        if (profile.smoking_status or "").lower() == "current":
            history_flags["respiratory_condition"] = True
        if profile.family_history_list:
            fh_text = " ".join(profile.family_history_list).lower()
            if any(k in fh_text for k in ["heart", "cardiac", "coronary"]):
                history_flags["cardiac_condition"] = True
            if "diabetes" in fh_text:
                history_flags["diabetes"] = True

    triage_level = triage(normalized, history_flags)

    # ── 6. AQI — fetch if patient has location ────────────────────────────────
    aqi_data = None
    aqi_level = None
    if profile and profile.location:
        aqi_data = fetch_aqi(profile.location)
        if aqi_data:
            aqi_level = aqi_data["aqi"]
            context["air_quality"] = aqi_data

            respiratory_symptoms = {"breathlessness", "cough", "nasal_congestion"}
            if (
                aqi_level > 150
                and any(s in normalized for s in respiratory_symptoms)
                and triage_level == "LOW"
            ):
                triage_level = "MEDIUM"

    # ── 7. Latest health snapshot ─────────────────────────────────────────────
    latest_snap = (
        db.query(HealthSnapshot)
        .filter(HealthSnapshot.patient_id == payload.user_id)
        .order_by(HealthSnapshot.recorded_at.desc())
        .first()
    )
    vitals_dict = {}
    if latest_snap:
        vitals_dict = {
            "heart_rate": latest_snap.heart_rate,
            "spo2": latest_snap.spo2,
            "blood_pressure_systolic": latest_snap.blood_pressure_systolic,
            "blood_pressure_diastolic": latest_snap.blood_pressure_diastolic,
            "body_temp_c": latest_snap.body_temp_c,
            "sleep_hours_last_night": latest_snap.sleep_hours_last_night,
        }
        context["latest_wearable_data"] = {
            "heart_rate_bpm": latest_snap.heart_rate,
            "spo2_percent": latest_snap.spo2,
            "steps_today": latest_snap.steps_today,
            "sleep_hours_last_night": latest_snap.sleep_hours_last_night,
            "body_temp_celsius": latest_snap.body_temp_c,
            "blood_pressure": (
                f"{latest_snap.blood_pressure_systolic}/"
                f"{latest_snap.blood_pressure_diastolic}"
            ),
        }

    # ── 8. ML risk prediction + health status ─────────────────────────────────
    health_status = _build_health_status(
        patient, vitals_dict, profile_data, normalized, triage_level
    )

    # ── 9. z.ai explanation (LLM used ONLY here) ──────────────────────────────
    explanation = get_explanation(context, triage_level, top_conditions)

    # ── 10. Persist session ───────────────────────────────────────────────────
    session = SymptomSession(
        patient_id=payload.user_id,
        symptoms=json.dumps(normalized),
        triage=triage_level,
    )
    db.add(session)
    db.commit()

    # ── 11. Return ────────────────────────────────────────────────────────────
    return AssessmentResponse(
        triage=triage_level,
        top_conditions=top_conditions,
        aqi_level=aqi_level,
        explanation=explanation,
        health_status=health_status,
        normalized_symptoms=normalized,
    )
