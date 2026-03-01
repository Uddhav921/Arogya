<div align="center">
  <div style="background-color: #09090b; padding: 20px; border-radius: 20px; border: 1px solid #27272a; display: inline-block; margin-bottom: 20px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  </div>
  <h1>Arogya by VAKR</h1>
  <p><strong>A Next-Generation Preventive Health Intelligence Platform</strong></p>
  <p>Combining deterministic medical knowledge, AI explanations, and wearable data integrations for smarter care.</p>
</div>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#core-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## 🚀 Overview

**Arogya by VAKR** is an end-to-end medical assessment platform that transitions health from reactive care to predictive intelligence. Rather than relying purely on stochastic LLMs, Arogya ensures safety by utilizing a **deterministic medical knowledge graph and weighted inference triage engine**, leveraging generative AI purely for context-aware, plain-language patient explanations. 

The entire user experience is wrapped in a highly polished, dark-mode-first semantic layout featuring butter-smooth micro-interactions.

## ✨ Core Features

- **Symptom Assessment**: Deterministic, knowledge-graph-powered evaluation of symptoms.
- **Health Profiles**: Long-term medical context that dynamically adapts the risk inference engine.
- **Arogya AI Chat**: A conversational interface powered by the `Arogya Core` that answers health inquiries strictly based on your secure clinical context.
- **Air Quality Integration**: Factoring in environmental variables (AQI) to predict respiratory exacerbations.
- **Simulated Vitals**: A background engine generating realistic, hourly physiological data (HR, HRV) for predictive assessments.
- **Zero-Trust Local Caching**: Explanations and UI states are handled with privacy in mind.

---

## 🛠️ Tech Stack

### Modern Frontend (Next.js)
- **Framework**: Next.js 16.1 (App Router)
- **UI & Styling**: Tailwind CSS, Semantic Color Variables (Light/Dark mode)
- **Motion**: Framer Motion for 60fps fluid UI transitions
- **Icons**: Lucide React

### Core Backend (FastAPI)
- **Framework**: Python 3.11 + FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **Intelligence**: Knowledge Graph Triage + Arogya AI Inference
- **Simulation**: Background APScheduler for hourly health data

---

## 📦 Getting Started

You can run Arogya locally using standard Python and Node.js tools. 

### 1. Backend Setup

The backend handles the medical reasoning and powers the intelligence API. It must be running for the frontend to work.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start the FastAPI Uvicorn Server
python -m uvicorn app.main:app --reload --port 8000
```
*The API will be accessible at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Frontend Setup

The frontend provides the interactive user dashboard, medical history viewer, and AI chatbot.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```
*The Web App will be accessible at [http://localhost:3000](http://localhost:3000).*

---

## 🛡️ Architecture & Safety Constraints

Arogya is designed around **strict deterministic constraints**:
1. **No AI Diagnostics**: The LLM *never* diagnoses. It explains logic already finalized by the inference graph.
2. **Read-Only Memory**: Medical records shape risk sensitivity but cannot be overwritten by the chatbot or inference engine.
3. **Stateless UI**: The core logic is decoupled into atomic API endpoints, allowing integration with mobile or external IoT platforms.

For more deep-dive specifics on the deterministic inference algorithms, please see the `backend/README.md`.

---

<div align="center">
  <b>Developed with precision and care by VAKR.</b>
</div>
