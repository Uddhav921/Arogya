"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  User, Loader2, Pencil, Save, X, Check,
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
      // Update patient data
      await api.updatePatient(patientId, {
        name: editForm.name,
        age: parseInt(editForm.age) || null,
        sex: editForm.sex,
        weight_kg: parseFloat(editForm.weight_kg) || null,
        height_cm: parseFloat(editForm.height_cm) || null,
        known_conditions: editForm.known_conditions,
      });

      // Update profile/lifestyle data
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
    return <AppShell><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-5 h-5 animate-spin text-[#aeaeb2]" /></div></AppShell>;
  }

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} type="button"
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all active:scale-[0.97] ${
        active ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73]"
      }`}>
      {active && <Check className="w-3 h-3 inline mr-1" />}
      {label.replace(/_/g, " ")}
    </button>
  );

  const familyHistory = profile?.family_history_list || (typeof profile?.family_history === "string" ? profile?.family_history.split(",").map(s => s.trim()) : profile?.family_history || []);

  return (
    <AppShell>
      <div className="animate-fadeUp">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#1d1d1f]">{(patient?.name || "U")[0].toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#1d1d1f]">{patient?.name || "User"}</h1>
            <p className="text-[12px] text-[#aeaeb2]">ID: {patientId}</p>
          </div>
          {!editing ? (
            <button onClick={startEditing}
              className="px-4 py-2 rounded-xl bg-[#007aff] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98]">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="px-3 py-2 rounded-xl text-[13px] font-medium text-[#6e6e73] bg-[#f5f5f7]">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#34c759] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
              </button>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-4">
          {/* ─── Left: Body Metrics ─── */}
          <div className="bg-white rounded-2xl overflow-hidden mb-4 lg:mb-0">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Body Metrics</p>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {editing ? (
                <div className="px-5 py-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Name</label>
                    <input type="text" value={editForm.name} onChange={e => update("name", e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Age</label>
                      <input type="number" value={editForm.age} onChange={e => update("age", e.target.value)}
                        min="1" max="120"
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Sex</label>
                      <select value={editForm.sex} onChange={e => update("sex", e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Weight (kg)</label>
                      <input type="number" value={editForm.weight_kg} onChange={e => update("weight_kg", e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Height (cm)</label>
                      <input type="number" value={editForm.height_cm} onChange={e => update("height_cm", e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Known Conditions</label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITIONS.map(c => (
                        <Pill key={c} label={c} active={editForm.known_conditions?.includes(c)} onClick={() => toggleArray("known_conditions", c)} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    ["Name", patient?.name || "—"],
                    ["Age", patient?.age ? `${patient.age} years` : "—"],
                    ["Sex", patient?.sex || "—"],
                    ["Weight", patient?.weight_kg ? `${patient.weight_kg} kg` : "—"],
                    ["Height", patient?.height_cm ? `${patient.height_cm} cm` : "—"],
                    ["BMI", patient?.bmi || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[13px] text-[#6e6e73]">{label}</span>
                      <span className="text-[13px] font-medium text-[#1d1d1f] capitalize">{value}</span>
                    </div>
                  ))}
                  {patient?.known_conditions?.filter(c => c !== "none").length > 0 && (
                    <div className="px-5 py-3">
                      <span className="text-[13px] text-[#6e6e73] block mb-2">Known Conditions</span>
                      <div className="flex flex-wrap gap-1.5">
                        {patient.known_conditions.filter(c => c !== "none").map((c, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize bg-[#1d1d1f] text-white">{c.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ─── Right: Lifestyle ─── */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">Lifestyle & History</p>
            </div>
            {editing ? (
              <div className="px-5 py-3 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Exercise</label>
                  <div className="flex flex-wrap gap-2">
                    {EXERCISE_OPTIONS.map(o => <Pill key={o} label={o} active={editForm.exercise_frequency === o} onClick={() => update("exercise_frequency", o)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Stress</label>
                  <div className="flex flex-wrap gap-2">
                    {STRESS_OPTIONS.map(o => <Pill key={o} label={o} active={editForm.stress_level === o} onClick={() => update("stress_level", o)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Smoking</label>
                  <div className="flex flex-wrap gap-2">
                    {SMOKING_OPTIONS.map(o => <Pill key={o} label={o} active={editForm.smoking_status === o} onClick={() => update("smoking_status", o)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Alcohol</label>
                  <div className="flex flex-wrap gap-2">
                    {ALCOHOL_OPTIONS.map(o => <Pill key={o} label={o} active={editForm.alcohol_use === o} onClick={() => update("alcohol_use", o)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Diet</label>
                  <div className="flex flex-wrap gap-2">
                    {DIET_OPTIONS.map(o => <Pill key={o} label={o} active={editForm.diet_type === o} onClick={() => update("diet_type", o)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Sleep (hours)</label>
                  <div className="flex flex-wrap gap-2">
                    {SLEEP_OPTIONS.map(h => <Pill key={h} label={`${h} hrs`} active={editForm.sleep_hours === h} onClick={() => update("sleep_hours", h)} />)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase">Location</label>
                  <input type="text" value={editForm.location} onChange={e => update("location", e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="mt-1 w-full h-10 px-3 rounded-lg bg-[#f5f5f7] text-[13px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#aeaeb2] uppercase mb-2 block">Family History</label>
                  <div className="flex flex-wrap gap-2">
                    {FAMILY_HISTORY.map(c => <Pill key={c} label={c} active={editForm.family_history?.includes?.(c)} onClick={() => toggleArray("family_history", c)} />)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {[
                  ["Exercise", profile?.exercise_frequency],
                  ["Sleep", profile?.sleep_hours ? `${profile.sleep_hours} hrs` : null],
                  ["Stress", profile?.stress_level],
                  ["Smoking", profile?.smoking_status],
                  ["Alcohol", profile?.alcohol_use],
                  ["Diet", profile?.diet_type],
                  ["Location", profile?.location],
                ].map(([label, value]) => (
                  <div key={label} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-[13px] text-[#6e6e73]">{label}</span>
                    <span className="text-[13px] font-medium text-[#1d1d1f] capitalize">{(value || "—").replace?.(/_ /g, " ") ?? value}</span>
                  </div>
                ))}
                {familyHistory.length > 0 && familyHistory[0] !== "none" && (
                  <div className="px-5 py-3">
                    <span className="text-[13px] text-[#6e6e73] block mb-2">Family History</span>
                    <div className="flex flex-wrap gap-1.5">
                      {familyHistory.filter(c => c && c !== "none").map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize bg-[#f5f5f7] text-[#6e6e73]">{c.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
