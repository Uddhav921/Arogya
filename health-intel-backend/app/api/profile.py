import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, PatientProfile
from app.schemas.profile import ProfileCreate, ProfileOut

router = APIRouter(prefix="/patients", tags=["profile"])


@router.post("/{patient_id}/profile", response_model=ProfileOut, status_code=201)
def create_or_update_profile(
    patient_id: int,
    payload: ProfileCreate,
    db: Session = Depends(get_db),
):
    """
    Create or fully replace a patient's extended profile.
    Includes location (for AQI), family history, lifestyle, eating habits etc.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    existing = patient.profile
    if existing:
        # Update in place
        existing.location = payload.location
        existing.family_history = json.dumps(payload.family_history)
        existing.eating_habits = payload.eating_habits
        existing.lifestyle = payload.lifestyle
        existing.exercise_frequency = payload.exercise_frequency
        existing.sleep_hours = payload.sleep_hours
        existing.stress_level = payload.stress_level
        existing.alcohol_use = payload.alcohol_use
        existing.smoking_status = payload.smoking_status
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        profile = existing
    else:
        profile = PatientProfile(
            patient_id=patient_id,
            family_history=json.dumps(payload.family_history),
            **payload.model_dump(exclude={"family_history"}),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return _profile_out(profile)


@router.get("/{patient_id}/profile", response_model=ProfileOut)
def get_profile(patient_id: int, db: Session = Depends(get_db)):
    """Retrieve the extended profile for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    if not patient.profile:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")
    return _profile_out(patient.profile)


def _profile_out(profile: PatientProfile) -> ProfileOut:
    return ProfileOut(
        id=profile.id,
        patient_id=profile.patient_id,
        location=profile.location,
        family_history=profile.family_history_list,
        eating_habits=profile.eating_habits,
        lifestyle=profile.lifestyle,
        exercise_frequency=profile.exercise_frequency,
        sleep_hours=profile.sleep_hours,
        stress_level=profile.stress_level,
        alcohol_use=profile.alcohol_use,
        smoking_status=profile.smoking_status,
        notes=profile.notes,
        updated_at=profile.updated_at,
    )
