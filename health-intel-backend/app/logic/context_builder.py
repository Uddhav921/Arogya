import re

# Keywords in record summaries that flag elevated risk for specific categories.
# The triage engine reads these flags from the context dict.

RESPIRATORY_KEYWORDS = [
    "respiratory", "asthma", "copd", "bronchitis", "pulmonary",
    "lung", "pneumonia", "emphysema",
]

CARDIAC_KEYWORDS = [
    "cardiac", "heart", "coronary", "arrhythmia", "hypertension",
    "blood pressure", "hypertensive", "angina",
]

DIABETES_KEYWORDS = [
    "diabetes", "diabetic", "blood sugar", "glucose", "insulin",
    "type 2", "type 1",
]


def extract_conditions(records) -> list[str]:
    """
    Extract a plain-text list of known conditions from stored records.
    Used to populate the context sent to the z.ai explanability layer.

    Args:
        records: List of MedicalRecord ORM objects.

    Returns:
        List of record summaries (strings), used as read-only context.
    """
    return [r.summary for r in records]


def extract_risk_flags(records) -> dict:
    """
    Scan record summaries for keywords indicating elevated risk categories.
    Returns a flat dict of boolean flags consumed by the triage engine.

    This is read-only — records are NEVER re-diagnosed or reinterpreted.

    Args:
        records: List of MedicalRecord ORM objects.

    Returns:
        Dict with boolean flags, e.g.:
        {"respiratory_condition": True, "cardiac_condition": False, "diabetes": False}
    """
    combined_text = " ".join(r.summary.lower() for r in records)

    def _contains_any(text: str, keywords: list[str]) -> bool:
        return any(re.search(r"\b" + re.escape(kw) + r"\b", text) for kw in keywords)

    return {
        "respiratory_condition": _contains_any(combined_text, RESPIRATORY_KEYWORDS),
        "cardiac_condition": _contains_any(combined_text, CARDIAC_KEYWORDS),
        "hypertension": "hypertension" in combined_text or "hypertensive" in combined_text,
        "diabetes": _contains_any(combined_text, DIABETES_KEYWORDS),
    }


def build_context(patient, records, current_symptoms: list[str]) -> dict:
    """
    Assemble longitudinal patient context for the z.ai explainability layer.

    NO reinterpretation of past records. NO inferring new conditions from history.
    Records are used ONLY to populate historical_flags for risk sensitivity.

    Args:
        patient: Patient ORM object.
        records: List of MedicalRecord ORM objects.
        current_symptoms: Normalized list of current symptom strings.

    Returns:
        Context dict to be embedded into the z.ai prompt.
    """
    return {
        "demographics": {
            "age": patient.age,
            "sex": patient.sex,
        },
        "known_conditions": patient.conditions_list,
        "historical_flags": extract_risk_flags(records),
        "medical_record_summaries": extract_conditions(records),
        "current_symptoms": current_symptoms,
    }
