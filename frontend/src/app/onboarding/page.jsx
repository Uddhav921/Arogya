"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = ["Lifestyle", "Health History", "Review"];

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

export default function OnboardingPage() {
  const router = useRouter();
  const { patientId, loading: authLoading } = usePatient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    exercise_frequency: "moderate",
    stress_level: "moderate",
    smoking_status: "none",
    alcohol_use: "none",
    diet_type: "balanced",
    sleep_hours: 7,
    location: "",
    known_conditions: [],
    family_history: [],
  });

  useEffect(() => {
    if (!authLoading && !patientId) router.replace("/auth");
  }, [patientId, authLoading]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key, val) => {
    setForm(prev => {
      const arr = prev[key] || [];
      if (val === "none") return { ...prev, [key]: ["none"] };
      const filtered = arr.filter(x => x !== "none");
      return {
        ...prev,
        [key]: filtered.includes(val) ? filtered.filter(x => x !== val) : [...filtered, val],
      };
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.updateProfile(patientId, form);
      if (form.known_conditions.length && !form.known_conditions.includes("none")) {
        await api.updatePatient(patientId, { known_conditions: form.known_conditions });
      }
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-[13px] font-medium capitalize transition-all active:scale-[0.97] ${
        active
          ? "bg-[#1d1d1f] text-white"
          : "bg-[#f5f5f7] text-[#6e6e73] border border-[#e5e5ea]"
      }`}>
      {active && <Check className="w-3 h-3 inline mr-1.5" />}
      {label.replace(/_/g, " ")}
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 max-w-lg mx-auto">
        <p className="text-[11px] font-medium text-[#aeaeb2] tracking-widest uppercase">Step {step + 1} of {STEPS.length}</p>
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mt-1">{STEPS[step]}</h1>
        {/* Progress */}
        <div className="flex gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full transition-colors duration-300"
              style={{ background: i <= step ? "#1d1d1f" : "#e5e5ea" }} />
          ))}
        </div>
      </div>

      <div className="px-6 max-w-lg mx-auto animate-fadeUp">
        {/* Step 0 — Lifestyle */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Exercise</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXERCISE_OPTIONS.map(o => (
                  <Pill key={o} label={o} active={form.exercise_frequency === o} onClick={() => update("exercise_frequency", o)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Stress Level</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STRESS_OPTIONS.map(o => (
                  <Pill key={o} label={o} active={form.stress_level === o} onClick={() => update("stress_level", o)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Smoking</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SMOKING_OPTIONS.map(o => (
                  <Pill key={o} label={o} active={form.smoking_status === o} onClick={() => update("smoking_status", o)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Alcohol Use</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALCOHOL_OPTIONS.map(o => (
                  <Pill key={o} label={o} active={form.alcohol_use === o} onClick={() => update("alcohol_use", o)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Diet</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIET_OPTIONS.map(o => (
                  <Pill key={o} label={o} active={form.diet_type === o} onClick={() => update("diet_type", o)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Sleep (hours/night)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SLEEP_OPTIONS.map(h => (
                  <Pill key={h} label={`${h} hrs`} active={form.sleep_hours === h} onClick={() => update("sleep_hours", h)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">City / Location</label>
              <input type="text" value={form.location} onChange={e => update("location", e.target.value)}
                placeholder="e.g. Mumbai"
                className="mt-2 w-full h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
            </div>
          </div>
        )}

        {/* Step 1 — Health History */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Known Conditions</label>
              <p className="text-[12px] text-[#aeaeb2] mt-1 mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map(c => (
                  <Pill key={c} label={c} active={form.known_conditions.includes(c)} onClick={() => toggleArray("known_conditions", c)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wide">Family History</label>
              <p className="text-[12px] text-[#aeaeb2] mt-1 mb-2">Runs in the family</p>
              <div className="flex flex-wrap gap-2">
                {FAMILY_HISTORY.map(c => (
                  <Pill key={c} label={c} active={form.family_history.includes(c)} onClick={() => toggleArray("family_history", c)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <div className="space-y-4">
            {[
              ["Exercise", form.exercise_frequency],
              ["Stress", form.stress_level],
              ["Smoking", form.smoking_status],
              ["Alcohol", form.alcohol_use],
              ["Diet", form.diet_type],
              ["Sleep", `${form.sleep_hours} hrs`],
              ["Location", form.location || "—"],
              ["Conditions", form.known_conditions.join(", ") || "—"],
              ["Family History", form.family_history.join(", ") || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] text-[#6e6e73]">{label}</span>
                <span className="text-[13px] font-medium text-[#1d1d1f] capitalize">{value.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-8 pb-12">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="h-12 px-5 rounded-xl border border-[#e5e5ea] text-[13px] font-medium text-[#6e6e73] flex items-center gap-1.5 transition-all active:scale-[0.98]">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button onClick={step < 2 ? () => setStep(step + 1) : handleFinish} disabled={saving}
            className="flex-1 h-12 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : step < 2 ? (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            ) : "Finish Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
