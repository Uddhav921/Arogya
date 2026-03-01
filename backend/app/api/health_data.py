from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import Patient, HealthSnapshot
from app.schemas.health_data import HealthSnapshotOut

router = APIRouter(prefix="/patients", tags=["health-data"])


@router.get("/{patient_id}/health-data", response_model=list[HealthSnapshotOut])
def get_health_data(
    patient_id: int,
    limit: int = Query(24, ge=1, le=168, description="Number of snapshots to return (default 24 = last 24 hours)"),
    db: Session = Depends(get_db),
):
    """
    Return the most recent health snapshots for a patient.
    Default is last 24 entries (= 24 hours at 1/hour simulation rate).
    Returns empty list if no data yet (no 404).
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    snapshots = (
        db.query(HealthSnapshot)
        .filter(HealthSnapshot.patient_id == patient_id)
        .order_by(HealthSnapshot.recorded_at.desc())
        .limit(limit)
        .all()
    )

    return snapshots  # empty list is fine


@router.get("/{patient_id}/health-data/latest", response_model=Optional[HealthSnapshotOut])
def get_latest_snapshot(patient_id: int, db: Session = Depends(get_db)):
    """Return the single most recent health snapshot for a patient. Returns null if no data."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    snapshot = (
        db.query(HealthSnapshot)
        .filter(HealthSnapshot.patient_id == patient_id)
        .order_by(HealthSnapshot.recorded_at.desc())
        .first()
    )

    if not snapshot:
        return None  # graceful null — no 404

    return snapshot
