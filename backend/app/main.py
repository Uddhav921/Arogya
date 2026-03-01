from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db, SessionLocal
from app.api import patient, records, assessment, profile, aqi, health_data, chatbot, documents, risk, auth

app = FastAPI(
    title="Health Intel Backend",
    description=(
        "A preventive health intelligence backend. "
        "Deterministic reasoning (graphs + rules) + z.ai for plain-language explanation. "
        "Features: symptom assessment, AQI integration, real-time health data simulation, "
        "medical records, extended patient profiles, and an AI health chatbot."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(patient.router,     prefix=API_PREFIX)
app.include_router(records.router,     prefix=API_PREFIX)
app.include_router(profile.router,     prefix=API_PREFIX)
app.include_router(health_data.router, prefix=API_PREFIX)
app.include_router(assessment.router,  prefix=API_PREFIX)
app.include_router(chatbot.router,     prefix=API_PREFIX)
app.include_router(aqi.router,         prefix=API_PREFIX)
app.include_router(documents.router,   prefix=API_PREFIX)
app.include_router(risk.router,        prefix=API_PREFIX)
app.include_router(auth.router,        prefix=API_PREFIX)


# ── APScheduler: hourly health data simulator ─────────────────────────────────
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.health_simulator import run_simulator

scheduler = BackgroundScheduler()


def _scheduled_simulator_job():
    """Run the health simulator for all patients. Called hourly."""
    db = SessionLocal()
    try:
        count = run_simulator(db)
        print(f"[Simulator] Generated {count} health snapshots.")
    finally:
        db.close()


scheduler.add_job(_scheduled_simulator_job, "interval", hours=1, id="health_simulator")


@app.on_event("startup")
def on_startup():
    init_db()

    # Seed demo patient on fresh deployments (e.g. Railway with blank DB)
    from app.db.seeder import seed_demo_data
    seed_db = SessionLocal()
    try:
        seeded = seed_demo_data(seed_db)
        if seeded:
            print("[Startup] Demo patient seeded — fresh database detected.")
    finally:
        seed_db.close()

    # ML model availability check
    from app.ml.predictor import models_available, MODEL_DIR
    if models_available():
        print(f"[ML] ✅ Models loaded from {MODEL_DIR}")
    else:
        print(f"[ML] ❌ No models found at {MODEL_DIR} — risk prediction disabled!")

    # Run simulator once immediately on startup so data is available right away
    _scheduled_simulator_job()
    scheduler.start()
    print("[Startup] DB initialized. Scheduler started. Initial snapshots generated.")


@app.on_event("shutdown")
def on_shutdown():
    scheduler.shutdown(wait=False)


# ── Admin routes ──────────────────────────────────────────────────────────────
from fastapi import APIRouter
admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.post("/simulate")
def trigger_simulation():
    """
    Manually trigger a health data simulation run for all patients.
    Useful for testing without waiting for the hourly scheduler.
    """
    db = SessionLocal()
    try:
        count = run_simulator(db)
        return {"message": f"Generated {count} health snapshots.", "count": count}
    finally:
        db.close()


app.include_router(admin_router, prefix=API_PREFIX)


@app.get("/", tags=["health"])
def root():
    return {
        "status": "ok",
        "service": "arogya-backend",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "patients":     f"{API_PREFIX}/patients",
            "records":      f"{API_PREFIX}/patients/{{id}}/records",
            "profile":      f"{API_PREFIX}/patients/{{id}}/profile",
            "health_data":  f"{API_PREFIX}/patients/{{id}}/health-data",
            "assess":       f"{API_PREFIX}/assess",
            "chat":         f"{API_PREFIX}/patients/{{id}}/chat",
            "aqi":          f"{API_PREFIX}/aqi",
            "upload_report":  f"{API_PREFIX}/patients/{{id}}/upload-report",
        },
    }
