from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, MedicalRecord
from app.schemas.record import RecordCreate, RecordOut

router = APIRouter(prefix="/patients", tags=["records"])


@router.post("/{patient_id}/records", response_model=RecordOut, status_code=201)
def add_record(
    patient_id: int,
    payload: RecordCreate,
    db: Session = Depends(get_db),
):
    """
    Add a medical record to a patient.

    record_type examples:
    - "diagnosis"     → A past or current diagnosed condition
    - "lab_result"    → Blood test, urine test, imaging etc.
    - "allergy"       → Known allergy or adverse reaction
    - "report"        → Full medical report upload summary
    - "vaccination"   → Vaccine history
    - "prescription"  → Past prescriptions (summary only, no dosage advice)
    - "surgery"       → Surgical history
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    record = MedicalRecord(
        patient_id=patient_id,
        record_type=payload.record_type,
        title=payload.title,
        summary=payload.summary,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{patient_id}/records", response_model=list[RecordOut])
def list_records(patient_id: int, db: Session = Depends(get_db)):
    """List all medical records for a patient, ordered most recent first."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    return sorted(patient.records, key=lambda r: r.created_at, reverse=True)


@router.delete("/{patient_id}/records/{record_id}", status_code=204)
def delete_record(patient_id: int, record_id: int, db: Session = Depends(get_db)):
    """Delete a specific medical record."""
    record = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.id == record_id, MedicalRecord.patient_id == patient_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
