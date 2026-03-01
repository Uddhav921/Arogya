"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  Search, Send, Loader2, AlertTriangle, ArrowLeft,
  ChevronRight, Check, Stethoscope, Clock,
  Wind, FileText, UserCircle, Eye,
  Activity, Database, ChevronDown, ChevronUp, List, Sparkles, FolderOpen, ShieldAlert
} from "lucide-react";

// Symptoms Dictionary
const SYMPTOMS = [
  "Headache", "Dizziness", "Chest pain", "Cough", "Fever",
  "Fatigue", "Nausea", "Joint pain", "Shortness of breath",
  "Back pain", "Sore throat", "Abdominal pain", "Rash",
  "Palpitations", "Blurred vision", "Chills", "Wheezing",
  "Sweating",
];

/* ── Render Utils ── */
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

/* ── Local Storage Cache ── */
const REPORT_KEY = (pid) => `aroga_reps_drk_${pid}`;

function saveReport(pid, report) {
  try {
    const stored = JSON.parse(localStorage.getItem(REPORT_KEY(pid)) || "[]");
    stored.unshift({ ...report, _savedAt: new Date().toISOString() });
    localStorage.setItem(REPORT_KEY(pid), JSON.stringify(stored.slice(0, 20)));
  } catch { /* ignore */ }
}

function loadReports(pid) {
  try { return JSON.parse(localStorage.getItem(REPORT_KEY(pid)) || "[]"); } 
  catch { return []; }
}

const triageStyle = {
  LOW:      { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Low Risk",    border: "border-emerald-500", dot: "bg-emerald-500", icon: Check },
  MEDIUM:   { bg: "bg-amber-500/10",   text: "text-amber-500",   label: "Medium Risk", border: "border-amber-500",   dot: "bg-amber-500", icon: AlertTriangle },
  HIGH:     { bg: "bg-rose-500/10",    text: "text-rose-500",    label: "High Risk",   border: "border-rose-500",    dot: "bg-rose-500", icon: AlertTriangle },
  CRITICAL: { bg: "bg-rose-600/15",    text: "text-rose-500",    label: "Critical",    border: "border-rose-600",    dot: "bg-rose-600", icon: ShieldAlert },
};

export default function AssessPage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();

  const [tab, setTab] = useState("new");
  const [selected, setSelected] = useState([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [activeReport, setActiveReport] = useState(null);

  const [history, setHistory] = useState([]);
  const [cachedReports, setCachedReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !patientId) router.replace("/auth");
  }, [patientId, authLoading]);

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
    // Optional context save to inform user that their report process has started
    try {
      const res = await api.assess(
        patientId,
        selected.map(s => s.toLowerCase().replace(/\s+/g, "_")),
        freeText
      );
      saveReport(patientId, res);
      setActiveReport(res);
      setTab("report");
    } catch (err) {
      console.error(err);
    } finally { 
       setLoading(false); 
    }
  };

  const viewCachedReport = (report) => {
    setActiveReport(report);
    setTab("report");
  };

  const findCached = (session) => {
    const reports = loadReports(patientId);
    return reports.find(r => {
      const symsMatch = JSON.stringify(r.normalized_symptoms?.sort()) === JSON.stringify(session.symptoms?.sort());
      return symsMatch && r.triage === session.triage;
    });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[1400px] mx-auto pb-10">
        
        {/* ── Segmented Control Tabs ── */}
        {tab !== "report" && (
          <div className="flex gap-1.5 mb-8 bg-card border border-border rounded-xl p-1.5 max-w-[320px] shadow-sm">
            <button onClick={() => setTab("new")}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-bold transition-all ${
                tab === "new" ? "bg-muted text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Send className="w-4 h-4" /> New Check
            </button>
            <button onClick={() => setTab("history")}
               className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-bold transition-all ${
                tab === "history" ? "bg-muted text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}>
              <FolderOpen className="w-4 h-4" /> Archives
            </button>
          </div>
        )}

        {/* ════════════════ NEW ASSESSMENT ════════════════ */}
        <AnimatePresence mode="wait">
          {tab === "new" && (
            <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
              
              {/* Main Input Form */}
              <div className="bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="mb-8 relative z-10">
                  <h1 className="text-[28px] md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                    <Stethoscope className="w-8 h-8 text-emerald-500" /> Diagnostic Assessment
                  </h1>
                  <p className="text-[14px] text-muted-foreground mt-2 font-medium leading-relaxed max-w-xl">
                    Select your symptoms visually or describe them in natural language. The deterministic z.ai graph matches inputs against your clinical baseline.
                  </p>
                </div>

                {/* AI Processing Textbox */}
                <div className="mb-8 relative group z-10">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-border rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <textarea value={freeText} onChange={e => setFreeText(e.target.value)}
                    placeholder="Describe how you feel naturally. Extracted medical terms are processed automatically..."
                    rows={4}
                    className="relative w-full p-5 rounded-xl bg-muted/50 border border-border text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-emerald-500/50 transition-colors shadow-inner" />
                </div>

                {/* Search Input */}
                <div className="relative mb-5 z-10">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Or tap specific physiological symptoms..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border focus:border-emerald-500/50 text-[14px] font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all shadow-inner" />
                </div>

                {/* Symptom Pills */}
                <div className="flex flex-wrap gap-2.5 mb-8 z-10 relative max-h-[160px] overflow-y-auto pr-2 hide-scrollbar">
                  {filtered.map(s => {
                    const active = selected.includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSymptom(s)}
                        className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-transform active:scale-95 border ${
                          active 
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)]" 
                          : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}>
                        {active && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{s}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-border mt-2 z-10 relative">
                   <button onClick={handleAssess}
                     disabled={loading || (selected.length === 0 && !freeText.trim())}
                     className="w-full h-14 rounded-xl bg-foreground text-background border border-transparent text-[15px] font-bold flex items-center justify-center gap-3 transition-transform hover:bg-foreground/80 active:scale-[0.98] disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground disabled:border-border shadow-xl relative overflow-hidden">
                     {loading ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" />
                         <span>Running Inference... Do not close window</span>
                       </>
                     ) : (
                       <><Sparkles className="w-5 h-5 text-background" /> Run Clinical Graph Check</>
                     )}
                   </button>
                </div>

                {loading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 p-5 rounded-2xl border border-border bg-muted/50 shadow-inner z-10 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-[12px] font-mono text-muted-foreground space-y-2.5 mt-1 font-bold">
                        <p className="text-foreground font-sans flex items-center gap-2">Connecting to z.ai Core <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /></p>
                        <p className="text-muted-foreground">&gt; Normalizing text to SNOMED ontology...</p>
                        <p className="text-emerald-500/80">&gt; Fetching patient history and wearable vitals...</p>
                        <p className="text-muted-foreground">&gt; Calculating deterministic triage weights...</p>
                        <p className="text-blue-500/80">&gt; Passing packaged graph to DeepMind Gemini for reasoning...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Context Pipeline Sidebar */}
              <div className="mt-6 lg:mt-0 space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="flex flex-col mb-6">
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Database className="w-4 h-4"/> Inference Pipeline
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed font-medium">Arogya instantly compiles your health universe before processing symptoms.</p>
                  </div>
                  
                  <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
                    {[
                      { icon: Stethoscope, label: "Symptoms Input", desc: "Normalized to dictionary", color: "text-blue-400", bg: "bg-blue-500/10" },
                      { icon: FileText, label: "Health Records", desc: "Comorbidities mapping", color: "text-amber-500", bg: "bg-amber-500/10" },
                      { icon: UserCircle, label: "Patient Profile", desc: "Age, Sex, BMI anchors", color: "text-purple-400", bg: "bg-purple-500/10" },
                      { icon: Activity, label: "Wearable Vitals", desc: "Real-time SpO2 + HR", color: "text-rose-500", bg: "bg-rose-500/10" },
                      { icon: Wind, label: "AQI Matrix", desc: "Location air quality", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    ].map(({ icon: Icon, label, desc, color, bg }) => (
                      <div key={label} className="flex items-start gap-4 relative z-10">
                        <div className={`w-10 h-10 rounded-xl ${bg} border border-border flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="pt-1">
                          <p className="text-[14px] font-bold text-foreground">{label}</p>
                          <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ HISTORY TAB ════════════════ */}
          {tab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
              <div className="bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="mb-8 relative z-10">
                  <h2 className="text-[28px] md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                     <FolderOpen className="w-8 h-8 text-blue-500" /> Assessment Archive
                  </h2>
                  <p className="text-[14px] text-muted-foreground mt-2 font-medium leading-relaxed max-w-xl">Review securely cached reports generated from this device namespace.</p>
                </div>

                {loadingHistory && (
                  <div className="flex flex-col items-center justify-center py-20 relative z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                    <span className="text-[14px] text-muted-foreground font-bold">Fetching secure records...</span>
                  </div>
                )}

                {!loadingHistory && history.length === 0 && (
                  <div className="text-center py-24 flex flex-col items-center border border-dashed border-border bg-muted/30 rounded-2xl relative z-10">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-[16px] font-bold text-foreground">Vault Empty</p>
                    <p className="text-[13px] font-medium text-muted-foreground mt-1 max-w-[250px] mb-6">No historical assessments found for this profile.</p>
                    <button onClick={() => setTab("new")} className="px-6 py-2.5 bg-foreground text-background font-bold rounded-xl transition-transform active:scale-95 shadow-md">Run First Check</button>
                  </div>
                )}

                <div className="space-y-3 relative z-10">
                  {history.map((session, i) => {
                    const t = triageStyle[session.triage] || triageStyle.LOW;
                    const cached = findCached(session);
                    return (
                      <button key={session.id || i}
                        onClick={() => cached ? viewCachedReport(cached) : null}
                        disabled={!cached}
                        className={`w-full p-5 rounded-2xl text-left flex items-start lg:items-center gap-5 transition-all outline-none border ${
                          cached ? "bg-muted/50 hover:bg-muted/80 border-border hover:border-border/80 group focus:ring-2 ring-border/80" : "bg-muted/30 border-border/50 opacity-50 cursor-not-allowed"
                        }`}>
                        
                        <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border border-[currentColor] ${t.text} ${t.bg} hidden sm:flex`}>
                           <t.icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[12px] font-bold uppercase tracking-widest ${t.text}`}>{t.label}</span>
                            <span className="text-[11px] font-bold text-muted-foreground bg-card border border-border px-2 py-0.5 rounded flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[15px] font-bold text-foreground capitalize truncate mb-1">
                            {(session.symptoms || []).map(s => s.replace(/_/g, " ")).join(", ") || "No symptoms recorded"}
                          </p>
                        </div>

                        {cached ? (
                          <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground group-hover:text-foreground transition-colors bg-card px-3.5 py-2 rounded-lg border border-border shadow-sm shrink-0">
                            <Eye className="w-4 h-4" /> View full report
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-muted-foreground bg-card border border-border px-2 py-1 rounded shrink-0">No Local Vault Data</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0">
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 sticky top-24 shadow-sm">
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4 text-amber-500"/> Trust & Privacy Notice
                  </p>
                  <div className="space-y-4 text-[13px] text-muted-foreground font-medium leading-relaxed">
                    <p>Detailed reports containing generative AI explanations and exact ML model scoring weights are cached <strong>locally on your browser device</strong> for maximum privacy per HIPAA best-practices.</p>
                    <p>Only the core Triage Level and normalized symptoms are synced to the backend to power the context engine for the Chat agent logic.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ REPORT VIEW ════════════════ */}
          {tab === "report" && activeReport && (
            <motion.div key="report" initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">
              
              <div className="space-y-6">
                <button onClick={() => { setTab("history"); setActiveReport(null); }}
                  className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors bg-card px-4 py-2.5 rounded-xl border border-border shadow-sm w-max mb-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Records
                </button>

                {/* Triage Header */}
                {(() => {
                  const t = triageStyle[activeReport.triage] || triageStyle.LOW;
                  return (
                    <div className={`bg-card rounded-3xl p-8 border-2 border-border ${t.border} relative overflow-hidden shadow-lg`}>
                       <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full translate-x-32 -translate-y-32 opacity-20 ${t.bg}`}></div>
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <t.icon className={`w-8 h-8 ${t.text}`} />
                        <span className={`text-[28px] tracking-tight font-extrabold ${t.text} uppercase`}>{t.label} protocol advised</span>
                      </div>
                      <p className="text-[14px] text-muted-foreground font-medium relative z-10 w-full md:w-5/6 leading-relaxed">
                        Deterministic reasoning graph traversed {activeReport.normalized_symptoms?.length || 0} extracted symptoms against your clinical context matrix.
                      </p>
                    </div>
                  );
                })()}

                 {/* Doctor CTA (For high risk) */}
                {(activeReport.triage === "MEDIUM" || activeReport.triage === "HIGH" || activeReport.triage === "CRITICAL") && (() => {
                  const isUrgent = activeReport.triage === "HIGH" || activeReport.triage === "CRITICAL";
                  return (
                    <div className={`rounded-3xl overflow-hidden border-2 ${isUrgent ? "border-rose-500 shadow-[0_4px_30px_rgba(225,29,72,0.15)]" : "border-amber-500/50 shadow-sm"}`}>
                      <div className={`${isUrgent ? "bg-rose-500" : "bg-amber-600"} px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}>
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-black/25 flex items-center justify-center border border-white/10 shadow-inner">
                              <Stethoscope className="w-7 h-7 text-white" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[16px] md:text-[18px] font-extrabold text-white tracking-tight">{isUrgent ? "Immediate medical consultation required" : "Strongly advise seeing a doctor"}</p>
                              <p className="text-[13px] text-white/80 mt-1 font-medium">We have specialists available for immediate booking based on this assessment context.</p>
                           </div>
                        </div>
                        <button onClick={() => router.push("/doctor")} className="bg-white text-black font-extrabold px-6 py-3.5 rounded-xl hover:bg-zinc-100 transition-transform active:scale-95 w-full md:w-auto flex items-center justify-center gap-2 shadow-xl shrink-0">
                          Book Appointment <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Extracted Symptoms */}
                {activeReport.normalized_symptoms?.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Database className="w-4 h-4"/> Ontology Mapping</p>
                    <div className="flex flex-wrap gap-2.5">
                      {activeReport.normalized_symptoms.map((s, i) => (
                        <span key={i} className="px-4 py-2 rounded-xl bg-muted border border-border text-[13px] font-bold text-foreground capitalize shadow-inner">
                          {s.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation Sections (Detailed Report) */}
                {activeReport.explanation && (() => {
                  const sections = formatExplanation(activeReport.explanation);
                  if (Array.isArray(sections) && sections.length > 0) {
                    return (
                      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-border bg-muted/40">
                          <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-500" /> z.ai Clinical Synthesis
                          </p>
                        </div>
                        <div className="divide-y divide-border/80">
                          {sections.map(({ label, text }, idx) => (
                            <div key={idx} className="px-8 py-6">
                              <p className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-3 capitalize">{label}</p>
                              <p className="text-[14px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>

              {/* Sidebar (Analysis Stats) */}
              <div className="space-y-6 mt-6 lg:mt-0">
                
                {/* Differential Diagnosis List */}
                {activeReport.top_conditions?.length > 0 && (
                  <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm sticky top-6">
                    <div className="px-6 py-5 bg-muted/40 border-b border-border flex items-center justify-between">
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Differential Probabilities</p>
                      <Database className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="divide-y divide-border/80 px-6 py-2">
                      {activeReport.top_conditions.map((c, i) => {
                        const name = typeof c === "string" ? c : c.condition || c.name || JSON.stringify(c);
                        const score = typeof c === "object" ? (c.weight || c.score || c.probability) : null;
                        return (
                          <div key={i} className="py-5 flex flex-col gap-2.5">
                             <div className="flex items-start justify-between">
                                <p className="text-[14px] font-bold text-foreground capitalize w-3/4">{name.replace(/_/g, " ")}</p>
                                {score != null && <span className="text-[12px] font-bold font-mono text-muted-foreground border border-border px-2 py-1 rounded bg-muted">{(score * 100).toFixed(1)}%</span>}
                             </div>
                             {score != null && (
                                <div className="w-full h-2 rounded-full bg-background overflow-hidden border border-border/50 shadow-inner">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(score * 100).toFixed(0)}%` }} />
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                 {/* Feature Importance (SHAP values) */}
                {activeReport.health_status?.risk_scores && (
                  <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm mt-6">
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-5">ML Attributions (SHAP)</p>
                    <div className="space-y-6">
                      {Object.entries(activeReport.health_status.risk_scores).map(([disease, data]) => (
                        <div key={disease} className="bg-muted/40 p-5 rounded-2xl border border-border/80">
                           <p className="text-[13px] font-bold text-foreground capitalize mb-4 border-b border-border pb-3">{disease.replace(/_/g, " ")} Predictors</p>
                           {data.top_factors?.length > 0 ? (
                             <div className="space-y-3.5">
                               {data.top_factors.map((f, fi) => (
                                 <div key={fi} className="flex flex-col gap-2">
                                   <div className="flex justify-between items-center text-[11px] font-bold font-mono uppercase tracking-tight text-muted-foreground">
                                      <span>{f.feature.replace(/_/g, " ")}</span>
                                      <span className={f.impact > 0 ? "text-rose-500" : "text-emerald-500"}>
                                        {f.impact > 0 ? "+" : ""}{(f.impact * 100).toFixed(1)}%
                                      </span>
                                   </div>
                                   <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden flex">
                                     <div className={`h-full ${f.impact > 0 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(Math.abs(f.impact * 100), 100)}%` }}></div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-[12px] font-medium text-muted-foreground">No primary driving factors identified.</p>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  );
}
