"""
Health Data Simulator
Generates realistic hourly health snapshots for all patients.
Mimics data from wearables (Apple Watch, Fitbit, Garmin, etc.).

Baselines are seeded from the patient's age, sex, and profile.
Small randomized deltas are applied each hour to simulate natural variation.
"""
import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.models import Patient, PatientProfile, HealthSnapshot


def _baseline_for_patient(patient: Patient, profile: PatientProfile | None) -> dict:
    """
    Compute a realistic baseline for a patient given their demographics and profile.
    """
    age = patient.age
    sex = patient.sex.lower()
    stress = (profile.stress_level or "LOW").upper() if profile else "LOW"
    lifestyle = (profile.lifestyle or "").lower() if profile else ""
    smoking = (profile.smoking_status or "never").lower() if profile else "never"

    # Heart rate baseline: adults 60–80, older → slightly higher
    hr_base = 72 if age < 50 else 78
    if stress == "HIGH":
        hr_base += 8
    if lifestyle in ("sedentary", "inactive"):
        hr_base += 5

    # SpO2: healthy 97–99%, smokers slightly lower
    spo2_base = 98.5
    if smoking == "current":
        spo2_base -= 1.5
    if age > 65:
        spo2_base -= 0.5

    # Steps: sedentary ~3000, active ~8000
    steps_base = 3000 if lifestyle in ("sedentary", "inactive") else 7000

    # Sleep: 7 hrs baseline, stress reduces it
    sleep_base = 7.0
    if stress == "HIGH":
        sleep_base -= 1.0
    if profile and profile.sleep_hours:
        sleep_base = profile.sleep_hours

    # Body temp: normal 36.5°C
    temp_base = 36.5

    # Blood pressure: age + lifestyle driven
    conditions = patient.conditions_list
    bp_sys_base = 115
    bp_dia_base = 75
    if "hypertension" in " ".join(conditions).lower():
        bp_sys_base += 20
        bp_dia_base += 10
    if age > 50:
        bp_sys_base += 8
    if stress == "HIGH":
        bp_sys_base += 6
    if sex == "male":
        bp_sys_base += 4

    return {
        "heart_rate": hr_base,
        "spo2": spo2_base,
        "steps_today": steps_base,
        "sleep_hours_last_night": sleep_base,
        "body_temp_c": temp_base,
        "blood_pressure_systolic": bp_sys_base,
        "blood_pressure_diastolic": bp_dia_base,
    }


def generate_snapshot(patient: Patient, profile: PatientProfile | None) -> dict:
    """
    Generate one health snapshot dict for a patient with realistic random variation.

    Returns:
        Dict suitable for constructing a HealthSnapshot ORM object.
    """
    base = _baseline_for_patient(patient, profile)

    def jitter(val, low, high, delta):
        return round(max(low, min(high, val + random.uniform(-delta, delta))), 1)

    return {
        "patient_id": patient.id,
        "heart_rate": int(jitter(base["heart_rate"], 45, 130, 6)),
        "spo2": round(jitter(base["spo2"], 90.0, 100.0, 0.8), 1),
        "steps_today": max(0, int(base["steps_today"] + random.randint(-1000, 2000))),
        "sleep_hours_last_night": round(jitter(base["sleep_hours_last_night"], 3.0, 12.0, 1.0), 1),
        "body_temp_c": round(jitter(base["body_temp_c"], 35.5, 39.0, 0.3), 1),
        "blood_pressure_systolic": int(jitter(base["blood_pressure_systolic"], 85, 190, 8)),
        "blood_pressure_diastolic": int(jitter(base["blood_pressure_diastolic"], 55, 120, 5)),
        "recorded_at": datetime.now(timezone.utc),
    }


def run_simulator(db: Session) -> int:
    """
    Generate one HealthSnapshot for every patient in the DB.
    Called by the APScheduler background job every hour.

    Returns:
        Number of snapshots generated.
    """
    patients = db.query(Patient).all()
    count = 0
    for patient in patients:
        profile = patient.profile  # May be None if no profile set
        snap_data = generate_snapshot(patient, profile)
        snap = HealthSnapshot(**snap_data)
        db.add(snap)
        count += 1
    db.commit()
    return count
