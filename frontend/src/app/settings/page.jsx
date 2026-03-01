"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  RefreshCw, LogOut, ChevronRight, Loader2, User, FolderOpen, Info,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = usePatient();
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const handleSimulate = async () => {
    setSimulating(true); setSimResult(null);
    try { await api.triggerSimulation(); setSimResult("success"); }
    catch { setSimResult("error"); }
    finally { setSimulating(false); }
  };

  const handleLogout = () => { logout(); router.replace("/auth"); };

  return (
    <AppShell>
      <div className="animate-fadeUp">
        <div className="lg:grid lg:grid-cols-2 lg:gap-4">

          {/* ─── Left column ─── */}
          <div className="space-y-4">
            {/* Simulation */}
            <div className="bg-white rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">Data Simulation</p>
              <p className="text-[13px] text-[#6e6e73] mb-3">Generate simulated wearable data (heart rate, SpO₂, BP, sleep, steps) for testing the context-aware assessment pipeline.</p>
              <button onClick={handleSimulate} disabled={simulating}
                className="w-full h-11 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
                {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {simulating ? "Generating…" : "Generate Vitals"}
              </button>
              {simResult === "success" && <p className="text-[11px] text-[#34c759] text-center mt-2">✓ Generated successfully</p>}
              {simResult === "error" && <p className="text-[11px] text-[#ff3b30] text-center mt-2">✗ Failed — is backend running?</p>}
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0f0f0]">
              <button onClick={() => router.push("/profile")}
                className="w-full px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-[#fafafa]">
                <User className="w-4 h-4 text-[#6e6e73]" strokeWidth={1.6} />
                <span className="flex-1 text-left text-[14px] text-[#1d1d1f]">View & Edit Profile</span>
                <ChevronRight className="w-4 h-4 text-[#d2d2d7]" />
              </button>
              <button onClick={() => router.push("/records")}
                className="w-full px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-[#fafafa]">
                <FolderOpen className="w-4 h-4 text-[#6e6e73]" strokeWidth={1.6} />
                <span className="flex-1 text-left text-[14px] text-[#1d1d1f]">Medical Records</span>
                <ChevronRight className="w-4 h-4 text-[#d2d2d7]" />
              </button>
              <button onClick={handleLogout}
                className="w-full px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-[#fafafa]">
                <LogOut className="w-4 h-4 text-[#ff3b30]" />
                <span className="flex-1 text-left text-[14px] font-medium text-[#ff3b30]">Sign Out</span>
              </button>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-5 text-center">
              <p className="text-[13px] font-bold text-[#1d1d1f]">VAKR</p>
              <p className="text-[11px] text-[#aeaeb2]">Preventive Health Intelligence · v1.0</p>
            </div>
          </div>

          {/* ─── Right column: testing guide ─── */}
          <div>
            <div className="bg-white rounded-2xl p-5 mt-4 lg:mt-0">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Context-Aware Testing Guide</p>
              <p className="text-[12px] text-[#6e6e73] mb-4 leading-relaxed">
                Follow these steps to see how VAKR's context pipeline works end-to-end:
              </p>
              <div className="space-y-3">
                {[
                  { step: "1", label: "Add medical records", desc: "Go to Records → Add a diagnosis like 'Type 2 Diabetes' or 'Hypertension'. These records set risk flags in the triage engine." },
                  { step: "2", label: "Complete your profile", desc: "Go to Profile → Edit → Set your age, weight, lifestyle data (smoking, alcohol, stress). These feed into ML risk models." },
                  { step: "3", label: "Generate wearable vitals", desc: "Click 'Generate Vitals' above. This simulates heart rate, SpO₂, blood pressure, sleep, and steps data." },
                  { step: "4", label: "Run an assessment", desc: "Go to Assessment → Select symptoms → Run. Check the 'Data Sources Used' panel to see which context was active." },
                  { step: "5", label: "Verify context impact", desc: "With a diabetes record + chest pain symptom, triage should escalate. The ML risk section shows XGBoost + SHAP results." },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="flex items-start gap-3 p-3 rounded-xl bg-[#f5f5f7]">
                    <span className="w-6 h-6 shrink-0 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-[11px] font-bold text-white">{step}</span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1d1d1f]">{label}</p>
                      <p className="text-[11px] text-[#6e6e73] leading-relaxed mt-0.5">{desc}</p>
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
