"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import ReactMarkdown from "react-markdown";
import {
  Send, Loader2, Sparkles, User, Info,
  Stethoscope, FileText, Activity, Wind,
  UserCircle, Database, Trash2, Check, X,
  Paperclip, ArrowUpRight, MessageSquare, Plus, Calendar, ShieldAlert
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
const CHAT_KEY = (pid) => `aroga_chat_drk_${pid}`;
const HISTORY_KEY = (pid) => `aroga_chathist_drk_${pid}`;

// Slide-in animation variant for messages
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const LOADING_STEPS = [
  "Initializing z.ai inference engine...",
  "Fetching patient clinical context...",
  "Normalizing symptoms to knowledge graph...",
  "Running probabilistic risk models...",
  "Synthesizing personalized explanation..."
];

export default function ChatPage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();

  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Document tagging
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [taggedDocs, setTaggedDocs] = useState([]);

  // Context data
  const [contextData, setContextData] = useState({ records: 0, assessments: 0, vitals: false, profile: false, hasAqi: false, recentSymptoms: [] });

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Load persisted chat + context on mount
  useEffect(() => {
    if (!authLoading && !patientId) { router.replace("/auth"); return; }
    if (!patientId) return;

    try {
      const saved = localStorage.getItem(CHAT_KEY(patientId));
      if (saved) setMessages(JSON.parse(saved));
      const savedHistory = localStorage.getItem(HISTORY_KEY(patientId));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch { /* ignore */ }

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
  }, [messages, loading]);

  // Loading animation sequencer
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
        recordList: recArr.slice(0, 3), 
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
    let text = msg || input.trim();
    if (!text && taggedDocs.length === 0 || loading) return;
    
    // Inject tags into prompt
    if (taggedDocs.length > 0) {
      text = `[Context: Attached Documents - ${taggedDocs.join(", ")}]\n${text}`;
    }

    setInput("");
    setTaggedDocs([]);
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

  const tagDocument = (docName) => {
    if (!taggedDocs.includes(docName)) setTaggedDocs([...taggedDocs, docName]);
    setShowDocMenu(false);
    inputRef.current?.focus();
  };

  const removeTag = (docName) => {
    setTaggedDocs(taggedDocs.filter(t => t !== docName));
  };


  const ctxItems = [
    { icon: UserCircle, label: "Profile", active: contextData.profile, detail: "Age, sex, BMI, family history, lifestyle" },
    { icon: FileText, label: "Records", active: contextData.records > 0, detail: `${contextData.records} medical record${contextData.records !== 1 ? "s" : ""}` },
    { icon: Stethoscope, label: "Assessments", active: contextData.assessments > 0, detail: contextData.lastTriage ? `Last: ${contextData.lastTriage} risk` : `${contextData.assessments} past assessments` },
    { icon: Activity, label: "Vitals", active: contextData.vitals, detail: "HR, SpO₂, BP, sleep, steps" },
    { icon: Wind, label: "AQI", active: contextData.hasAqi, detail: contextData.hasAqi ? "Location-based air quality" : "No location set" },
    { icon: Database, label: "z.ai Platform", active: true, detail: "Context-aware AI model" },
  ];

  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] sm:h-[calc(100vh-40px)] w-full max-w-[1400px] mx-auto gap-6 sm:py-0 pb-12 sm:pb-4">

        {/* ─── SIDEBAR: Chat History & Knowledge Base ─── */}
        <div className="hidden lg:flex flex-col w-[320px] shrink-0 gap-5">
          
          <button 
            onClick={clearChat}
            className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-transform active:scale-95 group shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-inner border border-emerald-500/20">
                 <Plus className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[15px] font-bold text-zinc-300 group-hover:text-white">New Session</span>
            </div>
          </button>

          {/* Previous Chats */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950/20">
              <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Archive</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
              <button className="w-full text-left px-5 py-4 rounded-2xl bg-zinc-800/80 transition-colors group relative overflow-hidden border border-zinc-700/50 shadow-inner">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 rounded-r-md bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[14px] text-white font-bold truncate block pl-2">{messages.length > 0 ? "Current Conversation" : "Empty Session"}</span>
                <span className="text-[11px] text-emerald-400 font-bold tracking-wider uppercase mt-1 block pl-2">Active</span>
              </button>
              {contextData.assessments > 0 && (
                 <>
                    <button className="w-full text-left px-5 py-4 rounded-2xl hover:bg-zinc-800/50 transition-colors group">
                      <span className="text-[14px] text-zinc-400 group-hover:text-zinc-200 font-medium truncate block">Clinical Assessment Report</span>
                      <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Yesterday, 10:20 AM</span>
                    </button>
                    <button className="w-full text-left px-5 py-4 rounded-2xl hover:bg-zinc-800/50 transition-colors group">
                      <span className="text-[14px] text-zinc-400 group-hover:text-zinc-200 font-medium truncate block">Review of SpO2 anomalies</span>
                      <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Jan 24, 2026</span>
                    </button>
                 </>
              )}
            </div>
          </div>

          {/* Active Patient Context */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
            <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Database className="w-4 h-4" /> Context Active
            </p>
            <div className="flex flex-wrap gap-2.5">
              {ctxItems.filter(c => c.active).map(({ label, icon: Icon }) => (
                <div key={label} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner flex items-center gap-2">
                   <Icon className="w-4 h-4 text-emerald-500" />
                   <span className="text-[12px] text-zinc-300 font-bold tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── MAIN CHAT AREA ─── */}
        <div className="flex-1 flex flex-col bg-zinc-950 sm:bg-[#0c0c0e] sm:border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative h-full">
          
          {/* Header */}
          <div className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-zinc-800/50 bg-[#0c0c0e]/80 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent"></div>
                <Sparkles className="w-6 h-6 text-emerald-500 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-extrabold text-white tracking-tight">z.ai Clinical Engine</span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-500/80 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Secure Session Active</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={clearChat} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-all font-bold text-[13px]">
                 <Trash2 className="w-4 h-4" /> Reset Context
               </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12 space-y-10 scroll-smooth hide-scrollbar bg-[url('/noise.svg')] bg-zinc-950/20 bg-blend-overlay">
            
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto py-10"
              >
                <div className="w-24 h-24 rounded-[32px] bg-black border border-emerald-500/30 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-[32px] blur-xl"></div>
                  <Sparkles className="w-12 h-12 text-emerald-400 z-10" />
                </div>
                <h2 className="text-[32px] md:text-[40px] font-black text-white mb-4 tracking-tighter leading-none">Arogya Intelligence</h2>
                <p className="text-[15px] md:text-[17px] text-zinc-400 mb-12 leading-relaxed font-medium max-w-[500px]">
                  Powered by a unified knowledge graph. Securely analyzing your clinical baseline, vital signatures, and historical records.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                  {[
                    { text: "Analyze my recent Complete Blood Count (CBC) report.", icon: FileText },
                    { text: "I've been feeling unusually fatigued and dizzy lately.", icon: Activity },
                    { text: "What preventive cardiology changes do you recommend?", icon: User },
                    { text: "How is the local AQI affecting my respiratory baseline?", icon: Wind },
                  ].map((q, idx) => (
                    <motion.button 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      onClick={() => sendMessage(q.text)}
                      className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-emerald-500/30 text-left transition-all group shadow-sm flex items-start gap-4 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 flex items-center justify-center shrink-0 transition-colors">
                         <q.icon className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <span className="text-[14px] text-zinc-300 group-hover:text-white leading-relaxed font-bold block pt-1">{q.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Render Messages */}
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial="hidden"
                animate="visible"
                variants={messageVariants}
                className={`flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-2">
                  {m.role === "user" ? (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-zinc-300" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-black border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[85%] md:max-w-[80%]`}>
                  <div className={`px-6 md:px-8 py-5 md:py-6 rounded-[28px] shadow-sm relative overflow-hidden ${
                    m.role === "user"
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-tr-sm"
                      : "bg-[#111113] text-zinc-200 border border-zinc-800/80 rounded-tl-sm prose prose-invert prose-emerald prose-p:text-[15px] md:prose-p:text-[16px] prose-p:leading-relaxed tracking-wide shadow-2xl"
                  }`}>
                     {m.role !== "user" && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>}
                    
                    {m.role === "user" ? (
                      <p className="text-[15px] md:text-[16px] font-medium whitespace-pre-wrap leading-relaxed relative z-10">{m.content}</p>
                    ) : (
                      <div className="relative z-10">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-black mb-5 mt-8 text-white tracking-tight" {...props}/>,
                            h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-bold mb-4 mt-6 text-white tracking-tight" {...props}/>,
                            h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-bold mb-3 mt-5 text-emerald-400" {...props}/>,
                            p: ({node, ...props}) => <p className="mb-5 last:mb-0 text-[15px] md:text-[16px] font-medium text-zinc-300 leading-relaxed" {...props}/>,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-5 space-y-2.5 text-zinc-300" {...props}/>,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-5 space-y-2.5 text-zinc-300" {...props}/>,
                            li: ({node, ...props}) => <li className="text-[15px] md:text-[16px] font-medium" {...props}/>,
                            strong: ({node, ...props}) => <strong className="font-bold text-white bg-zinc-800/50 px-1 py-0.5 rounded" {...props}/>,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500/50 pl-4 py-1 italic text-zinc-400 bg-emerald-500/5 rounded-r-xl" {...props}/>,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>

                        {/* DOCTOR CTA ATTACHMENT */}
                        {m.content.toLowerCase().includes("consult") || m.content.toLowerCase().includes("doctor") || m.content.toLowerCase().includes("medical attention") ? (
                           <div className="mt-8 pt-6 border-t border-zinc-800/80">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-zinc-950/80 rounded-2xl p-5 border border-zinc-800">
                                <div className="flex items-start sm:items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                     <Stethoscope className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <div>
                                    <p className="text-[15px] font-bold text-white">Clinical Consultation Advised</p>
                                    <p className="text-[13px] text-zinc-400 mt-0.5 font-medium">Proceed to specialist booking via z.ai network</p>
                                  </div>
                                </div>
                                <button onClick={() => router.push("/doctor")} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-[14px] font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-xl shrink-0">
                                  <Calendar className="w-4 h-4" /> Book Appointment
                                </button>
                              </div>
                           </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Smart Loading Animation */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto flex-row"
                >
                  <div className="shrink-0 mt-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-black border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 max-w-[85%]">
                     <div className="flex items-center gap-4 px-6 py-5 bg-[#111113] border border-zinc-800 rounded-[28px] rounded-tl-sm shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent w-full h-full animate-[shimmer_2s_infinite] -translate-x-full pointer-events-none"></div>
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500 shrink-0" />
                        <motion.span 
                           key={loadingStep}
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -5 }}
                           className="text-[14px] font-mono font-bold text-zinc-400 whitespace-nowrap"
                        >
                           {LOADING_STEPS[loadingStep]}
                        </motion.span>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-[#0c0c0e] border-t border-zinc-800 shrink-0 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            
            <div className="max-w-4xl mx-auto flex flex-col gap-3 relative">
               
               {/* Tagged Docs Row */}
               {taggedDocs.length > 0 && (
                 <div className="flex flex-wrap gap-2 px-1">
                   {taggedDocs.map(doc => (
                     <div key={doc} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-[12px] font-bold shadow-sm">
                       <FileText className="w-3.5 h-3.5 text-zinc-400" />
                       {doc}
                       <button onClick={() => removeTag(doc)} className="ml-1.5 text-zinc-500 hover:text-rose-400 transition-colors bg-zinc-900 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                     </div>
                   ))}
                 </div>
               )}

               <div className="relative bg-zinc-900 rounded-[24px] border border-zinc-700 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all shadow-xl flex flex-col group overflow-visible">
                 
                 {/* Floating Doc Menu */}
                 <AnimatePresence>
                    {showDocMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute bottom-[100%] left-0 mb-4 w-72 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-30"
                      >
                         <div className="p-4 border-b border-zinc-800/50 bg-zinc-950/50">
                           <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Paperclip className="w-3.5 h-3.5"/> Attach Secure Context</p>
                         </div>
                         <div className="p-2 space-y-1">
                            {["Recent Blood Report (PDF)", "Echocardiogram (JPG)", "Dermatology Notes (PDF)"].map(doc => (
                              <button key={doc} onClick={() => tagDocument(doc)} className="w-full text-left px-4 py-3 rounded-2xl text-[13px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0"><FileText className="w-4 h-4 text-zinc-400" /></div> 
                                <span className="truncate">{doc}</span>
                              </button>
                            ))}
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="flex items-end min-h-[72px] px-2 py-2">
                   
                   {/* Document Box Toggle */}
                   <div className="relative">
                      <button 
                        onClick={() => setShowDocMenu(!showDocMenu)}
                        className={`w-14 h-14 shrink-0 rounded-[20px] flex items-center justify-center transition-colors mb-0.5 ${showDocMenu ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                   </div>
                   
                   <textarea 
                     ref={inputRef}
                     value={input}
                     onChange={e => setInput(e.target.value)}
                     onKeyDown={e => {
                       if (e.key === "Enter" && !e.shiftKey) {
                         e.preventDefault();
                         sendMessage();
                       }
                     }}
                     placeholder="Ask z.ai anything or tag contexts..."
                     className="flex-1 max-h-[200px] min-h-[56px] px-4 py-4 bg-transparent text-[16px] font-medium text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
                     rows={1}
                   />
                   
                   <button 
                     onClick={() => sendMessage()} 
                     disabled={loading || (!input.trim() && taggedDocs.length === 0)}
                     className="w-14 h-14 shrink-0 rounded-[20px] bg-white flex items-center justify-center text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 mb-0.5 shadow-xl"
                   >
                     {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowUpRight className="w-7 h-7" />}
                   </button>
                 </div>
               </div>
            </div>
            
            <p className="text-center text-[11px] text-zinc-600 mt-5 font-medium flex items-center justify-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Arogya AI is an experimental semantic layer. Consult licensed physicians for diagnostics.</p>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}}/>
    </AppShell>
  );
}
