def triage(symptoms: list[str], history: dict) -> str:
    """
    Deterministic triage engine. Returns a risk level: HIGH, MEDIUM, or LOW.

    Rules (applied top-down, first match wins):

    HIGH:
      - Breathlessness present (always escalate — respiratory emergency risk)
      - Chest pain + sweating (cardiac emergency pattern)

    MEDIUM:
      - Fever + known respiratory condition (history-sensitive elevation)
      - Fever + chest pain (pulmonary concern)
      - High inference score pattern (multiple severe symptoms)

    LOW:
      - Everything else

    NOTE: Inference (what condition it might be) is intentionally separate from
    triage (how urgently to act). This separation is critical per the baseline.

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
    if "breathlessness" in symptom_set:
        return "HIGH"

    if "chest_pain" in symptom_set and "sweating" in symptom_set:
        return "HIGH"

    # Cardiac concern: chest pain in a patient with known cardiac history
    if "chest_pain" in symptom_set and history.get("cardiac_condition"):
        return "HIGH"

    # ── MEDIUM ───────────────────────────────────────────────────────────────
    # Fever + known respiratory history → elevated risk
    if "fever" in symptom_set and history.get("respiratory_condition"):
        return "MEDIUM"

    # Fever + chest pain without the HIGH patterns above
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

    # Multiple systemic symptoms (≥3 from a 'severity' set)
    severity_markers = {"fever", "body_ache", "fatigue", "nausea", "dizziness", "chills"}
    if len(symptom_set & severity_markers) >= 3:
        return "MEDIUM"

    # ── LOW ──────────────────────────────────────────────────────────────────
    return "LOW"
