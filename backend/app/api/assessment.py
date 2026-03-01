import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, HealthSnapshot, SymptomSession
from app.schemas.assessment import AssessmentRequest, AssessmentResponse

from app.logic.symptom_normalizer import normalize_symptoms
from app.logic.context_builder import build_context, extract_risk_flags
from app.logic.inference_engine import infer
from app.logic.triage_engine import triage
from app.ai.explainability import get_explanation
from app.services.aqi_service import fetch_aqi

router = APIRouter(prefix="/assess", tags=["assessment"])


@router.post("", response_model=AssessmentResponse, status_code=200)
def assess(payload: AssessmentRequest, db: Session = Depends(get_db)):
    """
    Main assessment endpoint — full end-to-end flow:

    1.  Fetch patient + records from SQLite
    2.  Build longitudinal context (history, profile, family history)
    3.  Normalize symptoms
    4.  Weighted inference (knowledge graph)
    5.  Deterministic triage
    6.  Fetch AQI if patient has a location profile
    7.  Fetch latest health snapshot (wearable data)
    8.  Call z.ai ONLY for plain-language explanation
    9.  Save SymptomSession to DB
    10. Return structured JSON with triage, conditions, AQI, explanation
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
    context = build_context(patient, records, payload.symptoms)

    # Enrich context with profile if available
    if profile:
        context["lifestyle_profile"] = {
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

    # ── 3. Normalize symptoms ─────────────────────────────────────────────────
    normalized = normalize_symptoms(payload.symptoms)

    # ── 4. Weighted inference ─────────────────────────────────────────────────
    top_conditions = infer(normalized)

    # ── 5. Triage logic (deterministic, separate from inference) ──────────────
    history_flags = extract_risk_flags(records)

    # Blend profile risk flags into history_flags
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

            # AQI can elevate triage:
            # Unhealthy AQI (>150) + respiratory symptoms → at least MEDIUM
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
    if latest_snap:
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

    # ── 8. z.ai explanation (LLM used ONLY here) ──────────────────────────────
    explanation = get_explanation(context, triage_level, top_conditions)

    # ── 9. Persist session ────────────────────────────────────────────────────
    session = SymptomSession(
        patient_id=payload.user_id,
        symptoms=json.dumps(normalized),
        triage=triage_level,
    )
    db.add(session)
    db.commit()

    # ── 10. Return ────────────────────────────────────────────────────────────
    return AssessmentResponse(
        triage=triage_level,
        top_conditions=top_conditions,
        aqi_level=aqi_level,
        explanation=explanation,
    )
