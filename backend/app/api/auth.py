"""
app/api/auth.py — Simple username + password authentication.

Uses SHA-256 hashing (no bcrypt dependency needed).
"""

import hashlib
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    """SHA-256 hash with a fixed salt. Good enough for prototype."""
    salted = f"healthintel_{password}_v2"
    return hashlib.sha256(salted.encode()).hexdigest()


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new patient with username + password."""
    # Check if username taken
    existing = db.query(Patient).filter(Patient.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    if len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    patient = Patient(
        username=payload.username,
        password_hash=_hash_password(payload.password),
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

    return AuthResponse(
        patient_id=patient.id,
        username=patient.username,
        name=patient.name,
        message="Registration successful",
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with username + password. Returns patient_id."""
    patient = db.query(Patient).filter(Patient.username == payload.username).first()
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if patient.password_hash != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return AuthResponse(
        patient_id=patient.id,
        username=patient.username,
        name=patient.name,
        message="Login successful",
    )
