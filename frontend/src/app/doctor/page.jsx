"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  Stethoscope, Heart, Brain, Wind,
  Calendar, Check, ArrowLeft, MapPin, Star,
  Clock, Shield
} from "lucide-react";

const DOCTORS = [
  { name: "Dr. Aditi Sharma", specialty: "General Physician", rating: 4.9, experience: "12 years", icon: Stethoscope, available: "Today, 4:00 PM" },
  { name: "Dr. Rajesh Patel", specialty: "Cardiologist", rating: 4.8, experience: "18 years", icon: Heart, available: "Tomorrow, 10:00 AM" },
  { name: "Dr. Priya Menon", specialty: "Internal Medicine", rating: 4.7, experience: "15 years", icon: Brain, available: "Today, 6:30 PM" },
  { name: "Dr. Vikram Singh", specialty: "Pulmonologist", rating: 4.9, experience: "20 years", icon: Wind, available: "Wed, 11:00 AM" },
];

export default function DoctorPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed && selected !== null) {
    const doc = DOCTORS[selected];
    return (
      <AppShell>
        <div className="animate-fadeUp max-w-[500px] mx-auto mt-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Booking Confirmed</h2>
            <p className="text-[14px] text-zinc-400 mt-2 font-medium">Your appointment has been securely scheduled</p>

            <div className="mt-8 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-5 text-left flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                 <doc.icon className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-white">{doc.name}</p>
                <p className="text-[13px] text-zinc-500 font-medium tracking-wide mt-0.5">{doc.specialty}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg w-fit">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" /> {doc.available}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg w-fit">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Video Call
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => router.push("/dashboard")}
              className="mt-8 w-full h-14 rounded-xl bg-white text-black text-[15px] font-bold transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
               Return to Dashboard <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="animate-fadeUp lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 max-w-[1200px] mx-auto pb-10">
        {/* Left: Doctor list */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 text-left rounded-3xl p-6 md:p-8 flex flex-col items-start relative overflow-hidden">
             
            <button onClick={() => router.back()}
              className="flex items-center gap-2 text-[13px] font-bold text-zinc-500 hover:text-white transition-colors mb-6 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <h1 className="text-[28px] md:text-3xl font-extrabold text-white tracking-tight">Clinical Specialists</h1>
            <p className="text-[14px] text-zinc-400 mt-2 max-w-md leading-relaxed font-medium">Select a highly-rated specialist based on your z.ai diagnostic assessment.</p>
          </div>

          <div className="space-y-3">
            {DOCTORS.map((doc, i) => {
              const isSelected = selected === i;
              const Icon = doc.icon;
              return (
                <button key={i} onClick={() => setSelected(isSelected ? null : i)}
                  className={`w-full p-5 lg:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all border ${
                     isSelected 
                        ? "bg-zinc-800/80 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.1)] scale-[1.01]" 
                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700"
                  }`}>
                  
                  <div className="flex items-start sm:items-center gap-4 flex-1 w-full min-w-0">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800 border-zinc-700"}`}>
                       <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-500" : "text-zinc-400"}`} strokeWidth={2} />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className={`text-[15px] font-bold truncate ${isSelected ? "text-emerald-400" : "text-white"}`}>{doc.name}</p>
                       <p className="text-[13px] font-medium text-zinc-500 tracking-wide mt-0.5">{doc.specialty} <span className="text-zinc-700 mx-1">•</span> {doc.experience}</p>
                     </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-1.5 mt-2 sm:mt-0 w-full sm:w-auto shrink-0 justify-between sm:justify-center">
                     <div className="flex items-center gap-1.5 bg-zinc-950/50 border border-zinc-800 px-2 py-1 rounded-md">
                       <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                       <span className="text-[12px] font-bold text-zinc-200">{doc.rating}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 bg-zinc-950/50 border border-zinc-800 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-zinc-500"/> {doc.available}
                     </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="animate-fadeUp sticky bottom-6 z-10 p-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl">
               <button onClick={() => setConfirmed(true)}
                 className="w-full h-14 rounded-2xl bg-white hover:bg-zinc-200 text-black text-[15px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                 <Calendar className="w-5 h-5" /> Confirm Teleconsultation
               </button>
            </div>
          )}
        </div>

        {/* Right: info panel */}
        <div className="mt-6 lg:mt-0 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8 sticky top-24 shadow-sm">
            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Shield className="w-4 h-4"/> Security & Context</p>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                <p className="text-[13px] font-bold text-white mb-1.5 relative z-10">End-to-End Encryption</p>
                <p className="text-[12px] text-zinc-400 font-medium leading-relaxed relative z-10">All video consultations are secured. VAKR Health never records your calls without explicit consent.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                <p className="text-[13px] font-bold text-white mb-1.5 relative z-10">z.ai Summary Sharing</p>
                <p className="text-[12px] text-zinc-400 font-medium leading-relaxed relative z-10">Your clinical assessment graphs and previous records are shared with the doctor to ensure a precise diagnosis.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                <p className="text-[13px] font-bold text-white mb-1.5 relative z-10">Automated Follow-ups</p>
                <p className="text-[12px] text-zinc-400 font-medium leading-relaxed relative z-10">Any prescriptions generated during this call will automatically sync to your secure Records vault.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
