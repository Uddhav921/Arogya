import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Patient, HealthSnapshot
from app.ai.z_ai_client import call_z_ai_chat

router = APIRouter(prefix="/patients", tags=["chatbot"])

# Load chatbot system prompt once
_CHATBOT_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "chatbot_prompt.txt"
_CHATBOT_SYSTEM_PROMPT = _CHATBOT_PROMPT_PATH.read_text(encoding="utf-8")


class ChatMessage(BaseModel):
    role: str    # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []   # Previous turns, oldest first


class ChatResponse(BaseModel):
    reply: str
    history: list[ChatMessage]        # Updated history including this turn


@router.post("/{patient_id}/chat", response_model=ChatResponse)
def chat(
    patient_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Conversational health assistant chatbot for a patient.

    The chatbot is initialized with the patient's full context (demographics,
    medical history, profile, latest health data, AQI) so responses are
    personalized to that specific patient.

    Send conversation history with each request to maintain context.
    The chatbot cannot diagnose or prescribe — it is a preventive health guide.
    """
    # ── Fetch patient ─────────────────────────────────────────────────────────
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # ── Build patient context block ───────────────────────────────────────────
    context = _build_chat_context(patient, db)

    # Serialize compact (no indent) + strip None values to keep it small
    context_json = json.dumps(
        _strip_nones(context),
        separators=(",", ":"),
        ensure_ascii=False,
    )

    # Increase context capacity — keep system content under 16000 chars
    MAX_CONTEXT_CHARS = 16000
    system_header = (
        _CHATBOT_SYSTEM_PROMPT
        + "\n\n---PATIENT CONTEXT---\n"
    )
    available = MAX_CONTEXT_CHARS - len(system_header)
    if len(context_json) > available:
        context_json = context_json[:available - 30] + "...[trimmed]}"

    system_content = system_header + context_json

    # ── Build messages array ──────────────────────────────────────────────────
    messages = [{"role": "system", "content": system_content}]

    # Add conversation history (keep last 6 turns to cap tokens)
    history_turns = list(payload.history)[-6:]
    for turn in history_turns:
        messages.append({"role": turn.role, "content": turn.content})

    # Add the new user message
    messages.append({"role": "user", "content": payload.message})

    # ── Call z.ai ─────────────────────────────────────────────────────────────
    reply = call_z_ai_chat(messages)

    # ── Update history for the response ───────────────────────────────────────
    updated_history = list(payload.history) + [
        ChatMessage(role="user",      content=payload.message),
        ChatMessage(role="assistant", content=reply),
    ]

    return ChatResponse(reply=reply, history=updated_history)


def _strip_nones(obj):
    """Recursively remove None values from dicts/lists to save tokens."""
    if isinstance(obj, dict):
        return {k: _strip_nones(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_strip_nones(i) for i in obj if i is not None]
    return obj



def _build_chat_context(patient, db: Session) -> dict:
    """Build a compact patient context to inject into the chatbot system prompt."""
    from app.db.models import SymptomSession, MedicalRecord

    profile = patient.profile

    # Latest health snapshot — only the key metrics
    latest_snap = (
        db.query(HealthSnapshot)
        .filter(HealthSnapshot.patient_id == patient.id)
        .order_by(HealthSnapshot.recorded_at.desc())
        .first()
    )

    health_data = None
    if latest_snap:
        health_data = {
            "hr":    latest_snap.heart_rate,
            "spo2":  latest_snap.spo2,
            "temp":  latest_snap.body_temp_c,
            "bp":    f"{latest_snap.blood_pressure_systolic}/{latest_snap.blood_pressure_diastolic}",
            "steps": latest_snap.steps_today,
        }

    # AQI — 3 keys only
    aqi_data = None
    if profile and profile.location:
        from app.services.aqi_service import fetch_aqi
        raw_aqi = fetch_aqi(profile.location)
        if raw_aqi:
            aqi_data = {
                "location": profile.location,
                "aqi":      raw_aqi.get("aqi"),
                "category": raw_aqi.get("category"),
            }

    # Recent assessments — last 2, no raw date string
    recent_raw = (
        db.query(SymptomSession)
        .filter(SymptomSession.patient_id == patient.id)
        .order_by(SymptomSession.created_at.desc())
        .limit(2)
        .all()
    )
    recent_sessions = [
        {"symptoms": s.symptoms_list, "triage": s.triage}
        for s in recent_raw
    ]

    # Medical records — last 4, summaries capped at 120 chars
    recent_records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient.id)
        .order_by(MedicalRecord.created_at.desc())
        .limit(4)
        .all()
    )
    records = [
        {
            "type":    r.record_type,
            "title":   r.title,
            "summary": (r.summary[:4000] + "…") if r.summary and len(r.summary) > 4000 else r.summary,
        }
        for r in recent_records
    ]

    ctx: dict = {
        "age":        patient.age,
        "sex":        patient.sex,
        "conditions": patient.conditions_list,
        "records":    records,
        "assessments": recent_sessions,
        "vitals":     health_data,
        "aqi":        aqi_data,
    }

    if profile:
        ctx["profile"] = {
            "location":    profile.location,
            "family_hx":   profile.family_history_list,
            "diet":        profile.eating_habits,
            "lifestyle":   profile.lifestyle,
            "exercise":    profile.exercise_frequency,
            "sleep_h":     profile.sleep_hours,
            "stress":      profile.stress_level,
            "alcohol":     profile.alcohol_use,
            "smoking":     profile.smoking_status,
        }

    return ctx
