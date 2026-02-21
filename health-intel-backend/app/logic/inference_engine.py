from app.logic.knowledge_graph import CONDITIONS

# Maximum number of ranked conditions to return
TOP_N = 3


def infer(symptoms: list[str]) -> list[str]:
    """
    Weighted inference engine.

    For each condition in the knowledge graph, sums the weights
    for every symptom that is present in the user's symptom list.
    Returns conditions ranked by score (highest first), top N only.

    This is deterministic and explainable — no ML involved.

    Args:
        symptoms: Normalized list of symptom strings.

    Returns:
        Ranked list of condition names (top N).
    """
    symptom_set = set(symptoms)
    scores: dict[str, float] = {}

    for condition, weights in CONDITIONS.items():
        score = sum(w for symptom, w in weights.items() if symptom in symptom_set)
        scores[condition] = score

    # Filter out conditions with zero score
    nonzero = {k: v for k, v in scores.items() if v > 0.0}

    ranked = sorted(nonzero, key=lambda k: nonzero[k], reverse=True)
    return ranked[:TOP_N]


def infer_with_scores(symptoms: list[str]) -> dict[str, float]:
    """
    Like infer(), but returns the full score dict for debugging/transparency.

    Args:
        symptoms: Normalized list of symptom strings.

    Returns:
        Dict of {condition: score}, only non-zero entries, sorted descending.
    """
    symptom_set = set(symptoms)
    scores: dict[str, float] = {}

    for condition, weights in CONDITIONS.items():
        score = sum(w for symptom, w in weights.items() if symptom in symptom_set)
        if score > 0.0:
            scores[condition] = score

    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))
