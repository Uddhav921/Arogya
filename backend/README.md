# Arogya Backend — Architecture Guide

> **Problem Statement**: Build a system that helps identify health risks before serious illness occurs. Intelligent diagnosis and symptom analysis system.

## System Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                           │
│   Auth → Onboarding → Dashboard → Assessment → Chat → Profile      │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼────────────────────────────────────────┐
│                     FastAPI Backend                                  │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │  Auth API   │  │ Assessment   │  │    Chat API (Arogya AI)     │ │
│  │  /auth/*    │  │  /assess     │  │  /patients/{id}/chat        │ │
│  └─────────────┘  └──────┬───────┘  └─────────────────────────────┘ │
│                          │                                           │
│          ┌───────────────┼───────────────┐                          │
│          ▼               ▼               ▼                          │
│  ┌──────────────┐ ┌─────────────┐ ┌────────────────┐               │
│  │ Weight-Based │ │ ML-Based    │ │ Arogya AI      │               │
│  │ Engine       │ │ Risk Engine │ │ (Explanation)  │               │
│  │              │ │             │ │                │               │
│  │ • Knowledge  │ │ • XGBoost   │ │ • Plain-lang   │               │
│  │   Graph (18  │ │   classif.  │ │   explanation  │               │
│  │   conditions)│ │ • SHAP      │ │ • Risk summary │               │
│  │ • Symptom    │ │   explain.  │ │ • Guidance     │               │
│  │   Normalizer │ │ • 24 feat.  │ │ • Follow-up Qs │               │
│  │   (170+      │ │ • 3 disease │ │                │               │
│  │   aliases)   │ │   models    │ │                │               │
│  │ • Triage     │ │             │ │                │               │
│  │   Engine     │ │             │ │                │               │
│  └──────┬───────┘ └──────┬──────┘ └───────┬────────┘               │
│         │                │                │                          │
│         └────────────────┼────────────────┘                          │
│                          ▼                                           │
│                 ┌─────────────────┐                                  │
│                 │  AssessmentResponse                                │
│                 │  • triage: HIGH/MED/LOW                            │
│                 │  • top_conditions: [...]                           │
│                 │  • health_status:                                  │
│                 │    - overall_risk                                  │
│                 │    - risk_scores (per disease)                     │
│                 │    - vitals_summary                                │
│                 │    - recommendations                               │
│                 │  • explanation (Arogya AI)                         │
│                 │  • aqi_level                                       │
│                 └─────────────────┘                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Data Layer: SQLite + SQLAlchemy                                │ │
│  │  Patient │ Profile │ Sessions │ Records │ HealthSnapshots       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Dual-Engine Approach: Weight-Based + ML-Based

### Why Two Engines?

| Aspect | Weight-Based (Rule Engine) | ML-Based (XGBoost) |
|--------|---------------------------|---------------------|
| **Purpose** | Symptom → Condition matching | Chronic disease risk prediction |
| **Input** | Normalized symptoms only | 24 clinical features (demographics + vitals + symptoms + lifestyle) |
| **Output** | Ranked conditions + triage level | Risk probability (0-1) per disease + SHAP explanations |
| **Speed** | Instant (<1ms) | Instant (<5ms) |
| **Diseases** | 18 acute/common conditions | 3 chronic diseases (diabetes, hypertension, heart disease) |
| **Explainability** | Rule weights are transparent | SHAP values show top contributing factors |
| **When it shines** | "I have a headache and fever" → Flu, Migraine | "Given my age, BMI, family history, vitals → 34% diabetes risk" |

### How They Work Together

```text
User Input: "I have chest pain, shortness of breath"
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    Weight-Based Engine              ML Risk Engine
    ┌──────────────────┐        ┌──────────────────────┐
    │ 1. Normalize:    │        │ 1. Extract features: │
    │    chest_pain,   │        │    age=45, bmi=28,   │
    │    breathlessness│        │    has_chest_pain=1,  │
    │                  │        │    has_breathless=1,  │
    │ 2. Match against │        │    heart_rate=88, ... │
    │    18 conditions │        │                      │
    │    with weights  │        │ 2. XGBoost predict:  │
    │                  │        │    P(heart) = 0.62   │
    │ 3. Result:       │        │    P(hypert) = 0.41  │
    │    Heart Disease │        │    P(diabetes) = 0.12│
    │    (score: 4.2)  │        │                      │
    │    Anxiety (2.8) │        │ 3. SHAP explains:    │
    │                  │        │    chest_pain ↑ 0.31 │
    │ 4. Triage: HIGH  │        │    age ↑ 0.18        │
    └──────────────────┘        └──────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
                    Combined Response:
                    ┌───────────────────────────┐
                    │ triage: HIGH              │
                    │ conditions: Heart Disease │
                    │ overall_risk: CRITICAL    │
                    │ heart_disease: 62% (HIGH) │
                    │ top_factors: chest pain,  │
                    │   age, smoking            │
                    │ + Arogya AI explanation   │
                    └───────────────────────────┘
```

### Assessment Pipeline (Step by Step)

1. **Symptom Input** — User selects symptoms OR types free-text  
2. **Normalization** — Exact alias match → fuzzy match → free-text parse (strips fillers, splits on commas)  
3. **Weight-Based Inference** — Matches against 18-condition knowledge graph with weighted scoring  
4. **Triage** — Deterministic LOW/MEDIUM/HIGH based on symptoms + medical history + family history  
5. **AQI Integration** — Fetches air quality; unhealthy AQI + respiratory symptoms → elevates triage  
6. **ML Risk Prediction** — XGBoost models predict diabetes/hypertension/heart disease probability  
7. **Health Status** — Combines ML risk + vitals + triage into overall_risk (LOW/MODERATE/HIGH/CRITICAL)  
8. **Arogya AI Explanation** — LLM generates plain-language explanation, risk summary, and preventive guidance  
9. **Persist** — Saves session to DB for history tracking  

---

## Project Structure

```text
backend/
├── app/
│   ├── api/                    # FastAPI route handlers
│   │   ├── auth.py             # POST /auth/register, /auth/login
│   │   ├── patient.py          # CRUD patients, GET /sessions
│   │   ├── assessment.py       # POST /assess (main pipeline)
│   │   ├── chatbot.py          # POST /patients/{id}/chat
│   │   ├── risk.py             # POST /risk (standalone ML prediction)
│   │   ├── profile.py          # CRUD patient profiles
│   │   ├── records.py          # Medical records
│   │   ├── health_data.py      # Wearable health snapshots
│   │   ├── aqi.py              # Air quality index
│   │   └── documents.py        # Document upload/parsing
│   │
│   ├── logic/                  # Deterministic reasoning (no ML)
│   │   ├── knowledge_graph.py  # 18 conditions × weighted symptoms
│   │   ├── symptom_normalizer.py # 170+ aliases + fuzzy matching
│   │   ├── inference_engine.py # Weighted scoring algorithm
│   │   ├── triage_engine.py    # Deterministic triage rules
│   │   └── context_builder.py  # Longitudinal context assembly
│   │
│   ├── ml/                     # Machine learning module
│   │   ├── features.py         # 24 feature definitions + normal ranges
│   │   └── predictor.py        # Runtime prediction + SHAP explanation
│   │
│   ├── ai/                     # LLM integration (Arogya AI Layer)
│   │   ├── ai_client.py        # Generic wrapper for intelligence
│   │   └── explainability.py   # Prompt engineering for explanations
│   │
│   ├── db/                     # Database layer
│   │   ├── database.py         # SQLite + SQLAlchemy setup
│   │   └── models.py           # Patient, Profile, Session, Record, Snapshot
│   │
│   ├── schemas/                # Pydantic request/response models
│   │   ├── auth.py             # RegisterRequest, LoginRequest
│   │   ├── patient.py          # PatientCreate, PatientOut
│   │   └── assessment.py       # AssessmentRequest/Response, HealthStatus
│   │
│   ├── services/               # External integrations
│   │   ├── aqi_service.py      # OpenWeather AQI API
│   │   └── health_simulator.py # Hourly wearable data generation
│   │
│   └── main.py                 # FastAPI app, CORS, router registration
│
├── scripts/
│   └── train_risk_models.py    # Train XGBoost models (~15s)
│
├── data/
│   └── models/                 # Trained model artifacts
│       ├── diabetes_model.pkl
│       ├── hypertension_model.pkl
│       ├── heart_disease_model.pkl
│       └── *_shap.pkl          # SHAP explainers
│
└── .env                        # AI_API_KEY, AQI_API_KEY
```

---

## ML Models

### Features (24 total)

| # | Feature | Source |
|---|---------|--------|
| 1-3 | Age, Gender, BMI | Patient record |
| 4-9 | Smoking, Alcohol, Family Hx (3), Activity Level | Patient profile |
| 10-16 | Heart Rate, Systolic BP, Diastolic BP, SpO2, Glucose, Temp, Sleep | Wearable data |
| 17-24 | Symptom Count, Max Severity, Has Chest Pain/Breathlessness/Fever/Headache/Fatigue/Freq. Urination | Current symptoms |

### Training Data

Synthetic dataset (6000 patients) with **realistic noise**:
- **6% missing values** in continuous features (simulates incomplete records)
- **4-5% label noise** (simulates misdiagnosis/ambiguity)
- **Measurement outliers** (~2%, simulates device errors)
- **Bimodal glucose** distribution (normal + pre-diabetic clusters)
- **Correlated risk factors** (smokers more likely to drink)
- **Weaker signal-to-noise** ratios than textbook examples

**Expected AUC: 0.78–0.88** (realistic, not 1.0)

### Training

```bash
pip install xgboost shap scikit-learn
python scripts/train_risk_models.py    # ~15 seconds
```

---

## Authentication

Simple username + password (SHA-256 hashed). No JWT tokens — stateless session via patient_id stored client-side.

```text
POST /api/v1/auth/register  →  { username, password, name, age, sex, ... }
POST /api/v1/auth/login     →  { username, password }
Response: { patient_id, username, name, message }
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| POST | `/patients` | Create patient (legacy) |
| GET | `/patients/{id}` | Get patient details |
| GET | `/patients/{id}/sessions` | Assessment history |
| POST | `/assess` | Full assessment (symptoms + ML risk + health status) |
| POST | `/risk` | Standalone ML risk prediction |
| GET | `/risk/status` | Check if ML models are loaded |
| POST | `/patients/{id}/chat` | AI health chatbot |
| GET/POST | `/patients/{id}/profile` | Patient profile (lifestyle) |
| GET/POST | `/patients/{id}/records` | Medical records CRUD |
| GET | `/patients/{id}/health-data/latest` | Latest wearable vitals |
| GET | `/aqi?location=...` | Air quality index |

---

## Running

```bash
# 1. Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic apscheduler requests python-docx PyPDF2

# 2. Set up environment
echo AI_API_KEY=your_key > .env
echo AQI_API_KEY=your_key >> .env

# 3. Train ML models (optional, system works without them)
pip install xgboost shap scikit-learn
python scripts/train_risk_models.py

# 4. Start server
uvicorn app.main:app --reload --port 8000

# 5. API docs
open http://localhost:8000/docs
```
