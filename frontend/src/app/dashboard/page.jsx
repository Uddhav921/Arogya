"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  Heart, Activity, Wind, Thermometer, Moon, Footprints,
  ChevronRight, Stethoscope, MessageCircle,
  BarChart3, Clock, Loader2, RefreshCw, Sparkles,
  FolderOpen, TrendingUp, Zap, AlertTriangle, User, Database, Plus
} from "lucide-react";

// Animation Variants
const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function DashboardPage() {
  const router = useRouter();
  const { patientId, patient: ctxPatient, setPatient, loading: ctxLoading } = usePatient();
  const [patient, setPatientData] = useState(null);
  const [profile, setProfileData] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    try {
      const [p, pr, v, s] = await Promise.all([
        api.getPatient(patientId),
        api.getProfile(patientId).catch(() => null),
        api.getLatestHealth(patientId).catch(() => null),
        api.getSessions(patientId).catch(() => []),
      ]);
      setPatientData(p);
      setPatient(p);
      setProfileData(pr);
      setVitals(v);
      setSessions(s || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => {
    if (ctxLoading) return;
    if (!patientId) { router.replace("/auth"); return; }
    loadData();
  }, [patientId, ctxLoading, loadData]);

  const handleSimulate = async () => {
    setSimulating(true);
    try { await api.triggerSimulation(); await loadData(); }
    catch (err) { console.error(err); }
    finally { setSimulating(false); }
  };

  if (loading || ctxLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </AppShell>
    );
  }

  const name = patient?.name || ctxPatient?.name || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const vitalsData = vitals ? [
    { label: "Heart Rate", val: vitals.heart_rate, unit: "bpm", Icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "SpO₂", val: vitals.spo2, unit: "%", Icon: Wind, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Temperature", val: vitals.body_temp_c, unit: "°C", Icon: Thermometer, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Blood Pressure", val: vitals.blood_pressure_systolic ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}` : null, unit: "", Icon: TrendingUp, color: "text-zinc-300", bg: "bg-zinc-800" },
    { label: "Sleep", val: vitals.sleep_hours_last_night, unit: "hrs", Icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Steps", val: vitals.steps_today?.toLocaleString(), unit: "", Icon: Footprints, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ] : [];

  const isProfileComplete = patient?.age && patient?.weight_kg && profile?.exercise_frequency;

  return (
    <AppShell>
      <motion.div 
        variants={containerVariant} 
        initial="hidden" 
        animate="visible"
        className="w-full h-full max-w-[1400px] mx-auto"
      >
        
        {/* ── Header ── */}
        <motion.div variants={itemVariant} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[12px] font-semibold text-muted-foreground tracking-widest uppercase mb-1">{greeting}</p>
            <h1 className="text-[28px] lg:text-[32px] font-bold text-foreground tracking-tight">{name} <span className="text-muted-foreground font-normal">👋</span></h1>
          </div>
          <div className="hidden lg:flex items-center gap-3 bg-muted border border-border rounded-full px-4 py-2 focus-within:border-border transition-colors shadow-sm">
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <span className="text-[12px] font-bold text-foreground">Arogya Core Active</span>
          </div>
        </motion.div>

        {/* ── Main Dashboard Layout ── */}
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">

          {/* ─── Left Column (Main Stats & Actions) ─── */}
          <div className="space-y-6">
            
            {/* Quick Actions Bento */}
            <motion.div variants={itemVariant} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => router.push("/assess")}
                className="bg-card border border-border rounded-2xl p-5 text-left transition-all hover:bg-muted hover:border-border active:scale-95 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Stethoscope className="w-16 h-16 text-foreground" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border">
                  <Stethoscope className="w-5 h-5 text-foreground" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-bold text-foreground mb-1">Assessment</p>
                <p className="text-[12px] text-muted-foreground font-medium">Check symptoms</p>
              </button>
              
              <button onClick={() => router.push("/chat")}
                className="bg-muted border border-border rounded-2xl p-5 text-left transition-all hover:bg-muted/80 active:scale-95 group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageCircle className="w-16 h-16 text-foreground" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center mb-4 shadow-sm">
                  <MessageCircle className="w-5 h-5 text-background" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-bold text-foreground mb-1">Arogya AI Chat</p>
                <p className="text-[12px] text-muted-foreground font-medium">Ask questions</p>
              </button>
              
              <button onClick={() => router.push("/chat")}
                className="bg-card border border-border rounded-2xl p-5 text-left transition-all hover:bg-muted hover:border-border active:scale-95 group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <User className="w-16 h-16 text-foreground" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border">
                  <User className="w-5 h-5 text-foreground" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-bold text-foreground mb-1">Consultation</p>
                <p className="text-[12px] text-muted-foreground font-medium">Book a doctor</p>
              </button>

              <button onClick={() => router.push("/records")}
                className="bg-card border border-border rounded-2xl p-5 text-left transition-all hover:bg-muted hover:border-border active:scale-95 group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FolderOpen className="w-16 h-16 text-foreground" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border">
                  <FolderOpen className="w-5 h-5 text-foreground" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-bold text-foreground mb-1">Records</p>
                <p className="text-[12px] text-muted-foreground font-medium">Medical history</p>
              </button>
            </motion.div>

            {/* Insufficient Data Check */}
            {!isProfileComplete ? (
               <motion.div variants={itemVariant} className="w-full bg-card border border-dashed border-border rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center text-center transition-all">
                  <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-6 shadow-xl">
                     <Database className="w-7 h-7 text-foreground" />
                  </div>
                  <h2 className="text-[20px] font-extrabold text-foreground mb-2 tracking-tight">Insufficient Context Data</h2>
                  <p className="text-[14px] text-muted-foreground max-w-md mb-8 leading-relaxed font-medium">
                     Arogya requires your clinical baseline (age, weight) and lifestyle metrics to accurately construct the inference graph and run assessments.
                  </p>
                  <button onClick={() => router.push("/profile")} className="bg-foreground hover:bg-foreground/80 text-background px-8 py-3.5 rounded-xl text-[14px] font-bold transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                     <Plus className="w-4 h-4" /> Add Sufficient Data
                  </button>
               </motion.div>
            ) : vitals ? (
              <motion.div variants={itemVariant} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-foreground" />
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Live Vitals Tracker</p>
                  </div>
                  <button onClick={handleSimulate} disabled={simulating}
                    className="text-[11px] font-bold text-foreground hover:text-muted-foreground flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-muted px-3 py-1.5 rounded-full border border-border">
                    {simulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Refresh Sync
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {vitalsData.map(({ label, val, unit, Icon, color, bg }) => (
                    <div key={label} className="bg-muted border border-border/80 rounded-xl p-4 hover:border-border transition-colors shadow-inner">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-foreground tracking-tight">{val ?? "–"}</p>
                        {unit && <p className="text-[12px] text-muted-foreground font-bold">{unit}</p>}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1 font-bold">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
               <motion.button variants={itemVariant} onClick={handleSimulate} disabled={simulating}
                 className="w-full bg-card border border-dashed border-border hover:border-foreground/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all active:scale-[0.99] disabled:opacity-50 hover:bg-muted/50">
                 {simulating ? <Loader2 className="w-8 h-8 animate-spin text-foreground mb-4" /> : <Zap className="w-8 h-8 text-foreground mb-4" strokeWidth={1.5} />}
                 <p className="text-[16px] font-bold text-foreground mb-1">{simulating ? "Generating Signal..." : "Connect Wearable Data"}</p>
                 <p className="text-[13px] font-medium text-muted-foreground max-w-sm">Simulate health data (Heart Rate, SpO2, Sleep) to see the inference engine adapt in real-time.</p>
               </motion.button>
            )}

            {/* Recent Assessments List */}
            <motion.div variants={itemVariant} className="bg-card border border-border rounded-2xl overflow-hidden relative shadow-sm">
              <div className="px-6 py-5 border-b border-border/50 bg-muted/50 flex items-center justify-between">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4"/> Recent Assessments</p>
                <button onClick={() => router.push("/assess")} className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors">View All &rarr;</button>
              </div>
              
              {sessions.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {sessions.slice(0, 4).map((s) => {
                    const isRisk = s.triage === "HIGH" || s.triage === "CRITICAL";
                    const isMed = s.triage === "MEDIUM";
                    return (
                      <div key={s.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/80 transition-colors cursor-pointer group">
                        <div className={`w-1.5 h-10 rounded-full shrink-0 ${isRisk ? "bg-rose-500 text-background" : isMed ? "bg-amber-500 text-background" : "bg-muted-foreground text-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate group-hover:text-muted-foreground transition-colors">
                            {s.symptoms?.slice(0, 3).join(", ").replace(/_/g, " ") || "General Assessment"}
                          </p>
                          <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recent"}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${
                          isRisk ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : isMed ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-muted text-foreground border border-border"
                        }`}>{s.triage}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center flex flex-col items-center bg-zinc-950/20">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5 text-zinc-500" />
                  </div>
                  <p className="text-[15px] font-bold text-zinc-300 mb-1">No assessments yet</p>
                  <p className="text-[13px] font-medium text-zinc-500 mb-4">Start your first check.</p>
                  <button onClick={() => router.push("/assess")}
                    className="text-[13px] font-bold text-zinc-900 bg-white hover:bg-zinc-200 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                    Run Check
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* ─── Right Column (Alerts & Profile) ─── */}
          <div className="space-y-6 mt-6 lg:mt-0">

            {/* High-risk Alert Box */}
            {(() => {
              const latest = sessions?.[0];
              const isHighRisk = latest?.triage === "HIGH" || latest?.triage === "CRITICAL";
              if (!isHighRisk) return null;
              return (
                <motion.div variants={itemVariant} className="rounded-2xl overflow-hidden border border-rose-500/30 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none"></div>
                  <div className="bg-rose-500/10 px-5 py-3 border-b border-rose-500/20 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <p className="text-[12px] font-bold text-rose-400 uppercase tracking-wider">
                      Action Required
                    </p>
                  </div>
                  <div className="p-5 bg-zinc-900/80 backdrop-blur-md">
                    <p className="text-[14px] font-medium text-zinc-300 mb-4 leading-relaxed">
                      Your recent assessment indicates a <strong className="text-white bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">{latest.triage}</strong> risk based on the active medical graph. 
                    </p>
                    <button onClick={() => router.push("/chat")}
                      className="w-full bg-rose-600 hover:bg-rose-500 p-4 rounded-xl flex items-center justify-between text-left transition-all active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.3)] border border-rose-400/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-white">Consult Specialist</p>
                          <p className="text-[12px] font-medium text-white/80">Connect instantly</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
                    </button>
                  </div>
                </motion.div>
              );
            })()}

            {/* Patient Profile Card */}
            <motion.div variants={itemVariant} className="bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
              
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-800/50 relative z-10 bg-zinc-950/20">
                <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4" /> Medical Profile</p>
                <button onClick={() => router.push("/profile")}
                  className="text-[12px] font-bold text-zinc-300 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">Manage</button>
              </div>

              <div className="p-6 space-y-5 relative z-10">
                {/* BMI Callout */}
                {patient?.bmi && (
                  <div className="flex items-end justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl shadow-inner">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Body Mass Index</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-zinc-100 tracking-tight">{patient.bmi}</span>
                        <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          {patient.bmi < 18.5 ? "Underweight" : patient.bmi < 25 ? "Normal Range" : patient.bmi < 30 ? "Overweight" : "Obese"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details List */}
                <div className="space-y-4">
                  {[
                    { label: "Age & Sex", val: patient?.age ? `${patient.age} yrs · ${patient.sex}` : "—" },
                    { label: "Height / Weight", val: patient?.height_cm ? `${patient.height_cm} cm · ${patient.weight_kg} kg` : "—" },
                    { label: "Conditions", val: patient?.known_conditions?.filter(c => c !== "none").join(", ").replace(/_/g, " ") || "None recorded" },
                  ].map(({label, val}) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
                      <span className="text-[14px] font-bold text-zinc-200 capitalize">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* How Engine Works Mini */}
            <motion.div variants={itemVariant} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <p className="text-[12px] font-bold text-emerald-500/70 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-500"/> Arogya Intelligence</p>
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {[
                  { label: "Symptoms Graph", desc: "Maps your current inputs" },
                  { label: "Historical Inference", desc: "Applies past diagnoses weight" },
                  { label: "Real-time Signals", desc: "Integrates wearable / AQI data" },
                  { label: "Predictive Models", desc: "XGBoost scoring + Explanation" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[13px] font-bold text-zinc-200">{label}</p>
                      <p className="text-[11px] font-medium text-zinc-500 leading-snug mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
