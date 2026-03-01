# Health Intel Backend

A **deterministic** health intelligence backend built with FastAPI, SQLite, and z.ai.

> **Key principle:** All medical reasoning (inference + triage) is precomputed, rule-based, and deterministic. The LLM (z.ai) is used **only** to explain the output in plain language.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11 |
| Framework | FastAPI |
| AI SDK | z.ai (ZhipuAI) |
| Database | SQLite |
| ORM | SQLAlchemy |
| Validation | Pydantic |

---

## Setup

### 1. Clone & install dependencies

```bash
cd health-intel-backend
pip install -r requirements.txt
```

### 2. Configure API key

```bash
cp .env.example .env
# Edit .env and add your ZAI_API_KEY
```

### 3. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Open Swagger UI

Visit [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/patients` | Create a new patient |
| GET | `/api/v1/patients/{id}` | Get patient by ID |
| POST | `/api/v1/patients/{id}/records` | Add a medical record |
| GET | `/api/v1/patients/{id}/records` | List records for a patient |
| POST | `/api/v1/assess` | **Main endpoint** — symptom assessment |

---

## End-to-End Flow

```
user_id + symptoms
       ↓
Fetch patient + records (SQLite)
       ↓
Build longitudinal context
       ↓
Normalize symptoms
       ↓
Weighted inference (knowledge graph)
       ↓
Triage logic (HIGH / MEDIUM / LOW)
       ↓
z.ai called ONLY for explanation
       ↓
Return structured JSON
```

---

## Example: Assess Request

```bash
curl -X POST http://localhost:8000/api/v1/assess \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "symptoms": ["fever", "breathlessness", "cough"]}'
```

**Response:**
```json
{
  "triage": "HIGH",
  "top_conditions": ["pneumonia_risk", "viral_fever"],
  "explanation": {
    "explanation": "Based on the information available...",
    "why_it_matters": "...",
    "recommended_next_step": "Seek immediate medical attention.",
    "follow_up_questions": [],
    "safety_note": "This is not a medical diagnosis."
  }
}
```

---

> ⚠️ This system is a demonstration tool only. It is not a medical device and must not be used for clinical decision-making.
