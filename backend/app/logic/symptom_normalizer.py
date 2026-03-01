# Symptom Normalizer
# Maps raw user-provided symptom strings to canonical forms
# used by the knowledge graph.

ALIAS_MAP: dict[str, str] = {
    # Breathing
    "short of breath": "breathlessness",
    "shortness of breath": "breathlessness",
    "difficulty breathing": "breathlessness",
    "can't breathe": "breathlessness",
    "hard to breathe": "breathlessness",
    "breathless": "breathlessness",
    "chest tightness": "breathlessness",
    "breathing difficulty": "breathlessness",

    # Fever
    "high temperature": "fever",
    "high temp": "fever",
    "temperature": "fever",
    "pyrexia": "fever",
    "feeling hot": "fever",

    # Fatigue
    "tired": "fatigue",
    "tiredness": "fatigue",
    "weakness": "fatigue",
    "lethargy": "fatigue",
    "lethargic": "fatigue",
    "exhaustion": "fatigue",
    "exhausted": "fatigue",
    "low energy": "fatigue",
    "no energy": "fatigue",

    # Cough
    "dry cough": "cough",
    "wet cough": "cough",
    "persistent cough": "cough",
    "chronic cough": "cough",

    # Headache
    "headache": "headache",
    "head pain": "headache",
    "migraine": "headache",
    "head hurts": "headache",
    "throbbing head": "headache",

    # Nasal
    "runny nose": "nasal_congestion",
    "blocked nose": "nasal_congestion",
    "stuffy nose": "nasal_congestion",
    "stuffy": "nasal_congestion",
    "congestion": "nasal_congestion",

    # Throat
    "sore throat": "sore_throat",
    "throat pain": "sore_throat",
    "scratchy throat": "sore_throat",
    "throat hurts": "sore_throat",

    # Nausea
    "vomiting": "nausea",
    "nauseous": "nausea",
    "feeling sick": "nausea",
    "throwing up": "nausea",
    "queasy": "nausea",

    # Abdominal
    "stomach ache": "abdominal_pain",
    "stomach pain": "abdominal_pain",
    "belly pain": "abdominal_pain",
    "tummy ache": "abdominal_pain",
    "cramps": "abdominal_pain",
    "stomach cramps": "abdominal_pain",

    # Body ache
    "muscle ache": "body_ache",
    "muscle pain": "body_ache",
    "body pain": "body_ache",
    "joint pain": "body_ache",
    "soreness": "body_ache",
    "aching muscles": "body_ache",
    "aching body": "body_ache",

    # Skin
    "rash": "skin_rash",
    "skin rash": "skin_rash",
    "hives": "skin_rash",
    "itchy skin": "skin_rash",
    "skin irritation": "skin_rash",

    # Chills
    "chills": "chills",
    "shivering": "chills",
    "rigors": "chills",

    # Sweating
    "sweating": "sweating",
    "night sweats": "sweating",
    "excessive sweating": "sweating",

    # Chest
    "chest pain": "chest_pain",
    "chest discomfort": "chest_pain",
    "chest pressure": "chest_pain",

    # Dizziness
    "dizziness": "dizziness",
    "dizzy": "dizziness",
    "lightheaded": "dizziness",
    "lightheadedness": "dizziness",
    "vertigo": "dizziness",
    "faint": "dizziness",
    "feeling faint": "dizziness",

    # Diarrhea
    "diarrhea": "diarrhea",
    "diarrhoea": "diarrhea",
    "loose stools": "diarrhea",
    "watery stools": "diarrhea",
    "runs": "diarrhea",

    # Palpitations
    "palpitations": "palpitations",
    "heart racing": "palpitations",
    "fast heartbeat": "palpitations",
    "heart pounding": "palpitations",
    "irregular heartbeat": "palpitations",

    # Wheezing
    "wheezing": "wheezing",
    "wheeze": "wheezing",
    "whistling breath": "wheezing",

    # Vision
    "blurred vision": "vision_changes",
    "blurry vision": "vision_changes",
    "vision problems": "vision_changes",
    "seeing spots": "vision_changes",

    # Urinary
    "painful urination": "painful_urination",
    "burning urination": "painful_urination",
    "pain when peeing": "painful_urination",
    "frequent urination": "frequent_urination",
    "peeing a lot": "frequent_urination",
    "urge to urinate": "frequent_urination",

    # Light sensitivity
    "sensitivity to light": "sensitivity_to_light",
    "light sensitivity": "sensitivity_to_light",
    "photophobia": "sensitivity_to_light",

    # Sleep
    "insomnia": "insomnia",
    "can't sleep": "insomnia",
    "trouble sleeping": "insomnia",
    "sleeplessness": "insomnia",

    # Trembling
    "trembling": "trembling",
    "shaking": "trembling",
    "tremors": "trembling",

    # Eyes
    "watery eyes": "watery_eyes",
    "itchy eyes": "watery_eyes",
    "eye irritation": "watery_eyes",

    # Sneezing
    "sneezing": "sneezing",
    "sneeze": "sneezing",

    # Back pain
    "back pain": "back_pain",
    "lower back pain": "back_pain",
    "backache": "back_pain",

    # Mouth
    "dry mouth": "dry_mouth",
    "mouth dryness": "dry_mouth",

    # Urine
    "dark urine": "dark_urine",
    "dark colored urine": "dark_urine",

    # Pale
    "pale skin": "pale_skin",
    "pallor": "pale_skin",
    "looking pale": "pale_skin",

    # Other
    "cold hands": "cold_hands",
    "cold feet": "cold_hands",
    "cold extremities": "cold_hands",
    "nosebleed": "nosebleed",
    "nose bleed": "nosebleed",
    "excessive thirst": "excessive_thirst",
    "always thirsty": "excessive_thirst",
    "weight loss": "weight_loss",
    "unexplained weight loss": "weight_loss",
    "slow healing": "slow_healing",
    "wounds not healing": "slow_healing",
    "dehydration": "dehydration",
    "dehydrated": "dehydration",
}

# Build the list of all canonical symptoms for frontend reference
CANONICAL_SYMPTOMS: list[str] = sorted(set(ALIAS_MAP.values()))

# Build reverse lookup: canonical → set of aliases (for fuzzy matching)
_CANONICAL_KEYWORDS: dict[str, set[str]] = {}
for _alias, _canonical in ALIAS_MAP.items():
    if _canonical not in _CANONICAL_KEYWORDS:
        _CANONICAL_KEYWORDS[_canonical] = set()
    _CANONICAL_KEYWORDS[_canonical].add(_alias)
    # Also add the canonical name's words
    for _w in _canonical.replace("_", " ").split():
        _CANONICAL_KEYWORDS[_canonical].add(_w)


def _fuzzy_match(text: str) -> str | None:
    """
    Attempt to match free-text to a canonical symptom using:
    1. Substring matching (e.g. 'chest' → 'chest_pain')
    2. Word overlap scoring
    Returns the best match or None.
    """
    text_words = set(text.lower().split())
    best_score = 0
    best_match = None

    # First try substring match against aliases
    for alias, canonical in ALIAS_MAP.items():
        if text in alias or alias in text:
            return canonical

    # Then try word overlap with canonical symptom keywords
    for canonical, keywords in _CANONICAL_KEYWORDS.items():
        # Score = number of overlapping words
        overlap = len(text_words & keywords)
        # Also check if any text word is a substring of a keyword
        for tw in text_words:
            for kw in keywords:
                if len(tw) >= 3 and (tw in kw or kw in tw):
                    overlap += 0.5

        if overlap > best_score:
            best_score = overlap
            best_match = canonical

    return best_match if best_score >= 1.0 else None


def normalize_symptoms(raw_symptoms: list[str]) -> list[str]:
    """
    Normalize a list of user-provided symptom strings.

    Steps:
    1. Lowercase and strip whitespace.
    2. Apply alias mapping for common phrase variants.
    3. If no exact match, try fuzzy matching.
    4. Deduplicate while preserving order.

    Returns:
        List of canonical symptom strings.
    """
    normalized: list[str] = []
    seen: set[str] = set()

    for symptom in raw_symptoms:
        clean = symptom.strip().lower()
        if not clean:
            continue

        # Convert underscores to spaces for alias lookup
        # (frontend sends "shortness_of_breath", alias map has "shortness of breath")
        clean_spaces = clean.replace("_", " ")

        # Exact alias match first (try both forms)
        canonical = ALIAS_MAP.get(clean) or ALIAS_MAP.get(clean_spaces)

        # If the clean form IS already a canonical name, use it directly
        if not canonical and clean_spaces.replace(" ", "_") in {v for v in ALIAS_MAP.values()}:
            canonical = clean_spaces.replace(" ", "_")

        # If no exact match, try fuzzy
        if not canonical:
            canonical = _fuzzy_match(clean_spaces)

        # If still no match, keep the original (cleaned)
        if not canonical:
            canonical = clean.replace(" ", "_")

        if canonical not in seen:
            seen.add(canonical)
            normalized.append(canonical)

    return normalized


def normalize_free_text(text: str) -> list[str]:
    """
    Parse free-text symptom input (comma/and separated) into normalized symptoms.

    Example: "I have a headache, chest pain and I feel tired"
    → ["headache", "chest_pain", "fatigue"]
    """
    import re
    # Split on commas, 'and', semicolons, periods
    parts = re.split(r'[,;.]|\band\b', text.lower())

    # Remove common filler phrases
    fillers = ["i have", "i feel", "i am", "i'm", "i've been", "my",
               "feeling", "having", "got", "getting", "experiencing",
               "a lot of", "some", "little", "bit of", "really",
               "very", "quite", "somewhat", "kind of"]

    cleaned = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        for filler in fillers:
            p = p.replace(filler, "").strip()
        if p and len(p) > 1:
            cleaned.append(p)

    return normalize_symptoms(cleaned)

