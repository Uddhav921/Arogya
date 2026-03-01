"""
Test script for the triage + normalizer pipeline.
Run from the backend directory:
    python test_triage.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.logic.symptom_normalizer import normalize_symptoms, normalize_free_text
from app.logic.triage_engine import triage
from app.logic.inference_engine import infer, infer_with_scores

DIVIDER = "=" * 70

def test_scenario(name, raw_symptoms, history=None, free_text=None):
    """Run a single scenario through the full pipeline."""
    history = history or {}
    print(f"\n{DIVIDER}")
    print(f"SCENARIO: {name}")
    print(f"{DIVIDER}")

    # Normalize (this is what the frontend sends)
    normalized = normalize_symptoms(raw_symptoms)
    if free_text:
        ft_symptoms = normalize_free_text(free_text)
        # Merge, dedup
        seen = set(normalized)
        for s in ft_symptoms:
            if s not in seen:
                normalized.append(s)
                seen.add(s)

    print(f"  Raw input:      {raw_symptoms}")
    if free_text:
        print(f"  Free text:      '{free_text}'")
    print(f"  Normalized:     {normalized}")
    print(f"  History flags:  {history}")

    # Triage
    level = triage(normalized, history)
    print(f"  TRIAGE:         *** {level} ***")

    # Inference
    conditions = infer(normalized)
    scores = infer_with_scores(normalized)
    print(f"  Top conditions: {conditions}")
    print(f"  All scores:     {scores}")
    print()

    return level


def main():
    print("\n" + "=" * 70)
    print("  AROGA TRIAGE + NORMALIZER TEST SUITE")
    print("=" * 70)

    results = {}

    # ── LOW RISK scenarios ──
    results["Mild headache only"] = test_scenario(
        "Mild headache only",
        ["headache"]
    )

    results["Common cold"] = test_scenario(
        "Common cold symptoms",
        ["nasal_congestion", "sore_throat", "cough"]
    )

    results["Back pain + fatigue"] = test_scenario(
        "Back pain + fatigue",
        ["back_pain", "fatigue"]
    )

    # ── MEDIUM RISK scenarios ──
    results["Chest pain alone"] = test_scenario(
        "Chest pain alone (should be MEDIUM)",
        ["chest_pain"]
    )

    results["Fever + body ache + chills"] = test_scenario(
        "Fever + body ache + chills = flu-like (MEDIUM)",
        ["fever", "body_ache", "chills"]
    )

    results["Palpitations + dizziness"] = test_scenario(
        "Palpitations + dizziness (MEDIUM)",
        ["palpitations", "dizziness"]
    )

    results["Dizziness + fatigue"] = test_scenario(
        "Dizziness + fatigue (MEDIUM)",
        ["dizziness", "fatigue"]
    )

    results["3+ severity markers"] = test_scenario(
        "3+ severity markers: fever, nausea, dizziness (MEDIUM)",
        ["fever", "nausea", "dizziness"]
    )

    results["Fever + diabetic history"] = test_scenario(
        "Fever with diabetes history (MEDIUM)",
        ["fever", "headache"],
        history={"diabetes": True}
    )

    results["Vision changes alone"] = test_scenario(
        "Vision changes alone (MEDIUM)",
        ["blurred_vision"]
    )

    # ── HIGH RISK scenarios ──
    results["Shortness of breath (underscored)"] = test_scenario(
        "Shortness of breath (frontend sends underscored)",
        ["shortness_of_breath"]
    )

    results["Chest pain + sweating"] = test_scenario(
        "Chest pain + sweating = cardiac emergency (HIGH)",
        ["chest_pain", "sweating"]
    )

    results["Chest pain + palpitations"] = test_scenario(
        "Chest pain + palpitations (HIGH)",
        ["chest_pain", "palpitations"]
    )

    results["Vision + headache + dizziness"] = test_scenario(
        "Vision changes + headache + dizziness = stroke-like (HIGH)",
        ["blurred_vision", "headache", "dizziness"]
    )

    results["Wheezing + cough"] = test_scenario(
        "Wheezing + cough = respiratory crisis (HIGH)",
        ["wheezing", "cough"]
    )

    results["Chest pain + cardiac history"] = test_scenario(
        "Chest pain + cardiac history (HIGH)",
        ["chest_pain", "fatigue"],
        history={"cardiac_condition": True}
    )

    # ── Free text test ──
    results["Free text: chest pain + hard to breathe"] = test_scenario(
        "Free text parsing",
        [],
        free_text="I have chest pain and it's hard to breathe, I'm sweating a lot"
    )

    results["Free text: headache and tired"] = test_scenario(
        "Free text: simple stuff",
        [],
        free_text="I have a headache and I feel tired"
    )

    # ── SUMMARY ──
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    for name, level in results.items():
        icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(level, "⚪")
        print(f"  {icon} {level:6s}  {name}")

    # Verify expected results
    print("\n" + "-" * 70)
    expected_high = [
        "Shortness of breath (underscored)",
        "Chest pain + sweating",
        "Chest pain + palpitations",
        "Vision + headache + dizziness",
        "Wheezing + cough",
        "Chest pain + cardiac history",
        "Free text: chest pain + hard to breathe",
    ]
    expected_medium = [
        "Chest pain alone",
        "Fever + body ache + chills",
        "Palpitations + dizziness",
        "Dizziness + fatigue",
        "3+ severity markers",
        "Fever + diabetic history",
        "Vision changes alone",
    ]
    expected_low = [
        "Mild headache only",
        "Common cold",
        "Back pain + fatigue",
        "Free text: headache and tired",
    ]

    failures = 0
    for name in expected_high:
        if results.get(name) != "HIGH":
            print(f"  ❌ FAIL: '{name}' expected HIGH, got {results.get(name)}")
            failures += 1
    for name in expected_medium:
        if results.get(name) != "MEDIUM":
            print(f"  ❌ FAIL: '{name}' expected MEDIUM, got {results.get(name)}")
            failures += 1
    for name in expected_low:
        if results.get(name) != "LOW":
            print(f"  ❌ FAIL: '{name}' expected LOW, got {results.get(name)}")
            failures += 1

    if failures == 0:
        print(f"\n  ✅ ALL {len(results)} SCENARIOS PASSED!")
    else:
        print(f"\n  ❌ {failures}/{len(results)} SCENARIOS FAILED!")

    print()


if __name__ == "__main__":
    main()
