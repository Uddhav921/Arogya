import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient
from app.schemas.patient import PatientCreate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient record."""
    patient = Patient(
        age=payload.age,
        sex=payload.sex,
        known_conditions=json.dumps(payload.known_conditions),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    # Hydrate the list field before returning
    return PatientOut(
        id=patient.id,
        age=patient.age,
        sex=patient.sex,
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
        age=patient.age,
        sex=patient.sex,
        known_conditions=patient.conditions_list,
    )
