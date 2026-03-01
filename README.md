# Arogya

Arogya is an AI-powered health intelligence platform that enables users to evaluate their symptoms, review potential health risks, and manage their medical history. 

This project contains two main modules:
1. `backend/`: FastAPI-based backend that handles inference, long-term health memory (via SQLite), and integrations with AI models.
2. `frontend/`: React & Next.js frontend UI for user interaction and continuous health risk assessment.

## Getting Started

### Backend
Navigate to the backend directory and resolve Python dependencies:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend
Navigate to the frontend directory and install Node.js dependencies:
```bash
cd frontend
npm install
npm run dev
```

For more specific details, please refer to the READMEs provided in the subdirectories.
