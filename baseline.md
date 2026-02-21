0️⃣ TECH STACK (FINAL, SIMPLIFIED)
Language      : Python 3.11
Framework     : FastAPI
AI SDK        : z.ai SDK
Database      : SQLite
ORM           : SQLAlchemy
Validation    : Pydantic
Auth          : Simple user_id (no passwords)
Deployment    : Local / Hackathon demo
Why this is SAFE

SQLite → no infra complexity

No Redis → no state bugs

No auth logic → fewer loopholes

Logic stays strong, infra stays simple

1️⃣ DIRECTORY STRUCTURE (MINIMAL BUT SERIOUS)
health-intel-backend/
│
├── app/
│   ├── main.py
│
│   ├── api/
│   │   ├── patient.py          # create/get patient
│   │   ├── records.py          # store previous medical records
│   │   └── assessment.py       # symptom analysis
│
│   ├── db/
│   │   ├── database.py         # SQLite engine
│   │   └── models.py           # Patient, MedicalRecord, Session
│
│   ├── schemas/
│   │   ├── patient.py
│   │   ├── record.py
│   │   └── assessment.py
│
│   ├── logic/
│   │   ├── symptom_normalizer.py
│   │   ├── knowledge_graph.py
│   │   ├── inference_engine.py
│   │   ├── triage_engine.py
│   │   └── context_builder.py
│
│   ├── ai/
│   │   ├── z_ai_client.py
│   │   └── explainability.py
│
│   └── prompts/
│       └── system_prompt.txt
│
├── requirements.txt
└── README.md

This proves:

Reasoning ≠ AI

Patient history is real

LLM is secondary

2️⃣ CORE BACKEND SYSTEM PROMPT (TERMINAL TEXT)

This is the MOST IMPORTANT PART
Use this verbatim as the system prompt for z.ai.

cat << 'EOF' > app/prompts/system_prompt.txt
YOU ARE A BACKEND EXPLAINABILITY MODULE IN A HEALTH INTELLIGENCE SYSTEM.

YOU ARE NOT:
- A doctor
- A diagnostic system
- A treatment recommender
- A chatbot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You exist ONLY to explain the output of a clinical reasoning backend.

All medical reasoning, risk evaluation, and condition ranking are:
- Precomputed
- Deterministic
- Graph- and rule-based
- FINAL

You MUST NOT perform independent medical inference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT CONTRACT (AUTHORITATIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive a JSON object containing:

- Patient demographics
- Known medical history (from stored records)
- Current normalized symptoms
- Ranked possible causes (from inference engine)
- Risk / triage level (LOW / MEDIUM / HIGH)
- Triggered reasoning factors

THIS INPUT IS THE SINGLE SOURCE OF TRUTH.

You MUST NOT:
- Add new symptoms
- Add new diseases
- Reinterpret past diagnoses
- Modify risk level

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE PROHIBITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST NEVER:
- Diagnose a disease
- Claim certainty
- Suggest medicines or dosages
- Provide treatment plans
- Say "you have X"
- Say "this confirms"
- Say "this means you are suffering from"

If tempted → STOP.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLOWED OUTPUT BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MAY:
- Explain WHY the system reached this conclusion
- Describe symptom-pattern matching in simple terms
- Emphasize uncertainty and safety
- Ask UP TO 2 clarifying questions IF risk != HIGH
- Recommend consulting a healthcare professional IF aligned with triage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE & TONE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Calm
- Neutral
- Non-alarmist
- No medical jargon
- No absolutes

Preferred phrases:
"Based on the information available..."
"This may indicate..."
"One possible explanation is..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY OUTPUT FORMAT (JSON ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "explanation": "Plain-language explanation of backend reasoning",
  "why_it_matters": "Why this risk level deserves attention",
  "recommended_next_step": "Safe action aligned with triage",
  "follow_up_questions": ["optional"],
  "safety_note": "This is not a medical diagnosis"
}

If you cannot comply EXACTLY, return {}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIAGE-SPECIFIC BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOW:
- Encourage monitoring
- No urgency language

MEDIUM:
- Encourage professional consultation
- Emphasize observation

HIGH:
- Be firm and calm
- Recommend immediate medical attention
- DO NOT ask follow-up questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU ARE AN INTERPRETER OF CLINICAL LOGIC, NOT A SOURCE OF MEDICAL TRUTH.

EOF

This prompt alone blocks:

Hallucinations

Diagnosis leakage

Treatment advice

AI overreach

3️⃣ SQLITE DATA MODEL (SIMPLE BUT CORRECT)
Patient table
id | age | sex | known_conditions
MedicalRecord table
id | patient_id | record_type | summary | created_at
SymptomSession table
id | patient_id | symptoms | triage | created_at

Important rule
Stored medical records are:

Read-only context

NEVER re-diagnosed

Used ONLY for risk sensitivity

4️⃣ CONTEXT BUILDER (NO LOOPHOLES)
def build_context(patient, records, current_symptoms):
    return {
        "demographics": patient,
        "known_conditions": extract_conditions(records),
        "historical_flags": extract_risk_flags(records),
        "current_symptoms": current_symptoms
    }

✔ No reinterpretation
✔ No conflicting diagnoses
✔ Ada-style longitudinal memory

5️⃣ ADA-STYLE KNOWLEDGE GRAPH (LOGIC CORE)
CONDITIONS = {
  "viral_fever": {
    "fever": 0.9,
    "fatigue": 0.6,
    "cough": 0.4
  },
  "pneumonia_risk": {
    "fever": 0.8,
    "cough": 0.7,
    "breathlessness": 0.9
  }
}

This is NOT if-else.
This is weighted reasoning.

6️⃣ INFERENCE ENGINE (ADA-LEVEL, NO ML)
def infer(symptoms):
    scores = {}
    for condition, weights in CONDITIONS.items():
        score = sum(
            w for s, w in weights.items() if s in symptoms
        )
        scores[condition] = score

    return sorted(scores, key=scores.get, reverse=True)

✔ Deterministic
✔ Explainable
✔ Extendable

7️⃣ TRIAGE ENGINE (SEPARATE & STRONG)
def triage(symptoms, history):
    if "breathlessness" in symptoms:
        return "HIGH"
    if "fever" in symptoms and history.get("respiratory_condition"):
        return "MEDIUM"
    return "LOW"

Inference ≠ Triage
This separation is critical.

8️⃣ END-TO-END FLOW (CRYSTAL CLEAR)
1. User sends user_id + symptoms
2. Fetch patient + previous records (SQLite)
3. Build longitudinal context
4. Normalize symptoms
5. Run weighted inference
6. Run triage logic
7. Call z.ai ONLY for explanation
8. Return structured JSON