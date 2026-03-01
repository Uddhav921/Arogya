"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  Search, Send, Loader2, AlertTriangle, ArrowLeft,
  ChevronRight, Check, Stethoscope, Clock,
  Wind, FileText, UserCircle, Eye,
  Activity, Database, ChevronDown, ChevronUp, List,
} from "lucide-react";

const SYMPTOMS = [
  "Headache", "Dizziness", "Chest pain", "Cough", "Fever",
  "Fatigue", "Nausea", "Joint pain", "Shortness of breath",
  "Back pain", "Sore throat", "Abdominal pain", "Rash",
  "Palpitations", "Blurred vision", "Chills", "Wheezing",
  "Sweating",
];

/* ── safely render any value ── */
function renderValue(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(v => typeof v === "object" ? JSON.stringify(v) : String(v)).join("\n• ");
  if (typeof val === "object") return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n");
  return String(val);
}

function formatExplanation(exp) {
  if (!exp) return null;
  if (typeof exp === "string") return exp;
  if (typeof exp !== "object") return String(exp);
  const keyLabels = { explanation: "Explanation", risk_summary: "Risk Summary", preventive_guidance: "Preventive Guidance", follow_up_questions: "Follow-up Questions", safety_note: "Safety Note", clinical_reasoning: "Clinical Reasoning", assessment: "Assessment", recommendations: "Recommendations", summary: "Summary" };
  const sections = [];
  for (const [key, val] of Object.entries(exp)) {
    if (val == null) continue;
    const label = keyLabels[key] || key.replace(/_/g, " ");
    const text = renderValue(val);
    if (text) sections.push({ label, text });
  }
  return sections;
}

/* ── localStorage for report cache ── */
const REPORT_KEY = (pid) => `aroga_reports_${pid}`;

function saveReport(pid, report) {
  try {
    const stored = JSON.parse(localStorage.getItem(REPORT_KEY(pid)) || "[]");
    stored.unshift({ ...report, _savedAt: new Date().toISOString() });
    // Keep last 20
    localStorage.setItem(REPORT_KEY(pid), JSON.stringify(stored.slice(0, 20)));
  } catch { /* ignore */ }
}

function loadReports(pid) {
  try {
    return JSON.parse(localStorage.getItem(REPORT_KEY(pid)) || "[]");
  } catch { return []; }
}

const triageStyle = {
  LOW:      { bg: "bg-[#34c759]/10", text: "text-[#34c759]", label: "Low Risk",    border: "border-l-[#34c759]", dot: "bg-[#34c759]" },
  MEDIUM:   { bg: "bg-[#ff9500]/10", text: "text-[#ff9500]", label: "Medium Risk", border: "border-l-[#ff9500]", dot: "bg-[#ff9500]" },
  HIGH:     { bg: "bg-[#ff3b30]/10", text: "text-[#ff3b30]", label: "High Risk",   border: "border-l-[#ff3b30]", dot: "bg-[#ff3b30]" },
  CRITICAL: { bg: "bg-[#ff3b30]/15", text: "text-[#ff3b30]", label: "Critical",    border: "border-l-[#ff3b30]", dot: "bg-[#ff3b30]" },
};

export default function AssessPage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();

  // Tabs: "new" | "history" | "report"
  const [tab, setTab] = useState("new");

  // New assessment
  const [selected, setSelected] = useState([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [search, setSearch] = useState("");

  // Report view (current result or past report)
  const [activeReport, setActiveReport] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [cachedReports, setCachedReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !patientId) router.replace("/auth");
  }, [patientId, authLoading]);

  // Load history + cached reports on mount and tab switch
  useEffect(() => {
    if (patientId && tab === "history") loadHistory();
  }, [patientId, tab]);

  const loadHistory = useCallback(async () => {
    if (!patientId) return;
    setLoadingHistory(true);
    try {
      const sessions = await api.getSessions(patientId);
      setHistory(Array.isArray(sessions) ? sessions : []);
    } catch { setHistory([]); }
    setCachedReports(loadReports(patientId));
    setLoadingHistory(false);
  }, [patientId]);

  const filtered = search
    ? SYMPTOMS.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : SYMPTOMS;

  const toggleSymptom = (s) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleAssess = async () => {
    if (selected.length === 0 && !freeText.trim()) return;
    setLoading(true);
    try {
      const res = await api.assess(
        patientId,
        selected.map(s => s.toLowerCase().replace(/\s+/g, "_")),
        freeText
      );
      // Save to local cache for history
      saveReport(patientId, res);
      setActiveReport(res);
      setTab("report");
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const viewCachedReport = (report) => {
    setActiveReport(report);
    setTab("report");
  };

  // Match a history session to a cached report
  const findCached = (session) => {
    const reports = loadReports(patientId);
    return reports.find(r => {
      const symsMatch = JSON.stringify(r.normalized_symptoms?.sort()) === JSON.stringify(session.symptoms?.sort());
      return symsMatch && r.triage === session.triage;
    });
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AppShell>
      <div className="animate-fadeUp">
        {/* ── Tab bar ── */}
        {tab !== "report" && (
          <div className="flex gap-1 mb-4 bg-[#f5f5f7] rounded-xl p-1 max-w-xs">
            <button onClick={() => setTab("new")}
              className={`flex-1 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                tab === "new" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
              }`}>
              <Send className="w-3.5 h-3.5 inline mr-1.5" />New
            </button>
            <button onClick={() => setTab("history")}
              className={`flex-1 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                tab === "history" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"
              }`}>
              <List className="w-3.5 h-3.5 inline mr-1.5" />Reports
            </button>
          </div>
        )}

        {/* ════════════════ NEW ASSESSMENT ════════════════ */}
        {tab === "new" && (
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-4">
            <div className="bg-white rounded-2xl p-5 lg:p-6">
              <h1 className="text-xl font-bold text-[#1d1d1f]">Symptom Assessment</h1>
              <p className="text-[13px] text-[#6e6e73] mt-1 mb-5">Select symptoms or describe how you feel</p>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aeaeb2]" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search symptoms…"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {filtered.map(s => {
                  const active = selected.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSymptom(s)}
                      className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95 ${
                        active ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#ebebed]"
                      }`}>
                      {active && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{s}
                    </button>
                  );
                })}
              </div>

              {/* Selected summary */}
              {selected.length > 0 && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#007aff]/5 border border-[#007aff]/10">
                  <p className="text-[12px] text-[#007aff] font-medium">
                    {selected.length} selected: {selected.join(", ")}
                  </p>
                </div>
              )}

              {/* Free text */}
              <textarea value={freeText} onChange={e => setFreeText(e.target.value)}
                placeholder="Describe how you feel in your own words (optional)…"
                rows={3}
                className="w-full p-3.5 rounded-xl bg-[#f5f5f7] text-[13px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none resize-none mb-4 border border-transparent focus:border-[#d2d2d7] transition-colors" />

              <button onClick={handleAssess}
                disabled={loading || (selected.length === 0 && !freeText.trim())}
                className="w-full h-12 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing with AI…</span>
                    <span className="text-[11px] text-white/50 ml-1">this takes ~10s</span>
                  </>
                ) : (
                  <><Send className="w-4 h-4" /> Run Assessment</>
                )}
              </button>

              {loading && (
                <div className="mt-3 p-3 rounded-xl bg-[#f5f5f7]">
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-[#007aff] mt-0.5 animate-pulse" />
                    <div className="text-[11px] text-[#6e6e73] space-y-1">
                      <p className="font-semibold text-[#1d1d1f]">Processing your assessment...</p>
                      <p>• Normalizing symptoms against knowledge graph</p>
                      <p>• Running disease inference (17 conditions)</p>
                      <p>• Evaluating triage rules</p>
                      <p>• Running ML risk models (XGBoost + SHAP)</p>
                      <p>• Generating AI explanation (MedGemma)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Context panel */}
            <div className="mt-4 lg:mt-0 space-y-4">
              <div className="bg-white rounded-2xl p-5">
                <button onClick={() => setShowContext(!showContext)}
                  className="lg:pointer-events-none flex items-center justify-between w-full">
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Context Pipeline</p>
                  <span className="lg:hidden">{showContext ? <ChevronUp className="w-4 h-4 text-[#aeaeb2]" /> : <ChevronDown className="w-4 h-4 text-[#aeaeb2]" />}</span>
                </button>
                <div className={`${showContext ? "block" : "hidden"} lg:block mt-3 space-y-3`}>
                  <p className="text-[12px] text-[#6e6e73] leading-relaxed">When you run an assessment, VAKR assembles all your data into context:</p>
                  {[
                    { icon: Stethoscope, label: "Symptoms", desc: "Normalized → knowledge graph → weighted inference", color: "#007aff" },
                    { icon: FileText, label: "Medical Records", desc: "Past diagnoses → risk flags (respiratory, cardiac, diabetes)", color: "#ff9500" },
                    { icon: UserCircle, label: "Profile", desc: "Age, sex, BMI, family history, smoking, alcohol → ML features", color: "#af52de" },
                    { icon: Activity, label: "Wearable Vitals", desc: "Heart rate, SpO₂, BP, sleep, steps — real-time", color: "#ff3b30" },
                    { icon: Wind, label: "Air Quality", desc: "Location-based AQI affects respiratory risk", color: "#34c759" },
                    { icon: Database, label: "ML Models", desc: "XGBoost + SHAP → disease risk probabilities", color: "#1d1d1f" },
                  ].map(({ icon: Icon, label, desc, color }) => (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-[#f5f5f7]">
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} strokeWidth={1.8} />
                      <div>
                        <p className="text-[12px] font-semibold text-[#1d1d1f]">{label}</p>
                        <p className="text-[11px] text-[#6e6e73] leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ HISTORY ════════════════ */}
        {tab === "history" && (
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-4">
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5">
                <h2 className="text-lg font-bold text-[#1d1d1f] mb-1">Assessment Reports</h2>
                <p className="text-[13px] text-[#6e6e73] mb-4">Your past symptom assessments and results</p>

                {loadingHistory && (
                  <div className="flex items-center gap-2 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-[#aeaeb2]" />
                    <span className="text-[13px] text-[#aeaeb2]">Loading…</span>
                  </div>
                )}

                {!loadingHistory && history.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-[#d2d2d7] mx-auto mb-2" />
                    <p className="text-[13px] text-[#aeaeb2]">No assessments yet</p>
                    <button onClick={() => setTab("new")} className="mt-3 text-[12px] text-[#007aff] font-medium">
                      Run your first assessment →
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {history.map((session, i) => {
                    const t = triageStyle[session.triage] || triageStyle.LOW;
                    const cached = findCached(session);
                    return (
                      <button key={session.id || i}
                        onClick={() => cached ? viewCachedReport(cached) : null}
                        disabled={!cached}
                        className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all ${
                          cached ? "bg-white border border-[#f0f0f0] hover:border-[#d2d2d7] active:scale-[0.99]" : "bg-[#f5f5f7] opacity-70"
                        }`}>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[12px] font-bold ${t.text}`}>{t.label}</span>
                            <span className="text-[10px] text-[#aeaeb2]">{timeAgo(session.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-[#6e6e73] truncate capitalize">
                            {(session.symptoms || []).map(s => s.replace(/_/g, " ")).join(", ") || "No symptoms recorded"}
                          </p>
                        </div>
                        {cached ? (
                          <Eye className="w-4 h-4 text-[#007aff] shrink-0" />
                        ) : (
                          <span className="text-[9px] text-[#aeaeb2] shrink-0">No detail</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="mt-4 lg:mt-0">
              <div className="bg-white rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">About Reports</p>
                <div className="space-y-2 text-[11px] text-[#6e6e73] leading-relaxed">
                  <p>Full assessment reports (with AI explanation, ML scores, and conditions) are cached locally for quick review.</p>
                  <p>Reports run on this device are viewable anytime. Assessments from other devices show triage level and symptoms only.</p>
                  <p className="text-[10px] text-[#aeaeb2] mt-3">Showing last 20 assessments</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ REPORT VIEW ════════════════ */}
        {tab === "report" && activeReport && (() => {
          const result = activeReport;
          return (
            <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-4">
              <div className="space-y-4">
                {/* Back button */}
                <button onClick={() => { setTab("new"); setActiveReport(null); setSelected([]); setFreeText(""); setSearch(""); }}
                  className="flex items-center gap-1.5 text-[13px] text-[#6e6e73] font-medium hover:text-[#1d1d1f] transition-colors mb-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Triage */}
                {(() => {
                  const t = triageStyle[result.triage] || triageStyle.LOW;
                  return (
                    <div className={`bg-white rounded-2xl p-5 border-l-4 ${t.border}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`w-5 h-5 ${t.text}`} />
                        <span className={`text-[16px] font-bold ${t.text}`}>{t.label}</span>
                      </div>
                      <p className="text-[13px] text-[#6e6e73]">
                        Based on {result.normalized_symptoms?.length || 0} analyzed symptoms with full patient context
                      </p>
                    </div>
                  );
                })()}

                {/* Normalized Symptoms */}
                {result.normalized_symptoms?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">Understood Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.normalized_symptoms.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] text-[12px] font-medium text-[#6e6e73] capitalize">
                          {s.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Conditions */}
                {result.top_conditions?.length > 0 && (
                  <div className="bg-white rounded-2xl overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                      <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Possible Conditions</p>
                    </div>
                    <div className="divide-y divide-[#f0f0f0]">
                      {result.top_conditions.map((c, i) => {
                        const name = typeof c === "string" ? c : c.condition || c.name || JSON.stringify(c);
                        const score = typeof c === "object" ? (c.weight || c.score || c.probability) : null;
                        return (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-[#f5f5f7] flex items-center justify-center text-[10px] font-bold text-[#6e6e73]">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-[#1d1d1f] capitalize">{name.replace(/_/g, " ")}</p>
                              {score != null && (
                                <div className="w-full h-1 rounded-full bg-[#f0f0f0] mt-1.5">
                                  <div className="h-full rounded-full bg-[#1d1d1f]" style={{ width: `${(score * 100).toFixed(0)}%` }} />
                                </div>
                              )}
                            </div>
                            {score != null && <span className="text-[11px] font-semibold text-[#1d1d1f]">{(score * 100).toFixed(0)}%</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {result.explanation && (() => {
                  const sections = formatExplanation(result.explanation);
                  if (typeof sections === "string") {
                    return (
                      <div className="bg-white rounded-2xl p-5">
                        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">AI Explanation</p>
                        <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap">{sections}</p>
                      </div>
                    );
                  }
                  if (Array.isArray(sections) && sections.length > 0) {
                    return (
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="px-5 pt-5 pb-3">
                          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">AI Analysis</p>
                        </div>
                        <div className="divide-y divide-[#f0f0f0]">
                          {sections.map(({ label, text }, idx) => (
                            <div key={idx} className="px-5 py-3">
                              <p className="text-[11px] font-semibold text-[#1d1d1f] uppercase tracking-wide mb-1 capitalize">{label}</p>
                              <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap">{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Doctor CTA */}
                {(result.triage === "MEDIUM" || result.triage === "HIGH" || result.triage === "CRITICAL") && (() => {
                  const isUrgent = result.triage === "HIGH" || result.triage === "CRITICAL";
                  return (
                    <div className={`rounded-2xl overflow-hidden ${isUrgent ? "border border-[#ff3b30]/20" : ""}`}>
                      {isUrgent && (
                        <div className="bg-[#ff3b30]/8 px-5 py-3 flex items-center gap-2 border-b border-[#ff3b30]/10">
                          <AlertTriangle className="w-4 h-4 text-[#ff3b30] shrink-0" />
                          <p className="text-[12px] font-semibold text-[#ff3b30]">
                            Your triage is <span className="uppercase">{result.triage}</span> — a doctor consultation is strongly recommended
                          </p>
                        </div>
                      )}
                      <button onClick={() => router.push("/doctor")}
                        className={`w-full p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] ${
                          isUrgent
                            ? "bg-[#ff3b30] hover:bg-[#e0352b]"
                            : "bg-[#1d1d1f]"
                        }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? "bg-white/15" : "bg-white/10"}`}>
                          <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-white">
                            {isUrgent ? "Book a Doctor — Urgent" : "Consult a Doctor"}
                          </p>
                          <p className="text-[11px] text-white/60">
                            {isUrgent ? "Find specialists available today" : "Browse available doctors & book an appointment"}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
                      </button>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => { setTab("new"); setActiveReport(null); setSelected([]); setFreeText(""); setSearch(""); }}
                    className="flex-1 h-11 rounded-xl text-[13px] font-medium text-[#6e6e73] bg-white flex items-center justify-center transition-all active:scale-[0.99]">
                    New Assessment
                  </button>
                  <button onClick={() => { setTab("history"); setActiveReport(null); }}
                    className="flex-1 h-11 rounded-xl text-[13px] font-medium text-[#007aff] bg-[#007aff]/5 flex items-center justify-center transition-all active:scale-[0.99]">
                    View All Reports
                  </button>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-4 mt-4 lg:mt-0">
                {/* Data Sources */}
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Data Sources Used</p>
                  <div className="space-y-2">
                    {[
                      { label: "Symptoms", icon: Stethoscope, active: true, detail: `${result.normalized_symptoms?.length || 0} symptoms analyzed` },
                      { label: "Medical Records", icon: FileText, active: true, detail: "Past diagnoses → risk flags" },
                      { label: "Profile & History", icon: UserCircle, active: !!result.health_status, detail: "Demographics + lifestyle → ML" },
                      { label: "Wearable Vitals", icon: Activity, active: !!result.health_status, detail: "Real-time health data" },
                      { label: "Air Quality", icon: Wind, active: result.aqi_level != null, detail: result.aqi_level ? `AQI: ${result.aqi_level}` : "No location set" },
                      { label: "ML Risk Models", icon: Database, active: !!result.health_status, detail: "XGBoost + SHAP" },
                    ].map(({ label, icon: Icon, active, detail }) => (
                      <div key={label} className={`flex items-center gap-3 rounded-xl p-3 ${active ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#aeaeb2]"}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold">{label}</p>
                          <p className={`text-[10px] ${active ? "text-white/60" : "text-[#aeaeb2]"} truncate`}>{detail}</p>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ML Risk Scores */}
                {result.health_status?.risk_scores && (
                  <div className="bg-white rounded-2xl p-5">
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">ML Risk Scores</p>
                    <div className="space-y-3">
                      {Object.entries(result.health_status.risk_scores).map(([disease, data]) => (
                        <div key={disease}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium text-[#1d1d1f] capitalize">{disease.replace(/_/g, " ")}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              data.risk_level === "HIGH" ? "bg-[#ff3b30]/10 text-[#ff3b30]" :
                              data.risk_level === "MEDIUM" ? "bg-[#ff9500]/10 text-[#ff9500]" :
                              "bg-[#34c759]/10 text-[#34c759]"
                            }`}>{data.risk_level}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#f0f0f0]">
                            <div className={`h-full rounded-full ${
                              data.risk_level === "HIGH" ? "bg-[#ff3b30]" :
                              data.risk_level === "MEDIUM" ? "bg-[#ff9500]" : "bg-[#34c759]"
                            }`} style={{ width: `${(data.probability * 100).toFixed(0)}%` }} />
                          </div>
                          <p className="text-[10px] text-[#aeaeb2] mt-0.5">{(data.probability * 100).toFixed(1)}%</p>
                          {data.top_factors?.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {data.top_factors.slice(0, 3).map((f, fi) => (
                                <p key={fi} className="text-[10px] text-[#6e6e73]">
                                  {f.direction === "increases" ? "↑" : "↓"} {f.feature.replace(/_/g, " ")} ({f.impact > 0 ? "+" : ""}{(f.impact * 100).toFixed(0)}%)
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.health_status?.recommendations?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">Recommendations</p>
                    <div className="space-y-2">
                      {result.health_status.recommendations.map((r, i) => (
                        <p key={i} className="text-[12px] text-[#6e6e73] leading-relaxed">• {r}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* AQI */}
                {result.aqi_level != null && (
                  <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
                    <Wind className="w-5 h-5 text-[#34c759]" strokeWidth={1.6} />
                    <div>
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">AQI: {result.aqi_level}</p>
                      <p className="text-[11px] text-[#aeaeb2]">
                        {result.aqi_level > 150 ? "Poor — may worsen respiratory symptoms" : "Acceptable air quality"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
