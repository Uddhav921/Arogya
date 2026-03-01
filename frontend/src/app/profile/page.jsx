"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  User, Loader2, Pencil, Save, X, Check, Activity, Heart, Moon, Wind, Coffee, Scale, Shield, MapPin, Database, Sparkles, ChevronRight
} from "lucide-react";

const EXERCISE_OPTIONS = ["sedentary", "light", "moderate", "active"];
const STRESS_OPTIONS = ["low", "moderate", "high"];
const SMOKING_OPTIONS = ["none", "former", "current"];
const ALCOHOL_OPTIONS = ["none", "light", "moderate", "heavy"];
const DIET_OPTIONS = ["balanced", "vegetarian", "non-vegetarian", "vegan"];
const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

const CONDITIONS = [
  "diabetes", "hypertension", "asthma", "heart_disease",
  "thyroid", "arthritis", "depression", "none",
];
const FAMILY_HISTORY = ["diabetes", "heart_disease", "cancer", "hypertension", "none"];

export default function ProfilePage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!authLoading && !patientId) { router.replace("/auth"); return; }
    if (patientId) loadData();
  }, [patientId, authLoading]);

  const loadData = async () => {
    try {
      const [p, pr] = await Promise.all([
        api.getPatient(patientId),
        api.getProfile(patientId).catch(() => null),
      ]);
      setPatient(p);
      setProfile(pr);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startEditing = () => {
    setEditForm({
      name: patient?.name || "",
      age: patient?.age || "",
      sex: patient?.sex || "male",
      weight_kg: patient?.weight_kg || "",
      height_cm: patient?.height_cm || "",
      known_conditions: patient?.known_conditions || [],
      exercise_frequency: profile?.exercise_frequency || "moderate",
      stress_level: profile?.stress_level || "moderate",
      smoking_status: profile?.smoking_status || "none",
      alcohol_use: profile?.alcohol_use || "none",
      diet_type: profile?.diet_type || "balanced",
      sleep_hours: profile?.sleep_hours || 7,
      location: profile?.location || "",
      family_history: profile?.family_history_list || profile?.family_history || [],
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updatePatient(patientId, {
        name: editForm.name,
        age: parseInt(editForm.age) || null,
        sex: editForm.sex,
        weight_kg: parseFloat(editForm.weight_kg) || null,
        height_cm: parseFloat(editForm.height_cm) || null,
        known_conditions: editForm.known_conditions,
      });

      await api.updateProfile(patientId, {
        exercise_frequency: editForm.exercise_frequency,
        stress_level: editForm.stress_level,
        smoking_status: editForm.smoking_status,
        alcohol_use: editForm.alcohol_use,
        diet_type: editForm.diet_type,
        sleep_hours: editForm.sleep_hours,
        location: editForm.location,
        family_history: editForm.family_history,
      });

      setEditing(false);
      await loadData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const update = (key, val) => setEditForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key, val) => {
    setEditForm(prev => {
      const arr = prev[key] || [];
      if (val === "none") return { ...prev, [key]: ["none"] };
      const filtered = arr.filter(x => x !== "none");
      return {
        ...prev,
        [key]: filtered.includes(val) ? filtered.filter(x => x !== val) : [...filtered, val],
      };
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-zinc-500 font-mono text-[13px] animate-pulse">Loading Profile Context...</p>
        </div>
      </AppShell>
    );
  }

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} type="button"
      className={`px-4 py-2 rounded-xl text-[13px] font-bold capitalize transition-all active:scale-[0.97] border ${
        active 
          ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
      }`}>
      {active && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
      {label.replace(/_/g, " ")}
    </button>
  );

  const familyHistory = profile?.family_history_list || (typeof profile?.family_history === "string" ? profile?.family_history.split(",").map(s => s.trim()) : profile?.family_history || []);
  const initials = (patient?.name || "U").substring(0, 2).toUpperCase();

  return (
    <AppShell>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-[1200px] mx-auto pb-12"
      >
        {/* ═════════ HEADER ═════════ */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 lg:p-10 mb-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
           
           <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto text-center md:text-left">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-2xl">
                 <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-4 border-black">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider uppercase">{initials}</span>
                 </div>
              </div>
              <div>
                <h1 className="text-[32px] font-extrabold text-white tracking-tight mb-1">{patient?.name || "User"}</h1>
                <p className="text-[14px] text-zinc-500 font-mono bg-zinc-950/50 px-3 py-1 rounded-lg inline-flex items-center gap-2 border border-zinc-800/50 backdrop-blur-sm">
                  <Database className="w-3.5 h-3.5 text-blue-500" /> ID: {patientId}
                </p>
              </div>
           </div>

           <div className="relative z-10 w-full md:w-auto flex justify-center md:justify-end">
              {!editing ? (
                <button onClick={startEditing}
                  className="px-6 py-3 rounded-xl bg-white text-black text-[14px] font-bold flex items-center gap-2 transition-all hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  <Pencil className="w-4 h-4" /> Edit Profile Context
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditing(false)}
                    className="px-5 py-3 rounded-xl text-[14px] font-bold text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 transition-colors">
                    Discard
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[14px] font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              )}
           </div>
        </div>

        {/* ═════════ CONTENT GRID ═════════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* 1. Body Metrics & Clinical Baseline */}
          <div className="space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden">
                <div className="p-6 md:p-8 border-b border-zinc-800/50 bg-zinc-950/20">
                   <h2 className="text-[20px] font-bold text-white flex items-center gap-2">
                     <User className="w-5 h-5 text-blue-400" /> Clinical Baseline
                   </h2>
                   <p className="text-[13px] text-zinc-500 mt-1">Core physiological parameters used for risk stratification.</p>
                </div>
                
                <div className="p-6 md:p-8">
                  {editing ? (
                    <div className="space-y-5 animate-fadeIn">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Age</label>
                            <input type="number" value={editForm.age} onChange={e => update("age", e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[14px] text-white outline-none focus:border-blue-500 transition-colors" />
                          </div>
                          <div>
                            <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Sex</label>
                            <select value={editForm.sex} onChange={e => update("sex", e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[14px] text-white outline-none focus:border-blue-500 transition-colors">
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Weight (kg)</label>
                            <input type="number" value={editForm.weight_kg} onChange={e => update("weight_kg", e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[14px] text-white outline-none focus:border-blue-500 transition-colors" />
                          </div>
                          <div>
                            <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Height (cm)</label>
                            <input type="number" value={editForm.height_cm} onChange={e => update("height_cm", e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[14px] text-white outline-none focus:border-blue-500 transition-colors" />
                          </div>
                       </div>
                       
                       <div className="pt-4 border-t border-zinc-800/50">
                         <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                           <Shield className="w-4 h-4 text-rose-500"/> Known Conditions
                         </label>
                         <div className="flex flex-wrap gap-2.5">
                           {CONDITIONS.map(c => (
                             <Pill key={c} label={c} active={editForm.known_conditions?.includes(c)} onClick={() => toggleArray("known_conditions", c)} />
                           ))}
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Age", value: patient?.age ? `${patient.age} yrs` : "—" },
                            { label: "Sex", value: patient?.sex || "—" },
                            { label: "Weight", value: patient?.weight_kg ? `${patient.weight_kg} kg` : "—" },
                            { label: "Height", value: patient?.height_cm ? `${patient.height_cm} cm` : "—" },
                            { label: "BMI", value: patient?.bmi || "—" }
                          ].map(item => (
                             <div key={item.label} className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-center">
                               <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{item.label}</p>
                               <p className="text-[16px] font-medium text-white capitalize">{item.value}</p>
                             </div>
                          ))}
                       </div>
                       
                       {patient?.known_conditions?.filter(c => c !== "none").length > 0 && (
                         <div className="mt-6 pt-6 border-t border-zinc-800/50">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500"/> Known Conditions</p>
                            <div className="flex flex-wrap gap-2">
                              {patient.known_conditions.filter(c => c !== "none").map((c, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                  {c.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
             </div>
             
             {/* Read-only Context Module */}
             {!editing && (
               <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white mb-1">Context Injected</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                      Your profile metrics are automatically embedded into the <b>z.ai Engine</b> context window on every symptom assessment, completely bypassing the need for redundant setup.
                    </p>
                  </div>
               </div>
             )}
          </div>

          {/* 2. Lifestyle & Habits */}
          <div className="space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden">
                <div className="p-6 md:p-8 border-b border-zinc-800/50 bg-zinc-950/20">
                   <h2 className="text-[20px] font-bold text-white flex items-center gap-2">
                     <Activity className="w-5 h-5 text-emerald-400" /> Lifestyle & Environment
                   </h2>
                   <p className="text-[13px] text-zinc-500 mt-1">Behavioral factors driving long-term probabilistic risks.</p>
                </div>

                <div className="p-6 md:p-8">
                  {editing ? (
                    <div className="space-y-6 animate-fadeIn">
                      {[
                        { label: "Exercise Frequency", key: "exercise_frequency", options: EXERCISE_OPTIONS, icon: Activity },
                        { label: "Diet Patterns", key: "diet_type", options: DIET_OPTIONS, icon: Coffee },
                        { label: "Stress Levels", key: "stress_level", options: STRESS_OPTIONS, icon: Wind },
                        { label: "Sleep (Hours)", key: "sleep_hours", options: SLEEP_OPTIONS, icon: Moon, format: v => `${v} hrs` },
                        { label: "Smoking History", key: "smoking_status", options: SMOKING_OPTIONS, icon: Wind },
                        { label: "Alcohol Consumption", key: "alcohol_use", options: ALCOHOL_OPTIONS, icon: Coffee },
                      ].map(group => (
                        <div key={group.key}>
                          <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                            <group.icon className="w-4 h-4 text-emerald-500" /> {group.label}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map(o => (
                              <Pill key={o} label={group.format ? group.format(o) : o.toString()} active={editForm[group.key] === o} onClick={() => update(group.key, o)} />
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-zinc-800/50">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-amber-500" /> Location (AQI Context)
                        </label>
                        <input type="text" value={editForm.location} onChange={e => update("location", e.target.value)}
                          placeholder="e.g. Mumbai"
                          className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-amber-500 transition-colors" />
                      </div>

                      <div className="pt-4 border-t border-zinc-800/50">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-500" /> Family History
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {FAMILY_HISTORY.map(c => <Pill key={c} label={c} active={editForm.family_history?.includes?.(c)} onClick={() => toggleArray("family_history", c)} />)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fadeIn divide-y divide-zinc-800/50">
                       {[
                         { label: "Exercise", value: profile?.exercise_frequency, icon: Activity },
                         { label: "Sleep", value: profile?.sleep_hours ? `${profile.sleep_hours} hrs` : null, icon: Moon },
                         { label: "Stress", value: profile?.stress_level, icon: Wind },
                         { label: "Diet", value: profile?.diet_type, icon: Coffee },
                         { label: "Smoking", value: profile?.smoking_status, icon: Wind },
                         { label: "Alcohol", value: profile?.alcohol_use, icon: Coffee },
                         { label: "Location", value: profile?.location, icon: MapPin },
                       ].map(item => (
                         <div key={item.label} className="py-4 flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                <item.icon className="w-4 h-4 text-emerald-400" />
                              </div>
                              <span className="text-[14px] font-bold text-zinc-400">{item.label}</span>
                           </div>
                           <span className="text-[14px] font-bold text-white capitalize bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/50">
                             {(item.value || "—").toString().replace?.(/_ /g, " ") ?? item.value}
                           </span>
                         </div>
                       ))}
                       
                       {familyHistory.length > 0 && familyHistory[0] !== "none" && (
                         <div className="pt-5 mt-2">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500"/> Family History</p>
                            <div className="flex flex-wrap gap-2">
                              {familyHistory.filter(c => c && c !== "none").map((c, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                  {c.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
             </div>
          </div>

        </div>
      </motion.div>
    </AppShell>
  );
}
