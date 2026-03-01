# Ada-style Knowledge Graph
# Each condition maps to a dict of {symptom: weight}.
# Weights are in range [0.0, 1.0] and represent diagnostic sensitivity
# of that symptom for the condition.
#
# This is NOT if-else. It is weighted reasoning.
# The inference engine sums weights for matching symptoms → produces a score.

CONDITIONS: dict[str, dict[str, float]] = {
    "viral_fever": {
        "fever": 0.9,
        "fatigue": 0.6,
        "cough": 0.4,
        "body_ache": 0.5,
        "headache": 0.4,
        "chills": 0.5,
        "sore_throat": 0.3,
    },
    "pneumonia_risk": {
        "fever": 0.8,
        "cough": 0.7,
        "breathlessness": 0.9,
        "chest_pain": 0.6,
        "fatigue": 0.5,
        "chills": 0.4,
    },
    "common_cold": {
        "nasal_congestion": 0.9,
        "sore_throat": 0.7,
        "cough": 0.6,
        "headache": 0.4,
        "fatigue": 0.3,
        "fever": 0.2,  # mild/absent in colds
    },
    "influenza": {
        "fever": 0.85,
        "body_ache": 0.8,
        "fatigue": 0.8,
        "headache": 0.7,
        "cough": 0.6,
        "chills": 0.6,
        "sore_throat": 0.4,
    },
    "dengue_risk": {
        "fever": 0.9,
        "body_ache": 0.8,
        "headache": 0.7,
        "skin_rash": 0.6,
        "fatigue": 0.5,
        "nausea": 0.4,
    },
    "gastroenteritis": {
        "nausea": 0.9,
        "abdominal_pain": 0.8,
        "fatigue": 0.5,
        "fever": 0.4,
    },
    "cardiac_concern": {
        "chest_pain": 0.9,
        "breathlessness": 0.8,
        "sweating": 0.6,
        "dizziness": 0.5,
        "fatigue": 0.4,
        "nausea": 0.3,
    },
    "allergic_reaction": {
        "skin_rash": 0.8,
        "nasal_congestion": 0.6,
        "cough": 0.5,
        "breathlessness": 0.4,
        "fatigue": 0.2,
    },
}
