"""
app/ml/features.py — Feature definitions for ML risk prediction models.

24 clinical features used by XGBoost models for disease risk prediction.
Feature order MUST match the training script exactly.
"""

FEATURE_NAMES: list[str] = [
    # Demographics (3)
    "age",
    "gender",           # 0=Female, 1=Male
    "bmi",

    # Risk factors (6)
    "smoking",          # 0/1
    "alcohol",          # 0/1
    "fh_diabetes",      # family history: 0/1
    "fh_heart",         # family history: 0/1
    "fh_htn",           # family history: hypertension 0/1
    "activity_level",   # 0=low, 1=moderate, 2=high

    # Vitals (7)
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "spo2",
    "glucose",          # mg/dL (fasting)
    "temperature",      # °F
    "sleep_hours",

    # Symptom features (8)
    "symptom_count",
    "max_severity",     # 0-5
    "has_chest_pain",
    "has_breathlessness",
    "has_fever",
    "has_headache",
    "has_fatigue",
    "has_frequent_urination",
]

RISK_DISEASES = ["diabetes", "hypertension", "heart_disease"]

NORMAL_RANGES = {
    "heart_rate": (60, 100),
    "systolic_bp": (90, 120),
    "diastolic_bp": (60, 80),
    "spo2": (95, 100),
    "glucose": (70, 100),
    "bmi": (18.5, 24.9),
    "temperature": (97.8, 99.1),
    "sleep_hours": (7, 9),
}
