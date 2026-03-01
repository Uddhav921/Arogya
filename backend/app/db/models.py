import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float,
    ForeignKey, DateTime, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    name = Column(String(100), nullable=False, default="Patient")
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False)
    weight_kg = Column(Float, nullable=True)      # kilograms
    height_cm = Column(Float, nullable=True)      # centimeters
    known_conditions = Column(Text, default="[]")  # JSON list string

    records = relationship("MedicalRecord", back_populates="patient", cascade="all, delete-orphan")
    sessions = relationship("SymptomSession", back_populates="patient", cascade="all, delete-orphan")
    profile = relationship("PatientProfile", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    health_snapshots = relationship("HealthSnapshot", back_populates="patient", cascade="all, delete-orphan")

    @property
    def conditions_list(self) -> list[str]:
        return json.loads(self.known_conditions or "[]")

    @property
    def bmi(self) -> float | None:
        if self.weight_kg and self.height_cm and self.height_cm > 0:
            return round(self.weight_kg / ((self.height_cm / 100) ** 2), 1)
        return None


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    record_type = Column(String(50), nullable=False)  # diagnosis, lab_result, allergy, report
    summary = Column(Text, nullable=False)
    # Optional: title for named reports (e.g. "Blood Test Report - Jan 2025")
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="records")


class SymptomSession(Base):
    __tablename__ = "symptom_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    symptoms = Column(Text, nullable=False)   # JSON list string
    triage = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="sessions")

    @property
    def symptoms_list(self) -> list[str]:
        return json.loads(self.symptoms or "[]")


class PatientProfile(Base):
    """
    Extended patient profile: lifestyle, family history, eating habits, location.
    One-to-one with Patient. Used to enrich assessment context and AQI lookup.
    """
    __tablename__ = "patient_profiles"
    __table_args__ = (UniqueConstraint("patient_id", name="uq_profile_patient"),)

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Location — used for AQI lookup
    location = Column(String(200), nullable=True)

    # Family history of conditions, stored as JSON list
    family_history = Column(Text, default="[]")  # e.g. ["diabetes", "heart disease"]

    # Lifestyle
    eating_habits = Column(Text, nullable=True)      # e.g. "high sodium, processed foods"
    lifestyle = Column(String(100), nullable=True)   # e.g. "sedentary"
    exercise_frequency = Column(String(50), nullable=True)  # e.g. "rarely", "3x/week"
    sleep_hours = Column(Float, nullable=True)       # avg hours per night
    stress_level = Column(String(20), nullable=True) # LOW / MEDIUM / HIGH
    alcohol_use = Column(String(50), nullable=True)  # none / occasional / regular
    smoking_status = Column(String(50), nullable=True)  # never / former / current

    # Any other notes
    notes = Column(Text, nullable=True)

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="profile")

    @property
    def family_history_list(self) -> list[str]:
        return json.loads(self.family_history or "[]")


class HealthSnapshot(Base):
    """
    Simulated wearable health data snapshot generated hourly per patient.
    Mimics data from health apps (Apple Health, Fitbit, etc.).
    """
    __tablename__ = "health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    heart_rate = Column(Integer, nullable=False)          # bpm
    spo2 = Column(Float, nullable=False)                  # %
    steps_today = Column(Integer, nullable=False)
    sleep_hours_last_night = Column(Float, nullable=False)
    body_temp_c = Column(Float, nullable=False)           # Celsius
    blood_pressure_systolic = Column(Integer, nullable=False)   # mmHg
    blood_pressure_diastolic = Column(Integer, nullable=False)  # mmHg

    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    patient = relationship("Patient", back_populates="health_snapshots")
