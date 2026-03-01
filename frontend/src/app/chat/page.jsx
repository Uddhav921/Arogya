"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, Bot, User, Sparkles, Info,
  Stethoscope, FileText, Activity, Wind,
  UserCircle, Database, Trash2, ChevronDown, ChevronUp,
  Check, X, Clock, Plus, ArrowUpRight
} from "lucide-react";

/* ── safely convert any reply shape to a renderable string ── */
function flattenReply(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object") {
    const sections = [];
    if (raw.explanation) sections.push(raw.explanation);
    if (raw.risk_summary) sections.push(`**Risk Summary:** ${typeof raw.risk_summary === "object" ? JSON.stringify(raw.risk_summary) : raw.risk_summary}`);
    if (raw.preventive_guidance) sections.push(`**Preventive Guidance:** ${typeof raw.preventive_guidance === "object" ? JSON.stringify(raw.preventive_guidance) : raw.preventive_guidance}`);
    if (raw.follow_up_questions) {
      const qs = Array.isArray(raw.follow_up_questions) ? raw.follow_up_questions.join("\n• ") : raw.follow_up_questions;
      sections.push(`**Follow-up Questions:**\n• ${qs}`);
    }
    if (raw.safety_note) sections.push(`⚠️ ${raw.safety_note}`);
    if (sections.length === 0) {
      return Object.entries(raw).map(([k, v]) => `**${k.replace(/_/g, " ")}:** ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n\n");
    }
    return sections.join("\n\n");
  }
  return String(raw);
}

/* ── localStorage keys ── */
const CHAT_KEY = (pid) => `aroga_chat_${pid}`;
const HISTORY_KEY = (pid) => `aroga_chat_history_${pid}`;

export default function ChatPage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();

  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Context data
  const [contextData, setContextData] = useState({ records: 0, assessments: 0, vitals: false, profile: false, hasAqi: false, recentSymptoms: [] });

  const endRef = useRef(null);

  // Load persisted chat + context on mount
  useEffect(() => {
    if (!authLoading && !patientId) { router.replace("/auth"); return; }
    if (!patientId) return;

    // Restore chat
    try {
      const saved = localStorage.getItem(CHAT_KEY(patientId));
      if (saved) setMessages(JSON.parse(saved));
      const savedHistory = localStorage.getItem(HISTORY_KEY(patientId));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch { /* ignore */ }

    // Load context indicators
    loadContext();
  }, [patientId, authLoading]);

  // Persist chat on change
  useEffect(() => {
    if (!patientId || messages.length === 0) return;
    localStorage.setItem(CHAT_KEY(patientId), JSON.stringify(messages));
  }, [messages, patientId]);

  useEffect(() => {
    if (!patientId || history.length === 0) return;
    localStorage.setItem(HISTORY_KEY(patientId), JSON.stringify(history));
  }, [history, patientId]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadContext = useCallback(async () => {
    if (!patientId) return;
    try {
      const [records, sessions, vitals, profile] = await Promise.all([
        api.getRecords(patientId).catch(() => []),
        api.getSessions(patientId).catch(() => []),
        api.getLatestHealth(patientId).catch(() => null),
        api.getProfile(patientId).catch(() => null),
      ]);
      const recArr = Array.isArray(records) ? records : records?.records || [];
      const sessArr = Array.isArray(sessions) ? sessions : [];
      const recentSymptoms = sessArr.length > 0
        ? (sessArr[0].symptoms_list || sessArr[0].symptoms || []).slice(0, 4)
        : [];

      setContextData({
        records: recArr.length,
        recordList: recArr.slice(0, 3), // Store top 3 records for tagging
        assessments: sessArr.length,
        vitals: !!vitals,
        profile: !!profile,
        hasAqi: !!(profile?.location),
        recentSymptoms: Array.isArray(recentSymptoms) ? recentSymptoms : [],
        lastTriage: sessArr[0]?.triage || null,
      });
    } catch { /* ignore */ }
  }, [patientId]);

  const sendMessage = async (msg) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await api.chat(patientId, text, history);
      const reply = flattenReply(res.reply) || "I received your message but couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (res.history) setHistory(res.history);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message || "Something went wrong. Please try again."}` }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
    if (patientId) {
      localStorage.removeItem(CHAT_KEY(patientId));
      localStorage.removeItem(HISTORY_KEY(patientId));
    }
  };

  const ctxItems = [
    { icon: UserCircle, label: "Profile", active: contextData.profile, detail: "Age, sex, BMI, family history, lifestyle" },
    { icon: FileText, label: "Records", active: contextData.records > 0, detail: `${contextData.records} medical record${contextData.records !== 1 ? "s" : ""}` },
    { icon: Stethoscope, label: "Assessments", active: contextData.assessments > 0, detail: contextData.lastTriage ? `Last: ${contextData.lastTriage} risk` : `${contextData.assessments} past assessments` },
    { icon: Activity, label: "Vitals", active: contextData.vitals, detail: "HR, SpO₂, BP, sleep, steps" },
    { icon: Wind, label: "AQI", active: contextData.hasAqi, detail: contextData.hasAqi ? "Location-based air quality" : "No location set" },
    { icon: Database, label: "MedGemma", active: true, detail: "Context-aware AI model" },
  ];

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-4 h-full" style={{ height: "calc(100vh - 100px)" }}>

        {/* ─── Main chat area ─── */}
        <div className="flex flex-col bg-white rounded-2xl overflow-hidden h-full">
          {/* Chat header */}
          <div className="px-5 h-12 flex items-center justify-between border-b border-[#f0f0f0] shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#6e6e73]" />
              <span className="text-[13px] font-semibold text-[#1d1d1f]">VAKR AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] font-semibold">Context-Aware</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile context toggle */}
              <button onClick={() => setShowContext(!showContext)} className="lg:hidden p-1.5 rounded-lg hover:bg-[#f5f5f7]">
                <Info className="w-4 h-4 text-[#aeaeb2]" />
              </button>
              {messages.length > 0 && (
                <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-[#f5f5f7]" title="Clear chat">
                  <Trash2 className="w-3.5 h-3.5 text-[#aeaeb2]" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-4 space-y-3">
            {/* Mobile context panel */}
            {showContext && (
              <div className="lg:hidden bg-[#f5f5f7] rounded-xl p-4 mb-2 space-y-2 animate-fadeUp">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">AI Context</p>
                {ctxItems.map(({ icon: Icon, label, active, detail }) => (
                  <div key={label} className="flex items-center gap-2 text-[11px]">
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-[#34c759]" : "text-[#d2d2d7]"}`} />
                    <span className={active ? "text-[#1d1d1f] font-medium" : "text-[#aeaeb2]"}>{label}</span>
                    {active && <Check className="w-3 h-3 text-[#34c759]" />}
                  </div>
                ))}
                <button onClick={() => setShowContext(false)} className="text-[10px] text-[#007aff] font-medium mt-1">Close</button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 animate-fadeUp">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#6e6e73]" strokeWidth={1.4} />
                </div>
                <div>
                  <p className="text-[17px] font-semibold text-[#1d1d1f]">VAKR AI</p>
                  <p className="text-[13px] text-[#aeaeb2] mt-1 max-w-[340px]">
                    I have access to your profile, medical records, recent assessments, wearable vitals, and air quality data. Ask me anything.
                  </p>
                </div>

                {/* Context summary chips */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {ctxItems.filter(c => c.active).map(({ label, icon: Icon }) => (
                    <span key={label} className="px-2 py-1 rounded-lg bg-[#f5f5f7] text-[10px] font-medium text-[#6e6e73] flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                  ))}
                </div>

                {/* Recent assessment indicator */}
                {contextData.lastTriage && (
                  <div className="mt-2 px-3 py-2 rounded-xl bg-[#f5f5f7] max-w-[300px]">
                    <p className="text-[10px] text-[#aeaeb2] font-medium">Last Assessment</p>
                    <p className="text-[12px] text-[#1d1d1f] font-semibold mt-0.5">
                      Triage: <span className={
                        contextData.lastTriage === "HIGH" ? "text-[#ff3b30]" :
                        contextData.lastTriage === "MEDIUM" ? "text-[#ff9500]" : "text-[#34c759]"
                      }>{contextData.lastTriage}</span>
                    </p>
                    {contextData.recentSymptoms.length > 0 && (
                      <p className="text-[11px] text-[#6e6e73] mt-0.5 capitalize">
                        {contextData.recentSymptoms.map(s => typeof s === "string" ? s.replace(/_/g, " ") : s).join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Suggested questions */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {[
                    "What does my last assessment mean?",
                    "Based on my records, what should I watch for?",
                    "How are my vitals looking?",
                    "What lifestyle changes do you recommend?",
                  ].map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="px-3.5 py-2 rounded-xl text-[12px] font-medium text-[#6e6e73] bg-[#f5f5f7] transition-colors hover:bg-[#ebebed]">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""} animate-fadeUp`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-[#f5f5f7] shrink-0 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-[#6e6e73]" />
                  </div>
                )}
                <div className={`max-w-[78%] lg:max-w-[65%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-[#007aff] text-white"
                    : "bg-[#f5f5f7] text-[#1d1d1f]"
                }`}>
                  {m.role === "user" ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="text-[13px] leading-relaxed markdown-content prose prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[#007aff] shrink-0 flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#f5f5f7] shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#6e6e73]" />
                </div>
                <div className="bg-[#f5f5f7] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#aeaeb2] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-5 lg:px-6 pb-4 pt-2 border-t border-[#f0f0f0] shrink-0">
            <div className="flex gap-2">
              <input type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your health…"
                className="flex-1 h-11 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-xl bg-[#007aff] flex items-center justify-center transition-all active:scale-95 disabled:opacity-30">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Desktop: Context sidebar ─── */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* Active context */}
          <div className="bg-white rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Active Context</p>
            <p className="text-[11px] text-[#6e6e73] mb-3 leading-relaxed">
              The AI automatically receives all your data with every message. Here's what it sees:
            </p>
            <div className="space-y-2">
              {ctxItems.map(({ icon: Icon, label, active, detail }) => (
                <div key={label} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${active ? "bg-[#f5f5f7]" : "opacity-40"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#34c759]" : "text-[#d2d2d7]"}`} strokeWidth={1.8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1d1d1f]">{label}</p>
                    <p className="text-[10px] text-[#aeaeb2] truncate">{detail}</p>
                  </div>
                  {active && <Check className="w-3 h-3 text-[#34c759] shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Consult a Doctor Action */}
          <button 
            onClick={() => router.push("/book")}
            className="w-full bg-[#007aff] hover:bg-[#0062cc] text-white rounded-2xl p-4 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold">Consult a Doctor</p>
                <p className="text-[10px] text-white/70">Professional medical advice</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </button>

          {/* Recent Records (Tagging UI) */}
          {contextData.recordList?.length > 0 && (
            <div className="bg-white rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Tag Records</p>
              <div className="space-y-2">
                {contextData.recordList.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setInput(prev => `${prev} @${rec.title} `.trimStart())}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#f5f5f7] text-left transition-colors group"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                    <span className="flex-1 text-[11px] text-[#1d1d1f] truncate">{rec.title}</span>
                    <Plus className="w-3 h-3 text-[#007aff] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent assessment */}
          {contextData.lastTriage && (
            <div className="bg-white rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">Latest Assessment</p>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-6 rounded-full ${
                  contextData.lastTriage === "HIGH" || contextData.lastTriage === "CRITICAL" ? "bg-[#ff3b30]" :
                  contextData.lastTriage === "MEDIUM" ? "bg-[#ff9500]" : "bg-[#34c759]"
                }`} />
                <span className={`text-[13px] font-bold ${
                  contextData.lastTriage === "HIGH" || contextData.lastTriage === "CRITICAL" ? "text-[#ff3b30]" :
                  contextData.lastTriage === "MEDIUM" ? "text-[#ff9500]" : "text-[#34c759]"
                }`}>{contextData.lastTriage} Risk</span>
              </div>
              {contextData.recentSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contextData.recentSymptoms.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#f5f5f7] text-[10px] font-medium text-[#6e6e73] capitalize">
                      {(typeof s === "string" ? s : "").replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#aeaeb2] mt-2">AI is aware of this assessment and {contextData.assessments - 1} more</p>
            </div>
          )}

          {/* How it works */}
          <div className="bg-white rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">How It Works</p>
            <div className="space-y-2 text-[11px] text-[#6e6e73] leading-relaxed">
              <p>Every message you send goes to <strong>MedGemma</strong> along with your full patient context.</p>
              <p>The AI sees your records, assessments, vitals, and profile — so it gives personalized answers without you repeating info.</p>
              <p>Chat history is preserved between sessions so you can continue conversations.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
