"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  Heart, Activity, Wind, Thermometer, Moon, Footprints,
  ChevronRight, Stethoscope, MessageCircle,
  BarChart3, Clock, Loader2, RefreshCw,
  FolderOpen, TrendingUp, Zap, AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { patientId, patient: ctxPatient, setPatient, loading: ctxLoading } = usePatient();
  const [patient, setPatientData] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    try {
      const [p, v, s] = await Promise.all([
        api.getPatient(patientId),
        api.getLatestHealth(patientId).catch(() => null),
        api.getSessions(patientId).catch(() => []),
      ]);
      setPatientData(p);
      setPatient(p);
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
          <Loader2 className="w-5 h-5 animate-spin text-[#aeaeb2]" />
        </div>
      </AppShell>
    );
  }

  const name = patient?.name || ctxPatient?.name || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const vitalsData = vitals ? [
    { label: "Heart Rate", val: vitals.heart_rate, unit: "bpm", Icon: Heart, color: "#ff3b30" },
    { label: "SpO₂", val: vitals.spo2, unit: "%", Icon: Wind, color: "#007aff" },
    { label: "Temperature", val: vitals.body_temp_c, unit: "°C", Icon: Thermometer, color: "#ff9500" },
    { label: "Blood Pressure", val: vitals.blood_pressure_systolic ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}` : null, unit: "", Icon: TrendingUp, color: "#af52de" },
    { label: "Sleep", val: vitals.sleep_hours_last_night, unit: "hrs", Icon: Moon, color: "#5856d6" },
    { label: "Steps", val: vitals.steps_today?.toLocaleString(), unit: "", Icon: Footprints, color: "#34c759" },
  ] : [];

  return (
    <AppShell>
      <div className="animate-fadeUp">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 mb-4">
          <p className="text-[11px] font-medium text-[#aeaeb2] tracking-widest uppercase">{greeting}</p>
          <h1 className="text-[26px] lg:text-[30px] font-bold text-[#1d1d1f] tracking-tight mt-0.5">{name}</h1>
        </div>

        {/* Desktop: two-column, Mobile: single column */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-4">

          {/* ─── Left column ─── */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={() => router.push("/assess")}
                className="bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:shadow-sm border border-transparent hover:border-[#e5e5ea]">
                <Stethoscope className="w-5 h-5 text-[#007aff] mb-2" strokeWidth={1.6} />
                <p className="text-[14px] font-semibold text-[#1d1d1f]">Run Assessment</p>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Check symptoms</p>
              </button>
              <button onClick={() => router.push("/chat")}
                className="bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:shadow-sm border border-transparent hover:border-[#e5e5ea]">
                <MessageCircle className="w-5 h-5 text-[#34c759] mb-2" strokeWidth={1.6} />
                <p className="text-[14px] font-semibold text-[#1d1d1f]">VAKR AI</p>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Health questions</p>
              </button>
              <button onClick={() => router.push("/doctor")}
                className="bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:shadow-sm border border-transparent hover:border-[#e5e5ea]">
                <Stethoscope className="w-5 h-5 text-[#af52de] mb-2" strokeWidth={1.6} />
                <p className="text-[14px] font-semibold text-[#1d1d1f]">Book Doctor</p>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Find specialists</p>
              </button>
              <button onClick={() => router.push("/records")}
                className="bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:shadow-sm border border-transparent hover:border-[#e5e5ea]">
                <FolderOpen className="w-5 h-5 text-[#ff9500] mb-2" strokeWidth={1.6} />
                <p className="text-[14px] font-semibold text-[#1d1d1f]">Records</p>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Medical history</p>
              </button>
            </div>

            {/* Vitals */}
            {vitals ? (
              <div className="bg-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Live Vitals</p>
                  <button onClick={handleSimulate} disabled={simulating}
                    className="text-[11px] font-medium text-[#007aff] flex items-center gap-1 disabled:opacity-50">
                    {simulating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
                  {vitalsData.map(({ label, val, unit, Icon, color }) => (
                    <div key={label} className="bg-[#f5f5f7] rounded-xl p-3 lg:p-4">
                      <Icon className="w-4 h-4 mb-2" style={{ color }} strokeWidth={1.8} />
                      <p className="text-lg lg:text-xl font-bold text-[#1d1d1f] leading-none">{val ?? "–"}</p>
                      <p className="text-[10px] text-[#aeaeb2] mt-1.5">{label}{unit ? ` (${unit})` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={handleSimulate} disabled={simulating}
                className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.99] disabled:opacity-50 hover:shadow-sm text-left border border-dashed border-[#d2d2d7]">
                {simulating ? <Loader2 className="w-6 h-6 animate-spin text-[#aeaeb2]" /> : <Zap className="w-6 h-6 text-[#ff9500]" strokeWidth={1.6} />}
                <div>
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">{simulating ? "Generating…" : "Generate Health Data"}</p>
                  <p className="text-[12px] text-[#aeaeb2]">Simulate wearable vitals for testing</p>
                </div>
              </button>
            )}

            {/* Recent Assessments */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Recent Assessments</p>
              </div>
              {sessions.length > 0 ? (
                <div className="divide-y divide-[#f0f0f0]">
                  {sessions.slice(0, 5).map((s) => {
                    const isRisk = s.triage === "HIGH" || s.triage === "CRITICAL";
                    const isMed = s.triage === "MEDIUM";
                    return (
                      <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${isRisk ? "bg-[#ff3b30]" : isMed ? "bg-[#ff9500]" : "bg-[#34c759]"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#1d1d1f] truncate">
                            {s.symptoms?.slice(0, 3).join(", ") || "Assessment"}
                          </p>
                          <p className="text-[11px] text-[#aeaeb2] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "Recent"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isRisk ? "bg-[#ff3b30]/10 text-[#ff3b30]" : isMed ? "bg-[#ff9500]/10 text-[#ff9500]" : "bg-[#34c759]/10 text-[#34c759]"
                        }`}>{s.triage}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 pb-5 text-center">
                  <BarChart3 className="w-7 h-7 mx-auto text-[#d2d2d7] mb-2" />
                  <p className="text-[13px] font-medium text-[#6e6e73]">No assessments yet</p>
                  <button onClick={() => router.push("/assess")}
                    className="mt-1 text-[12px] font-semibold text-[#007aff] hover:underline">
                    Run your first →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right column (sidebar content), visible on desktop, stacked on mobile ─── */}
          <div className="space-y-4 mt-4 lg:mt-0">

            {/* High-risk Doctor CTA */}
            {(() => {
              const latest = sessions?.[0];
              const isHighRisk = latest?.triage === "HIGH" || latest?.triage === "CRITICAL";
              if (!isHighRisk) return null;
              return (
                <div className="rounded-2xl overflow-hidden border border-[#ff3b30]/20">
                  <div className="bg-[#ff3b30]/8 px-4 py-3 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3b30]" />
                    </span>
                    <p className="text-[11px] font-semibold text-[#ff3b30]">
                      Latest assessment: <span className="uppercase">{latest.triage}</span> risk — see a doctor
                    </p>
                  </div>
                  <button onClick={() => router.push("/doctor")}
                    className="w-full bg-[#ff3b30] hover:bg-[#e0352b] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99]">
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-white">Book a Doctor — Urgent</p>
                      <p className="text-[11px] text-white/60">Find specialists available today</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
                  </button>
                </div>
              );
            })()}
            {/* BMI Card */}
            {patient?.bmi && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Body Mass Index</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#1d1d1f]">{patient.bmi}</span>
                  <span className="text-[12px] text-[#aeaeb2] mb-1.5">
                    {patient.bmi < 18.5 ? "Underweight" : patient.bmi < 25 ? "Normal" : patient.bmi < 30 ? "Overweight" : "Obese"}
                  </span>
                </div>
                <p className="text-[12px] text-[#aeaeb2] mt-2">{patient.weight_kg} kg · {patient.height_cm} cm</p>
              </div>
            )}

            {/* Profile Summary */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Profile</p>
                <button onClick={() => router.push("/profile")}
                  className="text-[11px] font-medium text-[#007aff]">Edit</button>
              </div>
              <div className="divide-y divide-[#f0f0f0]">
                {[
                  ["Age", patient?.age || "—"],
                  ["Sex", patient?.sex || "—"],
                  ["Conditions", patient?.known_conditions?.filter(c => c !== "none").join(", ") || "None"],
                ].map(([label, val]) => (
                  <div key={label} className="px-5 py-2.5 flex items-center justify-between">
                    <span className="text-[12px] text-[#6e6e73]">{label}</span>
                    <span className="text-[12px] font-medium text-[#1d1d1f] capitalize">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How Context Works */}
            <div className="bg-white rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">How Assessment Works</p>
              <div className="space-y-2.5">
                {[
                  { step: "1", label: "Your symptoms", desc: "Checked against medical knowledge graph" },
                  { step: "2", label: "Your records", desc: "Diabetes, allergies, past diagnoses escalate triage" },
                  { step: "3", label: "Your profile", desc: "Age, BMI, smoking, family history feed ML models" },
                  { step: "4", label: "Wearable vitals", desc: "Heart rate, SpO₂, BP — real-time context" },
                  { step: "5", label: "Air quality", desc: "AQI from your location affects respiratory risk" },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 shrink-0 rounded-md bg-[#f5f5f7] flex items-center justify-center text-[10px] font-bold text-[#6e6e73]">{step}</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1d1d1f]">{label}</p>
                      <p className="text-[11px] text-[#aeaeb2] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
