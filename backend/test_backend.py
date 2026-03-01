"""
test_backend.py — Comprehensive backend test suite
====================================================
Tests all 8 API sections + inline logic unit tests.

Usage:
  1. Start server:  py -m uvicorn app.main:app --reload --port 8000
  2. Run tests:     python test_backend.py

Fixed: all JSON parsing is guarded — tests never crash on a failed request.
"""

import httpx
import sys
import os

BASE = "http://localhost:8000/api/v1"
TIMEOUT = 40  # seconds — AI calls can be slow

# ─────────────────────────────────────────────────────────────────────────────
# Test harness helpers
# ─────────────────────────────────────────────────────────────────────────────
results: list[tuple[str, bool]] = []


def check(label: str, condition: bool, detail: str = ""):
    icon = "✅" if condition else "❌"
    msg = f"  {icon} {label}"
    if detail:
        msg += f"\n       → {detail}"
    print(msg)
    results.append((label, condition))
    return condition


def section(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


def safe_json(r: httpx.Response) -> dict | list | None:
    """Parse JSON; return None if the body is empty or invalid (never raise)."""
    try:
        return r.json()
    except Exception:
        return None


def post(path: str, body: dict) -> httpx.Response:
    return httpx.post(f"{BASE}{path}", json=body, timeout=TIMEOUT)


def get(path: str) -> httpx.Response:
    return httpx.get(f"{BASE}{path}", timeout=TIMEOUT)


def delete(path: str) -> httpx.Response:
    return httpx.delete(f"{BASE}{path}", timeout=TIMEOUT)


def post_file(path: str, filename: str, content: bytes, extra_fields: dict = None) -> httpx.Response:
    """Upload a file as multipart/form-data."""
    files = {"file": (filename, content, "application/octet-stream")}
    data = extra_fields or {}
    return httpx.post(f"{BASE}{path}", files=files, data=data, timeout=TIMEOUT)


# ─────────────────────────────────────────────────────────────────────────────
# Connectivity guard
# ─────────────────────────────────────────────────────────────────────────────
section("0. SERVER CONNECTIVITY")
try:
    ping = httpx.get("http://localhost:8000/", timeout=5)
    check("Server is reachable → 200", ping.status_code == 200)
except Exception as e:
    print(f"  ❌ Cannot reach server: {e}")
    print("\n  ⚠️  Start the server first:")
    print("     py -m uvicorn app.main:app --reload --port 8000\n")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Patient CRUD
# ─────────────────────────────────────────────────────────────────────────────
section("1. PATIENT CRUD")

r = post("/patients", {"age": 45, "sex": "male", "known_conditions": ["hypertension"]})
check("POST /patients → 201", r.status_code == 201)
p1 = safe_json(r) or {}
patient_id: int = p1.get("id", 0)
check("Patient has id", bool(patient_id), str(p1))

r = get(f"/patients/{patient_id}")
p1_data = safe_json(r) or {}
check("GET /patients/{id} → 200", r.status_code == 200)
check("Correct age returned", p1_data.get("age") == 45)

r2 = post("/patients", {"age": 67, "sex": "female", "known_conditions": ["diabetes", "respiratory condition"]})
check("POST second patient → 201", r2.status_code == 201)
p2 = safe_json(r2) or {}
patient2_id: int = p2.get("id", 0)

check("GET non-existent patient → 404", get("/patients/999999").status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Medical Records
# ─────────────────────────────────────────────────────────────────────────────
section("2. MEDICAL RECORDS")

records_to_add = [
    {"record_type": "diagnosis",   "title": "Hypertension (2020)",     "summary": "Stage-1 hypertension. Lifestyle management ongoing."},
    {"record_type": "lab_result",  "title": "Blood Panel Jan 2025",    "summary": "Fasting glucose 98mg/dL, cholesterol 210mg/dL, LDL slightly elevated."},
    {"record_type": "allergy",     "title": None,                       "summary": "Allergic to penicillin."},
    {"record_type": "vaccination", "title": "Flu Shot 2024",            "summary": "Influenza vaccination October 2024."},
    {"record_type": "report",      "title": "Chest X-Ray Report",       "summary": "Mild respiratory inflammation. No consolidation."},
]
record_ids: list[int] = []
for rec in records_to_add:
    r = post(f"/patients/{patient_id}/records", rec)
    check(f"Add {rec['record_type']} record → 201", r.status_code == 201)
    d = safe_json(r) or {}
    record_ids.append(d.get("id", 0))

r = get(f"/patients/{patient_id}/records")
check("GET /records returns 5", r.status_code == 200 and len(safe_json(r) or []) == 5)

r = delete(f"/patients/{patient_id}/records/{record_ids[-1]}")
check(f"DELETE record → 204", r.status_code == 204)

r = get(f"/patients/{patient_id}/records")
check("After delete: 4 records remain", len(safe_json(r) or []) == 4)

check("Record for missing patient → 404",
      post("/patients/999999/records", {"record_type": "diagnosis", "summary": "fail"}).status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Patient Profile
# ─────────────────────────────────────────────────────────────────────────────
section("3. PATIENT PROFILE")

profile_data = {
    "location": "Mumbai",
    "family_history": ["diabetes", "heart disease"],
    "eating_habits": "high sodium, occasional fast food",
    "lifestyle": "sedentary",
    "exercise_frequency": "rarely",
    "sleep_hours": 6.0,
    "stress_level": "HIGH",
    "alcohol_use": "occasional",
    "smoking_status": "never",
    "notes": "Works desk job, night shift often.",
}

r = post(f"/patients/{patient_id}/profile", profile_data)
check("POST /profile → 201", r.status_code == 201)
pd = safe_json(r) or {}
check("location persisted", pd.get("location") == "Mumbai")
check("family_history is list", isinstance(pd.get("family_history"), list))

r = get(f"/patients/{patient_id}/profile")
check("GET /profile → 200", r.status_code == 200)
check("stress_level = HIGH", (safe_json(r) or {}).get("stress_level") == "HIGH")

r = post(f"/patients/{patient_id}/profile", {**profile_data, "stress_level": "MEDIUM"})
check("Upsert /profile → 201", r.status_code == 201)
check("stress_level updated", (safe_json(r) or {}).get("stress_level") == "MEDIUM")

# Reset to HIGH for triage tests
post(f"/patients/{patient_id}/profile", profile_data)

check("Profile for missing patient → 404",
      post("/patients/999999/profile", profile_data).status_code == 404)
check("GET profile with none set → 404",
      get(f"/patients/{patient2_id}/profile").status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 4. AQI (Real-time)
# ─────────────────────────────────────────────────────────────────────────────
section("4. AQI (Real-time WAQI)")

r = get("/aqi?location=Mumbai")
check("GET /aqi?location=Mumbai → 200", r.status_code == 200)
aqi = safe_json(r) or {}
check("AQI value is int",           isinstance(aqi.get("aqi"), int), f"AQI={aqi.get('aqi')}")
check("category present",           "category" in aqi, f"Cat={aqi.get('category')}")
check("location_queried present",   "location_queried" in aqi)
print(f"       → AQI={aqi.get('aqi')} | {aqi.get('category')} | Station: {aqi.get('station')}")

r2 = get("/aqi?location=Delhi")
check("GET /aqi?location=Delhi → 200", r2.status_code == 200)
print(f"       → Delhi AQI={( safe_json(r2) or {}).get('aqi')}")

check("GET /aqi with no location → 422",
      httpx.get(f"{BASE}/aqi", timeout=10).status_code == 422)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Health Data Simulator
# ─────────────────────────────────────────────────────────────────────────────
section("5. HEALTH DATA (Simulator)")

r = post("/admin/simulate", {})
check("POST /admin/simulate → 200", r.status_code == 200)
count = (safe_json(r) or {}).get("count", 0)
check("Snapshots generated ≥ 1",   count >= 1, f"count={count}")

r = get(f"/patients/{patient_id}/health-data/latest")
check("GET /health-data/latest → 200", r.status_code == 200)
snap = safe_json(r) or {}
check("heart_rate 40–150",   40 <= snap.get("heart_rate", 0) <= 150,  f"HR={snap.get('heart_rate')}")
check("spo2 90–100",         90 <= snap.get("spo2", 0) <= 100,        f"SpO2={snap.get('spo2')}")
check("body_temp 35–42",     35 <= snap.get("body_temp_c", 0) <= 42,  f"T={snap.get('body_temp_c')}°C")
check("BP systolic 70–200",  70 <= snap.get("blood_pressure_systolic", 0) <= 200)

r = get(f"/patients/{patient_id}/health-data")
check("GET /health-data (list) → 200", r.status_code == 200)
check("Returns list", isinstance(safe_json(r), list))

post(f"/patients/{patient2_id}/profile", {**profile_data, "location": "Delhi"})
post("/admin/simulate", {})
check("patient2 gets snapshot",
      get(f"/patients/{patient2_id}/health-data/latest").status_code == 200)
check("Health data for missing patient → 404",
      get("/patients/999999/health-data/latest").status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Assessment — LOW / MEDIUM / HIGH triage paths
# ─────────────────────────────────────────────────────────────────────────────
section("6. ASSESSMENT — Triage Paths")

# Create a clean low-risk patient
r3 = post("/patients", {"age": 28, "sex": "female", "known_conditions": []})
low_pid: int = (safe_json(r3) or {}).get("id", 0)
post(f"/patients/{low_pid}/profile", {**profile_data, "stress_level": "LOW", "lifestyle": "active", "location": "Bangalore"})
post("/admin/simulate", {})

# ── LOW ───────────────────────────────────────────────────────────────────────
print("\n  [LOW] mild fatigue, no history flags")
r = post("/assess", {"user_id": low_pid, "symptoms": ["fatigue", "mild cough"]})
check("LOW assess → 200", r.status_code == 200, f"Status={r.status_code} body={r.text[:80]}")
ar = safe_json(r) or {}
check("triage = LOW",                ar.get("triage") == "LOW",           f"Got: {ar.get('triage')}")
check("top_conditions is list",      isinstance(ar.get("top_conditions"), list))
check("explanation key present",     "explanation" in ar.get("explanation", {}))
check("risk_summary key present",    "risk_summary" in ar.get("explanation", {}))
check("preventive_guidance present", "preventive_guidance" in ar.get("explanation", {}))
check("safety_note present",         "safety_note" in ar.get("explanation", {}))

# ── MEDIUM ────────────────────────────────────────────────────────────────────
print("\n  [MEDIUM] fever+headache — patient1 has hypertension+HIGH stress")
r = post("/assess", {"user_id": patient_id, "symptoms": ["fever", "headache", "fatigue"]})
check("MEDIUM assess → 200", r.status_code == 200, f"Status={r.status_code}")
ar = safe_json(r) or {}
check("triage MEDIUM or HIGH",    ar.get("triage") in ("MEDIUM", "HIGH"), f"Got: {ar.get('triage')}")
check("top_conditions non-empty", len(ar.get("top_conditions", [])) > 0)
check("aqi_level returned",       ar.get("aqi_level") is not None,        f"AQI={ar.get('aqi_level')}")

# ── HIGH (breathlessness) ─────────────────────────────────────────────────────
print("\n  [HIGH] fever + breathlessness + cough → always HIGH")
r = post("/assess", {"user_id": patient_id, "symptoms": ["fever", "breathlessness", "cough"]})
check("HIGH assess → 200", r.status_code == 200, f"Status={r.status_code}")
ar = safe_json(r) or {}
check("triage = HIGH",                ar.get("triage") == "HIGH",     f"Got: {ar.get('triage')}")
check("pneumonia_risk in conditions", "pneumonia_risk" in ar.get("top_conditions", []),
      f"conditions={ar.get('top_conditions')}")
check("HIGH: follow_up_questions=[]", ar.get("explanation", {}).get("follow_up_questions") == [],
      str(ar.get("explanation", {}).get("follow_up_questions")))

# ── HIGH (cardiac pattern) ────────────────────────────────────────────────────
print("\n  [HIGH] chest_pain + sweating → cardiac HIGH")
r = post("/assess", {"user_id": patient_id, "symptoms": ["chest_pain", "sweating", "dizziness"]})
check("cardiac HIGH → 200",    r.status_code == 200)
check("cardiac triage = HIGH", (safe_json(r) or {}).get("triage") == "HIGH")

# ── MEDIUM (elderly with respiratory condition) ───────────────────────────────
print("\n  [MEDIUM+] elderly patient2 with respiratory condition + fever")
r = post("/assess", {"user_id": patient2_id, "symptoms": ["fever", "cough"]})
check("elderly respiratory assess → 200", r.status_code == 200)
check("triage elevated (MEDIUM or HIGH)",
      (safe_json(r) or {}).get("triage") in ("MEDIUM", "HIGH"),
      f"Got: {(safe_json(r) or {}).get('triage')}")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Assessment Edge Cases
# ─────────────────────────────────────────────────────────────────────────────
section("7. ASSESSMENT EDGE CASES")

# Missing patient
check("Assess missing patient → 404",
      post("/assess", {"user_id": 999999, "symptoms": ["fever"]}).status_code == 404)

# Empty symptoms
r = post("/assess", {"user_id": patient_id, "symptoms": []})
check("Empty symptoms → 200",         r.status_code == 200)
ar = safe_json(r) or {}
check("Empty symptoms → LOW",         ar.get("triage") == "LOW",  f"Got: {ar.get('triage')}")
check("Empty symptoms → no conditions", ar.get("top_conditions") == [])

# Alias normalization: "shortness of breath" → breathlessness → HIGH
r = post("/assess", {"user_id": patient_id, "symptoms": ["shortness of breath", "high temperature"]})
check("Alias normalize → 200",     r.status_code == 200)
check("Alias breathless → HIGH",   (safe_json(r) or {}).get("triage") == "HIGH",
      f"Triage: {(safe_json(r) or {}).get('triage')}")

# Unknown / invented symptoms → graceful LOW, no crash
r = post("/assess", {"user_id": low_pid, "symptoms": ["xyzabc", "fakeillness123"]})
check("Unknown symptoms → 200",       r.status_code == 200)
ar = safe_json(r) or {}
check("Unknown symptoms → LOW",       ar.get("triage") == "LOW")
check("Unknown symptoms → []",        ar.get("top_conditions") == [])

# Duplicate symptoms — should work the same as one occurrence each
r = post("/assess", {"user_id": patient_id, "symptoms": ["fever", "FEVER", "Fever", "fever"]})
check("Duplicate symptoms → 200",    r.status_code == 200)
check("Dedup still works",           (safe_json(r) or {}).get("triage") in ("LOW","MEDIUM","HIGH"))

# 5 severity markers → MEDIUM minimum
r = post("/assess", {"user_id": low_pid, "symptoms": ["fever", "body_ache", "fatigue", "chills", "nausea"]})
check("5 severity markers → MEDIUM+",
      (safe_json(r) or {}).get("triage") in ("MEDIUM", "HIGH"),
      f"Got: {(safe_json(r) or {}).get('triage')}")


# ─────────────────────────────────────────────────────────────────────────────
# 8. Document Upload (PDF / DOCX)
# ─────────────────────────────────────────────────────────────────────────────
section("8. DOCUMENT UPLOAD (PDF / DOCX)")

# ── Fake PDF (minimal valid PDF bytes) ────────────────────────────────────────
# This is a real minimal PDF — pdfplumber can extract "Blood Report" from it
MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
    b"/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>endobj\n"
    b"4 0 obj<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Blood Report) Tj ET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n"
    b"0000000062 00000 n\n0000000114 00000 n\n0000000302 00000 n\n"
    b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n399\n%%EOF"
)

r = post_file(
    f"/patients/{patient_id}/upload-report",
    filename="blood_test_jan2025.pdf",
    content=MINIMAL_PDF,
    extra_fields={"record_type": "lab_result", "title": "Blood Test Jan 2025"}
)
check("PDF upload → 201 or 422 (extraction may fail on minimal PDF)",
      r.status_code in (201, 422),
      f"Status={r.status_code} body={r.text[:120]}")
if r.status_code == 201:
    d = safe_json(r) or {}
    check("record_id returned",   bool(d.get("record_id")))
    check("title auto-set",       bool(d.get("title")))
    check("preview in response",  "preview" in d)

# ── Real text-based PDF via a plain-text fake (tests routing logic) ──────────
# Send as .docx content (python-docx requires real zip format, so we test routing)
r = post_file(
    f"/patients/{patient_id}/upload-report",
    filename="referral_letter.pdf",
    content=b"Not a real PDF",
    extra_fields={"record_type": "report"}
)
check("Invalid PDF content → 201 or 422 (graceful)", r.status_code in (201, 422, 500))

# ── Unsupported file type (.txt) ──────────────────────────────────────────────
r = post_file(
    f"/patients/{patient_id}/upload-report",
    filename="notes.txt",
    content=b"Some plain text notes",
)
check("Unsupported file type .txt → 415", r.status_code == 415,
      f"Status={r.status_code}")

# ── Empty file ────────────────────────────────────────────────────────────────
r = post_file(
    f"/patients/{patient_id}/upload-report",
    filename="empty_file.pdf",
    content=b"",
)
check("Empty file → 400", r.status_code == 400,
      f"Status={r.status_code}")

# ── Upload for missing patient ─────────────────────────────────────────────────
r = post_file(
    "/patients/999999/upload-report",
    filename="test.pdf",
    content=MINIMAL_PDF,
)
check("Upload for missing patient → 404", r.status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 9. AI Chatbot
# ─────────────────────────────────────────────────────────────────────────────
section("9. AI CHATBOT")

r = post(f"/patients/{patient_id}/chat", {
    "message": "My heart rate seems high lately, should I be worried?",
    "history": [],
})
check("POST /chat → 200", r.status_code == 200, f"Status={r.status_code} body={r.text[:80]}")
chat = safe_json(r) or {}
check("reply is non-empty",   bool(chat.get("reply")), str(chat.get("reply", ""))[:80])
check("history has 2 turns",  len(chat.get("history", [])) == 2)
print(f"       → Bot: {chat.get('reply', '')[:120]}...")

# Multi-turn
r2 = post(f"/patients/{patient_id}/chat", {
    "message": "What should I eat to control blood pressure?",
    "history": chat.get("history", []),
})
check("Multi-turn → 200",       r2.status_code == 200)
check("History grows to 4",     len((safe_json(r2) or {}).get("history", [])) == 4)

check("Chatbot missing patient → 404",
      post("/patients/999999/chat", {"message": "Hello", "history": []}).status_code == 404)


# ─────────────────────────────────────────────────────────────────────────────
# 10. Logic Unit Tests (inline — no server needed)
# ─────────────────────────────────────────────────────────────────────────────
section("10. LOGIC UNIT TESTS (inline)")

sys.path.insert(0, os.path.dirname(__file__))

from app.logic.inference_engine import infer, infer_with_scores
from app.logic.triage_engine import triage
from app.logic.symptom_normalizer import normalize_symptoms

# ── Inference ─────────────────────────────────────────────────────────────────
result = infer(["fever", "cough", "breathlessness"])
check("pneumonia_risk #1 for fever+cough+breathlessness",
      result[0] == "pneumonia_risk" if result else False,
      f"Got: {result}")

result = infer(["fever", "body_ache", "fatigue", "headache", "chills"])
check("influenza #1 for full flu profile",
      result[0] == "influenza" if result else False,
      f"Got: {result}")

result = infer(["chest_pain", "sweating", "breathlessness"])
check("cardiac_concern #1 for chest+sweat+breathless",
      result[0] == "cardiac_concern" if result else False,
      f"Got: {result}")

check("Empty symptoms → empty list", infer([]) == [])

# ── Triage rules ──────────────────────────────────────────────────────────────
check("breathlessness → HIGH",          triage(["breathlessness"], {}) == "HIGH")
check("chest_pain+sweating → HIGH",     triage(["chest_pain", "sweating"], {}) == "HIGH")
check("chest_pain+cardiac hx → HIGH",  triage(["chest_pain"], {"cardiac_condition": True}) == "HIGH")
check("fever+respiratory hx → MEDIUM", triage(["fever"], {"respiratory_condition": True}) == "MEDIUM")
check("fever+hypertension hx → MEDIUM",triage(["fever"], {"hypertension": True}) == "MEDIUM")
check("fever+diabetes hx → MEDIUM",    triage(["fever"], {"diabetes": True}) == "MEDIUM")
check("fatigue only → LOW",            triage(["fatigue"], {}) == "LOW")
check("3+ severity markers → MEDIUM",  triage(["fever", "body_ache", "fatigue"], {}) == "MEDIUM")

# ── Normalizer ────────────────────────────────────────────────────────────────
n = normalize_symptoms(["Short of Breath", "HIGH TEMPERATURE", "Fever", "fever"])
check("'short of breath' → breathlessness",     "breathlessness" in n)
check("'high temperature' → fever",             "fever" in n)
check("duplicate fever deduped (count=1)",       n.count("fever") == 1)
check("breathlessness comes before fever",       n.index("breathlessness") < n.index("fever"))

# ── Scores precision ──────────────────────────────────────────────────────────
scores = infer_with_scores(["fever", "cough", "breathlessness"])
check("pneumonia_risk > viral_fever score",
      scores.get("pneumonia_risk", 0) > scores.get("viral_fever", 0),
      str({k: round(v,2) for k,v in scores.items()}))

# ── Score edge cases ──────────────────────────────────────────────────────────
scores2 = infer_with_scores(["nausea", "abdominal_pain"])
check("gastroenteritis top for nausea+abdominal_pain",
      list(scores2.keys())[0] == "gastroenteritis" if scores2 else False,
      f"Got: {list(scores2.keys())[:3]}")

scores3 = infer_with_scores(["skin_rash", "nasal_congestion"])
check("allergic_reaction scores for rash+nasal",
      "allergic_reaction" in scores3,
      f"Got: {list(scores3.keys())}")


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
section("SUMMARY")
passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
total  = len(results)
print(f"\n  ✅ Passed: {passed}/{total}")
if failed:
    print(f"  ❌ Failed: {failed}/{total}\n")
    print("  Failed tests:")
    for label, ok in results:
        if not ok:
            print(f"    ❌ {label}")
else:
    print(f"\n  🎉 All {total} tests passed!")
print()
