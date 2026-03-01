def triage(symptoms: list[str], history: dict) -> str:
    """
    Deterministic triage engine. Returns a risk level: HIGH, MEDIUM, or LOW.

    Rules (applied top-down, first match wins):

    HIGH:
      - Breathlessness present (respiratory emergency risk)
      - Chest pain + sweating (cardiac emergency pattern)
      - Chest pain + known cardiac history
      - Chest pain + palpitations + dizziness (cardiac arrhythmia)
      - Palpitations + breathlessness (could be anxiety or cardiac)
      - Vision changes + headache + dizziness (stroke-like pattern)

    MEDIUM:
      - Fever + known respiratory condition (history-sensitive)
      - Fever + chest pain (pulmonary concern)
      - Fever + known cardiac / hypertension / diabetes history
      - Chest pain alone (any occurrence is at least medium)
      - Palpitations + fatigue/dizziness (arrhythmia concern)
      - Multiple systemic symptoms (≥3 severity markers)
      - Dizziness + nausea + headache (systemic pattern)
      - Fever + body ache + chills (flu-like serious pattern)

    LOW:
      - Everything else

    Args:
        symptoms: Normalized list of symptom strings.
        history: Dict of risk flags extracted from patient records.
                 Expected keys (all optional, bool):
                   - "respiratory_condition"
                   - "cardiac_condition"
                   - "diabetes"
                   - "hypertension"

    Returns:
        "HIGH" | "MEDIUM" | "LOW"
    """
    symptom_set = set(symptoms)

    # ── HIGH ─────────────────────────────────────────────────────────────────
    # Breathlessness is always high priority
    if "breathlessness" in symptom_set:
        return "HIGH"

    # Classic cardiac emergency patterns
    if "chest_pain" in symptom_set and "sweating" in symptom_set:
        return "HIGH"

    if "chest_pain" in symptom_set and history.get("cardiac_condition"):
        return "HIGH"

    # Cardiac arrhythmia pattern
    if "chest_pain" in symptom_set and "palpitations" in symptom_set:
        return "HIGH"

    if "palpitations" in symptom_set and "chest_pain" in symptom_set and "dizziness" in symptom_set:
        return "HIGH"

    # Stroke-like pattern
    if "vision_changes" in symptom_set and "headache" in symptom_set and "dizziness" in symptom_set:
        return "HIGH"

    # Wheezing (asthma/respiratory crisis)
    if "wheezing" in symptom_set and "cough" in symptom_set:
        return "HIGH"

    # ── MEDIUM ───────────────────────────────────────────────────────────────
    # ANY chest pain is at least medium risk
    if "chest_pain" in symptom_set:
        return "MEDIUM"

    # Palpitations with other concerning symptoms
    if "palpitations" in symptom_set and (
        "dizziness" in symptom_set or "fatigue" in symptom_set or "nausea" in symptom_set
    ):
        return "MEDIUM"

    # Fever + known respiratory history
    if "fever" in symptom_set and history.get("respiratory_condition"):
        return "MEDIUM"

    # Fever + chest pain
    if "fever" in symptom_set and "chest_pain" in symptom_set:
        return "MEDIUM"

    # Fever + known cardiac or hypertension history
    if "fever" in symptom_set and (
        history.get("cardiac_condition") or history.get("hypertension")
    ):
        return "MEDIUM"

    # Diabetic patient with fever (infection risk is higher)
    if "fever" in symptom_set and history.get("diabetes"):
        return "MEDIUM"

    # Fever + body ache + chills = serious flu-like illness
    if "fever" in symptom_set and "body_ache" in symptom_set and "chills" in symptom_set:
        return "MEDIUM"

    # Multiple systemic symptoms (≥3 from a 'severity' set)
    severity_markers = {"fever", "body_ache", "fatigue", "nausea", "dizziness", "chills"}
    if len(symptom_set & severity_markers) >= 3:
        return "MEDIUM"

    # Dizziness + nausea + headache = systemic concern
    if "dizziness" in symptom_set and "nausea" in symptom_set and "headache" in symptom_set:
        return "MEDIUM"

    # Dizziness + fatigue (anemia/dehydration pattern)
    if "dizziness" in symptom_set and "fatigue" in symptom_set:
        return "MEDIUM"

    # Vision changes alone are concerning
    if "vision_changes" in symptom_set:
        return "MEDIUM"

    # Palpitations alone
    if "palpitations" in symptom_set:
        return "MEDIUM"

    # ── LOW ──────────────────────────────────────────────────────────────────
    return "LOW"
