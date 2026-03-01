"""
app/db/seeder.py — Startup data seeder for Railway / fresh deployments.

Seeds a demo patient with profile and health snapshot so the ML pipeline
has data to work with immediately after deploy.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.models import Patient, PatientProfile, HealthSnapshot

logger = logging.getLogger(__name__)

DEMO_PATIENT_USERNAME = "demo"


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed_demo_data(db: Session) -> bool:
    """
    Seed a demo patient if no patients exist in the database.
    Returns True if seeding was performed, False if data already exists.
    """
    existing = db.query(Patient).first()
    if existing:
        logger.info("[Seeder] Patients already exist — skipping seed.")
        return False

    logger.info("[Seeder] Fresh database detected — seeding demo patient...")

    # ── 1. Create demo patient ─────────────────────────────────────────────────
    patient = Patient(
        username=DEMO_PATIENT_USERNAME,
        password_hash=_hash_password("demo123"),
        name="Demo User",
        age=35,
        sex="male",
        weight_kg=78.0,
        height_cm=175.0,
        known_conditions=json.dumps(["hypertension"]),
    )
    db.add(patient)
    db.flush()  # Get the patient.id without committing

    # ── 2. Create profile ──────────────────────────────────────────────────────
    profile = PatientProfile(
        patient_id=patient.id,
        location="Mumbai",
        family_history=json.dumps(["diabetes", "heart disease"]),
        eating_habits="high sodium, processed foods",
        lifestyle="sedentary",
        exercise_frequency="rarely",
        sleep_hours=6.5,
        stress_level="HIGH",
        alcohol_use="occasional",
        smoking_status="never",
    )
    db.add(profile)

    # ── 3. Create initial health snapshot ─────────────────────────────────────
    snapshot = HealthSnapshot(
        patient_id=patient.id,
        heart_rate=88,
        spo2=97.0,
        steps_today=3200,
        sleep_hours_last_night=6.0,
        body_temp_c=37.1,
        blood_pressure_systolic=138,
        blood_pressure_diastolic=88,
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(snapshot)

    db.commit()
    logger.info(f"[Seeder] ✅ Demo patient created (id={patient.id}, username='demo', password='demo123')")
    return True
