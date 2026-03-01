const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API = `${BASE_URL}/api/v1`;

// ── Generic helpers ──────────────────────────────────────────────────────────

async function request(method, url, data, isFormData = false) {
  const opts = {
    method,
    headers: isFormData ? {} : { "Content-Type": "application/json" },
  };

  if (data) {
    opts.body = isFormData ? data : JSON.stringify(data);
  }

  const res = await fetch(url, opts);

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err.detail || err.message || errMsg;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  // Some DELETE endpoints return 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

const get  = (url)           => request("GET",    url);
const post = (url, data)     => request("POST",   url, data);
const put  = (url, data)     => request("PUT",    url, data);
const del  = (url)           => request("DELETE", url);

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Register a new patient.
 * @param {{ username, password, name, age, sex, weight_kg, height_cm }} body
 * @returns {{ patient_id: string }}
 */
function register(body) {
  return post(`${API}/auth/register`, body);
}

/**
 * Login an existing patient.
 * @param {{ username, password }} body
 * @returns {{ patient_id: string, patient?: object }}
 */
function login(body) {
  return post(`${API}/auth/login`, body);
}

// ── Patients ─────────────────────────────────────────────────────────────────

function getPatient(patientId) {
  return get(`${API}/patients/${patientId}`);
}

function updatePatient(patientId, body) {
  return put(`${API}/patients/${patientId}`, body);
}

// ── Profile ──────────────────────────────────────────────────────────────────

function getProfile(patientId) {
  return get(`${API}/patients/${patientId}/profile`);
}

function updateProfile(patientId, body) {
  return post(`${API}/patients/${patientId}/profile`, body);
}

// ── Health Data ──────────────────────────────────────────────────────────────

/**
 * Returns the latest health snapshot for a patient.
 */
function getLatestHealth(patientId) {
  return get(`${API}/patients/${patientId}/health-data`);
}

// ── Assessment Sessions ──────────────────────────────────────────────────────

/**
 * Returns the list of past assessment sessions for a patient.
 */
function getSessions(patientId) {
  return get(`${API}/patients/${patientId}/sessions`);
}

/**
 * Run a symptom assessment.
 * @param {string} patientId
 * @param {string[]} symptoms  - Normalised symptom list
 * @param {string}   freeText  - Optional free-text description
 */
function assess(patientId, symptoms, freeText) {
  return post(`${API}/assess`, {
    patient_id: patientId,
    symptoms,
    free_text: freeText || "",
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Send a message to the AI health chatbot.
 * @param {string}   patientId
 * @param {string}   message
 * @param {object[]} history  - Prior conversation history
 * @returns {{ reply: string|object, history: object[] }}
 */
function chat(patientId, message, history = []) {
  return post(`${API}/patients/${patientId}/chat`, { message, history });
}

// ── Medical Records ───────────────────────────────────────────────────────────

function getRecords(patientId) {
  return get(`${API}/patients/${patientId}/records`);
}

/**
 * Add a manual text-based medical record.
 * @param {string} patientId
 * @param {{ record_type, title, summary }} body
 */
function addRecord(patientId, body) {
  return post(`${API}/patients/${patientId}/records`, body);
}

function deleteRecord(patientId, recordId) {
  return del(`${API}/patients/${patientId}/records/${recordId}`);
}

/**
 * Upload a PDF/image report and let the backend OCR/extract it.
 * @param {string} patientId
 * @param {File}   file
 */
function uploadReport(patientId, file) {
  const form = new FormData();
  form.append("file", file);
  return request("POST", `${API}/patients/${patientId}/upload-report`, form, true);
}

// ── Admin / Simulation ───────────────────────────────────────────────────────

function triggerSimulation() {
  return post(`${API}/admin/simulate`, {});
}

// ── Exported API object ──────────────────────────────────────────────────────

export const api = {
  // auth
  register,
  login,

  // patients
  getPatient,
  updatePatient,

  // profile
  getProfile,
  updateProfile,

  // health data
  getLatestHealth,

  // sessions / assessment
  getSessions,
  assess,

  // chat
  chat,

  // records
  getRecords,
  addRecord,
  deleteRecord,
  uploadReport,

  // admin
  triggerSimulation,
};
