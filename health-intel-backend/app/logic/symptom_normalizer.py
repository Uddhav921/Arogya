# Symptom Normalizer
# Maps raw user-provided symptom strings to canonical forms
# used by the knowledge graph.

ALIAS_MAP: dict[str, str] = {
    "short of breath": "breathlessness",
    "shortness of breath": "breathlessness",
    "difficulty breathing": "breathlessness",
    "can't breathe": "breathlessness",
    "hard to breathe": "breathlessness",
    "breathless": "breathlessness",
    "chest tightness": "breathlessness",
    "high temperature": "fever",
    "high temp": "fever",
    "temperature": "fever",
    "pyrexia": "fever",
    "tired": "fatigue",
    "tiredness": "fatigue",
    "weakness": "fatigue",
    "lethargy": "fatigue",
    "lethargic": "fatigue",
    "dry cough": "cough",
    "wet cough": "cough",
    "headache": "headache",
    "head pain": "headache",
    "migraine": "headache",
    "runny nose": "nasal_congestion",
    "blocked nose": "nasal_congestion",
    "stuffy nose": "nasal_congestion",
    "sore throat": "sore_throat",
    "throat pain": "sore_throat",
    "vomiting": "nausea",
    "nauseous": "nausea",
    "stomach ache": "abdominal_pain",
    "stomach pain": "abdominal_pain",
    "belly pain": "abdominal_pain",
    "muscle ache": "body_ache",
    "muscle pain": "body_ache",
    "body pain": "body_ache",
    "joint pain": "body_ache",
    "rash": "skin_rash",
    "skin rash": "skin_rash",
    "chills": "chills",
    "shivering": "chills",
    "sweating": "sweating",
    "night sweats": "sweating",
    "chest pain": "chest_pain",
    "chest discomfort": "chest_pain",
    "dizziness": "dizziness",
    "dizzy": "dizziness",
    "lightheaded": "dizziness",
}


def normalize_symptoms(raw_symptoms: list[str]) -> list[str]:
    """
    Normalize a list of user-provided symptom strings.

    Steps:
    1. Lowercase and strip whitespace.
    2. Apply alias mapping for common phrase variants.
    3. Deduplicate while preserving order.

    Returns:
        List of canonical symptom strings.
    """
    normalized: list[str] = []
    seen: set[str] = set()

    for symptom in raw_symptoms:
        clean = symptom.strip().lower()
        canonical = ALIAS_MAP.get(clean, clean)  # map to canonical or keep as-is
        if canonical not in seen:
            seen.add(canonical)
            normalized.append(canonical)

    return normalized
