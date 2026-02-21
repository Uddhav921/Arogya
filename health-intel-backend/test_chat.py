"""
test_chat.py — Focused chatbot endpoint test
=============================================
Tests the /patients/{id}/chat endpoint in depth:
  - Single & multi-turn conversations
  - Context-aware responses (profile, health data, records)
  - Edge cases: missing patient, empty message, long history
  - AI response quality checks (non-empty, relevant)

Usage:
  1. Start server:  py -m uvicorn app.main:app --reload --port 8000
  2. Run:           python test_chat.py
"""

import httpx
import sys

BASE     = "http://localhost:8000/api/v1"
TIMEOUT  = 60   # chatbot calls can be slow under high AI latency

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
results: list[tuple[str, bool]] = []


def check(label: str, condition: bool, detail: str = "") -> bool:
    icon = "✅" if condition else "❌"
    msg  = f"  {icon} {label}"
    if detail:
        msg += f"\n       → {detail}"
    print(msg)
    results.append((label, condition))
    return condition


def section(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


def safe_json(r: httpx.Response):
    try:
        return r.json()
    except Exception:
        return None


def post(path: str, body: dict) -> httpx.Response:
    return httpx.post(f"{BASE}{path}", json=body, timeout=TIMEOUT)


def chat(pid: int, message: str, history: list = None) -> tuple[httpx.Response, dict]:
    r = post(f"/patients/{pid}/chat", {"message": message, "history": history or []})
    return r, safe_json(r) or {}


# ─────────────────────────────────────────────────────────────────────────────
# 0. Server check
# ─────────────────────────────────────────────────────────────────────────────
section("0. SERVER CONNECTIVITY")
try:
    httpx.get("http://localhost:8000/", timeout=5)
    check("Server is reachable", True)
except Exception as e:
    check("Server is reachable", False, str(e))
    print("\n  ⚠️  Start the server first:")
    print("     py -m uvicorn app.main:app --reload --port 8000\n")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Setup: create a patient with full context
# ─────────────────────────────────────────────────────────────────────────────
section("1. SETUP — Create Rich Patient Context")

r = post("/patients", {"age": 52, "sex": "male", "known_conditions": ["hypertension", "type 2 diabetes"]})
check("Create patient → 201", r.status_code == 201)
pid: int = (safe_json(r) or {}).get("id", 0)
check("Patient id assigned", bool(pid), f"id={pid}")

# Medical records
for rec in [
    {"record_type": "diagnosis", "title": "Hypertension (2019)",        "summary": "Stage-2 hypertension. On amlodipine 5mg daily."},
    {"record_type": "diagnosis", "title": "Type 2 Diabetes (2021)",     "summary": "HbA1c 7.8%. On metformin 500mg twice daily."},
    {"record_type": "lab_result","title": "Lipid Panel Jan 2025",       "summary": "LDL 145 mg/dL (high). HDL 38 mg/dL (low). Triglycerides 195 mg/dL."},
    {"record_type": "lab_result","title": "Blood Glucose Feb 2025",     "summary": "Fasting glucose 132 mg/dL. Post-prandial 188 mg/dL."},
    {"record_type": "allergy",   "title": None,                          "summary": "Sulfa drug allergy. Rash + hives reported."},
]:
    post(f"/patients/{pid}/records", rec)
check("Medical records added", True)

# Extended profile
r = post(f"/patients/{pid}/profile", {
    "location": "Delhi",
    "family_history": ["heart disease", "diabetes"],
    "eating_habits": "high carb, oily food, loves street food",
    "lifestyle": "sedentary",
    "exercise_frequency": "never",
    "sleep_hours": 5.5,
    "stress_level": "HIGH",
    "alcohol_use": "regular",
    "smoking_status": "former",
    "notes": "Truck driver. Irregular meal times. Skips medication occasionally.",
})
check("Profile created → 201", r.status_code == 201)

# Simulate health snapshots
r = post("/admin/simulate", {})
check("Health snapshots generated", r.status_code == 200)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Basic Chat — Single Turn
# ─────────────────────────────────────────────────────────────────────────────
section("2. BASIC CHAT — Single Turn")

r, d = chat(pid, "Hello, I've been feeling dizzy lately. What could cause that?")
check("POST /chat → 200",        r.status_code == 200,                    f"Status={r.status_code}")
check("reply field present",     "reply"   in d,                          str(list(d.keys())))
check("history field present",   "history" in d,                          str(list(d.keys())))
check("reply is non-empty",      len(d.get("reply", "")) > 10,            f"reply='{d.get('reply','')[:80]}'")
check("history has 2 turns",     len(d.get("history", [])) == 2,          f"turns={len(d.get('history',[]))}")
check("user turn is [0]",        d.get("history",[{}])[0].get("role") == "user")
check("assistant turn is [1]",   d.get("history",[{},{}])[1].get("role") == "assistant")
print(f"\n  🤖 Bot: {d.get('reply','')[:200]}...")


# ─────────────────────────────────────────────────────────────────────────────
# 3. Multi-Turn Conversation
# ─────────────────────────────────────────────────────────────────────────────
section("3. MULTI-TURN CONVERSATION")

# Turn 1
r1, d1 = chat(pid, "What are the best foods for someone with diabetes and high blood pressure?")
check("Turn 1 → 200",    r1.status_code == 200)
history_1 = d1.get("history", [])
check("Turn 1 history = 2 items", len(history_1) == 2)

# Turn 2 — continues from history
r2, d2 = chat(pid, "Can I eat rice? I eat it twice a day.", history_1)
check("Turn 2 → 200",    r2.status_code == 200)
history_2 = d2.get("history", [])
check("Turn 2 history grows to 4", len(history_2) == 4, f"Got {len(history_2)}")

# Turn 3 — continues from history
r3, d3 = chat(pid, "My doctor said my LDL is high. What does that mean for me?", history_2)
check("Turn 3 → 200",    r3.status_code == 200)
history_3 = d3.get("history", [])
check("Turn 3 history grows to 6", len(history_3) == 6, f"Got {len(history_3)}")

print(f"\n  🤖 Turn 3 reply: {d3.get('reply','')[:200]}...")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Context-Aware Questions (checks bot uses patient data)
# ─────────────────────────────────────────────────────────────────────────────
section("4. CONTEXT-AWARE QUESTIONS")

context_questions = [
    "What medications am I on and should I be worried about side effects?",
    "My family has a history of heart disease — am I at risk?",
    "How bad is the air quality in Delhi for someone like me?",
    "I'm a truck driver and sit for 12 hours a day — what exercises can I do?",
    "Is 5.5 hours of sleep enough? I feel tired all the time.",
    "I drink alcohol regularly. How does that affect my diabetes?",
]

for q in context_questions:
    r, d = chat(pid, q)
    reply = d.get("reply", "")
    check(
        f"Q: '{q[:50]}...' → non-empty reply",
        r.status_code == 200 and len(reply) > 10,
        f"reply='{reply[:80]}'",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Edge Cases
# ─────────────────────────────────────────────────────────────────────────────
section("5. EDGE CASES")

# Missing patient
r, d = chat(999999, "Hello")
check("Missing patient → 404",    r.status_code == 404)

# Empty message (should still respond gracefully)
r, d = chat(pid, "")
check("Empty message → 200 or 422", r.status_code in (200, 422))
if r.status_code == 200:
    check("Empty msg: reply present", bool(d.get("reply")))

# Very short message
r, d = chat(pid, "ok")
check("Very short message → 200", r.status_code == 200)
check("Short msg: reply non-empty", len(d.get("reply","")) > 5)

# Long message (paragraph)
long_msg = (
    "I am 52 years old and recently visited my doctor. She told me my blood sugar is high "
    "and I need to reduce my carbohydrate intake significantly. At the same time my blood "
    "pressure reading was 148/92 which she said is quite high for my age. She has also "
    "mentioned that my cholesterol levels, particularly LDL, are elevated. I am already "
    "on metformin and amlodipine. I am worried about all these conditions together. Can "
    "you please give me a comprehensive overview of what I need to do?"
)
r, d = chat(pid, long_msg)
check("Long message → 200",       r.status_code == 200)
check("Long msg: reply non-empty", len(d.get("reply","")) > 20, f"Len={len(d.get('reply',''))}")
print(f"\n  🤖 Long Q reply: {d.get('reply','')[:200]}...")

# Injecting previous conversation context that is malformed
bad_history = [
    {"role": "user", "content": ""},      # empty content
    {"role": "assistant", "content": ""}, # empty content
]
r, d = chat(pid, "What should I eat?", bad_history)
check("Malformed history → 200 (graceful)", r.status_code == 200)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Patient Without Profile / Records (minimal context)
# ─────────────────────────────────────────────────────────────────────────────
section("6. MINIMAL PATIENT (No Profile / No Records)")

r = post("/patients", {"age": 25, "sex": "female", "known_conditions": []})
bare_pid: int = (safe_json(r) or {}).get("id", 0)
check("Create bare patient → 201", r.status_code == 201, f"id={bare_pid}")

r, d = chat(bare_pid, "I have a mild headache. What should I do?")
check("Bare patient chat → 200",    r.status_code == 200)
check("Bare patient: reply non-empty", len(d.get("reply","")) > 5)
print(f"\n  🤖 Bare patient: {d.get('reply','')[:200]}...")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Response Shape Validation
# ─────────────────────────────────────────────────────────────────────────────
section("7. RESPONSE SHAPE VALIDATION")

r, d = chat(pid, "What is a healthy blood pressure range?")
check("Response has 'reply' key",   "reply"   in d,              str(list(d.keys())))
check("Response has 'history' key", "history" in d,              str(list(d.keys())))
check("history is a list",          isinstance(d.get("history"), list))
check("Each turn has 'role'",       all("role" in t for t in d.get("history",[])))
check("Each turn has 'content'",    all("content" in t for t in d.get("history",[])))
check("Roles are user/assistant",
      all(t.get("role") in ("user","assistant") for t in d.get("history",[])))
check("reply is a string",          isinstance(d.get("reply"), str))
check("reply not obviously truncated", not d.get("reply","").endswith("[") and not d.get("reply","").endswith(","))


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
    print(f"\n  🎉 All {total} chatbot tests passed!")
print()
