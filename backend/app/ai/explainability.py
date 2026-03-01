from app.ai.z_ai_client import call_z_ai


def build_ai_payload(context: dict, triage: str, top_conditions: list[str]) -> dict:
    """Merge longitudinal context with precomputed inference results."""
    return {
        **context,
        "triage_level": triage,
        "ranked_possible_causes": top_conditions,
    }


def get_explanation(context: dict, triage: str, top_conditions: list[str]) -> dict:
    """
    Orchestrate the explainability flow:
    1. Build AI payload from precomputed results.
    2. Call z.ai with constraining system prompt.
    3. Validate shape, enforce triage rules.
    4. Return structured explanation dict.
    """
    payload = build_ai_payload(context, triage, top_conditions)
    result = call_z_ai(payload)

    if not result:
        result = _fallback_explanation(triage)

    # HIGH triage MUST NOT contain follow-up questions
    if triage == "HIGH":
        result["follow_up_questions"] = []

    return result


def _fallback_explanation(triage: str) -> dict:
    """Safe static fallback when AI fails to return valid JSON."""
    guidance_map = {
        "HIGH": "Please seek immediate medical attention without delay.",
        "MEDIUM": "Consider scheduling a consultation with a healthcare professional soon.",
        "LOW": "Monitor your symptoms. Rest, stay hydrated, and seek care if things worsen.",
    }
    return {
        "explanation": (
            "Based on the information available, the system has evaluated your "
            "symptoms using its clinical reasoning engine."
        ),
        "risk_summary": (
            f"Your risk level has been assessed as {triage}. "
            "This is determined by your symptoms and medical history."
        ),
        "preventive_guidance": guidance_map.get(triage, "Please consult a doctor."),
        "follow_up_questions": [],
        "safety_note": (
            "This is not a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        ),
    }
