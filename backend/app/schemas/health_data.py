from datetime import datetime
from pydantic import BaseModel


class HealthSnapshotOut(BaseModel):
    id: int
    patient_id: int
    heart_rate: int              # bpm
    spo2: float                  # %
    steps_today: int
    sleep_hours_last_night: float
    body_temp_c: float           # Celsius
    blood_pressure_systolic: int
    blood_pressure_diastolic: int
    recorded_at: datetime

    model_config = {"from_attributes": True}
