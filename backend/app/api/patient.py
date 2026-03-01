import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, SymptomSession
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient record."""
    patient = Patient(
        name=payload.name,
        age=payload.age,
        sex=payload.sex,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        known_conditions=json.dumps(payload.known_conditions),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientOut(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        weight_kg=patient.weight_kg,
        height_cm=patient.height_cm,
        bmi=patient.bmi,
        known_conditions=patient.conditions_list,
    )


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Retrieve a patient by ID."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    return PatientOut(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        weight_kg=patient.weight_kg,
        height_cm=patient.height_cm,
        bmi=patient.bmi,
        known_conditions=patient.conditions_list,
    )


@router.get("/{patient_id}/sessions")
def get_sessions(patient_id: int, db: Session = Depends(get_db)):
    """Return past symptom assessment sessions for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    sessions = (
        db.query(SymptomSession)
        .filter(SymptomSession.patient_id == patient_id)
        .order_by(SymptomSession.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": s.id,
            "symptoms": s.symptoms_list,
            "triage": s.triage,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, payload: PatientCreate, db: Session = Depends(get_db)):
    """Update patient details (weight, height, conditions, etc.)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    patient.name = payload.name
    patient.age = payload.age
    patient.sex = payload.sex
    patient.weight_kg = payload.weight_kg
    patient.height_cm = payload.height_cm
    patient.known_conditions = json.dumps(payload.known_conditions)
    db.commit()
    db.refresh(patient)

    return PatientOut(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        weight_kg=patient.weight_kg,
        height_cm=patient.height_cm,
        bmi=patient.bmi,
        known_conditions=patient.conditions_list,
    )

