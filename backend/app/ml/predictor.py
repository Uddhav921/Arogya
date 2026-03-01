"""
app/ml/predictor.py — Runtime risk prediction using trained XGBoost models.

Loads pre-trained models from data/models/ and returns risk scores + SHAP explanations.
Falls back gracefully if models aren't trained yet.
"""

import pickle
import logging
from pathlib import Path
from typing import Optional

import numpy as np

from app.ml.features import FEATURE_NAMES, RISK_DISEASES, NORMAL_RANGES

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parents[2] / "data" / "models"

# ── Lazy-loaded model cache ────────────────────────────────────────────────────
_models: dict = {}
_shap_explainers: dict = {}
_loaded = False


def _load_models():
    """Load all trained models and SHAP explainers into memory."""
    global _loaded
    if _loaded:
        return

    for disease in RISK_DISEASES:
        pkl_path = MODEL_DIR / f"{disease}_model.pkl"
        shap_path = MODEL_DIR / f"{disease}_shap.pkl"

        if pkl_path.exists():
            try:
                with open(pkl_path, "rb") as f:
                    _models[disease] = pickle.load(f)
                logger.info(f"Loaded ML model: {disease}")
            except Exception as e:
                logger.warning(f"Failed to load {disease} model: {e}")

        if shap_path.exists():
            try:
                with open(shap_path, "rb") as f:
                    _shap_explainers[disease] = pickle.load(f)
                logger.info(f"Loaded SHAP explainer: {disease}")
            except Exception as e:
                logger.warning(f"Failed to load {disease} SHAP: {e}")

    _loaded = True
    logger.info(f"ML models loaded: {list(_models.keys())}")


def models_available() -> bool:
    """Check if any ML models are loaded."""
    _load_models()
    return len(_models) > 0


# ── Feature extraction ─────────────────────────────────────────────────────────

def extract_features(
    patient: dict,
    vitals: Optional[dict] = None,
    profile: Optional[dict] = None,
    symptoms: Optional[list[str]] = None,
) -> np.ndarray:
    """
    Build a 24-feature vector from patient data.

    Args:
        patient: dict with age, sex, bmi, weight_kg, height_cm
        vitals: dict with heart_rate, spo2, blood_pressure_systolic, etc.
        profile: dict with smoking_status, alcohol_use, exercise_frequency, family_history, sleep_hours
        symptoms: list of normalized symptom strings
    """
    symptoms = symptoms or []
    vitals = vitals or {}
    profile = profile or {}

    # Demographics
    age = float(patient.get("age", 30))
    gender = 1.0 if str(patient.get("sex", "")).lower() in ("male", "m") else 0.0
    bmi = float(patient.get("bmi", 0) or 0)
    if bmi == 0:
        w = patient.get("weight_kg")
        h = patient.get("height_cm")
        if w and h and h > 0:
            bmi = w / ((h / 100) ** 2)

    # Risk factors from profile
    smoking_raw = str(profile.get("smoking_status", "")).lower()
    smoking = 1.0 if smoking_raw in ("current", "yes", "smoker") else 0.0
    alcohol_raw = str(profile.get("alcohol_use", "")).lower()
    alcohol = 1.0 if alcohol_raw in ("regular", "heavy", "yes") else 0.0

    fh = [f.lower() for f in (profile.get("family_history") or [])]
    fh_diabetes = 1.0 if any("diab" in f for f in fh) else 0.0
    fh_heart = 1.0 if any("heart" in f or "cardiac" in f for f in fh) else 0.0
    fh_htn = 1.0 if any("hypert" in f or "bp" in f or "blood pressure" in f for f in fh) else 0.0

    exercise_raw = str(profile.get("exercise_frequency", "")).lower()
    if "daily" in exercise_raw or "5" in exercise_raw or "high" in exercise_raw:
        activity = 2.0
    elif "3" in exercise_raw or "4" in exercise_raw or "moderate" in exercise_raw:
        activity = 1.0
    else:
        activity = 0.0

    # Vitals
    heart_rate = float(vitals.get("heart_rate", 72))
    systolic_bp = float(vitals.get("blood_pressure_systolic", 120))
    diastolic_bp = float(vitals.get("blood_pressure_diastolic", 80))
    spo2 = float(vitals.get("spo2", 98))
    glucose = float(vitals.get("glucose", 90))  # May not exist yet
    temperature = float(vitals.get("body_temp_c", 37.0)) * 9 / 5 + 32  # C → F
    sleep_hours = float(profile.get("sleep_hours") or vitals.get("sleep_hours_last_night") or 7)

    # Symptoms
    symptom_count = float(len(symptoms))
    max_severity = min(float(len(symptoms)), 5.0)  # proxy
    has_chest_pain = 1.0 if "chest_pain" in symptoms else 0.0
    has_breathlessness = 1.0 if "breathlessness" in symptoms else 0.0
    has_fever = 1.0 if "fever" in symptoms else 0.0
    has_headache = 1.0 if "headache" in symptoms else 0.0
    has_fatigue = 1.0 if "fatigue" in symptoms else 0.0
    has_freq_urination = 1.0 if "frequent_urination" in symptoms else 0.0

    features = np.array([
        age, gender, bmi,
        smoking, alcohol, fh_diabetes, fh_heart, fh_htn, activity,
        heart_rate, systolic_bp, diastolic_bp, spo2, glucose, temperature, sleep_hours,
        symptom_count, max_severity,
        has_chest_pain, has_breathlessness, has_fever, has_headache, has_fatigue, has_freq_urination,
    ], dtype=np.float32).reshape(1, -1)

    return features


# ── Prediction ──────────────────────────────────────────────────────────────────

def predict_risks(
    patient: dict,
    vitals: Optional[dict] = None,
    profile: Optional[dict] = None,
    symptoms: Optional[list[str]] = None,
) -> dict:
    """
    Run all disease risk models and return results.

    Returns:
        {
          "available": True/False,
          "risks": {
            "diabetes": {"probability": 0.34, "risk_level": "MEDIUM", "top_factors": [...]},
            ...
          }
        }
    """
    _load_models()

    if not _models:
        return {"available": False, "risks": {}}

    X = extract_features(patient, vitals, profile, symptoms)
    results = {}

    for disease in RISK_DISEASES:
        model = _models.get(disease)
        if not model:
            continue

        prob = float(model.predict_proba(X)[0, 1])

        # Risk level
        if prob < 0.3:
            risk_level = "LOW"
        elif prob < 0.6:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        # SHAP explanation
        top_factors = []
        explainer = _shap_explainers.get(disease)
        if explainer:
            try:
                shap_values = explainer.shap_values(X)
                # For binary classification, take class 1 values
                if isinstance(shap_values, list):
                    sv = shap_values[1][0]
                else:
                    sv = shap_values[0]

                # Get top 5 contributing features
                indices = np.argsort(np.abs(sv))[-5:][::-1]
                for idx in indices:
                    fname = FEATURE_NAMES[idx]
                    impact = float(sv[idx])
                    top_factors.append({
                        "feature": fname.replace("_", " ").title(),
                        "value": float(X[0, idx]),
                        "impact": round(impact, 4),
                        "direction": "increases" if impact > 0 else "decreases",
                    })
            except Exception as e:
                logger.warning(f"SHAP failed for {disease}: {e}")

        results[disease] = {
            "probability": round(prob, 3),
            "risk_level": risk_level,
            "top_factors": top_factors,
        }

    return {"available": True, "risks": results}
