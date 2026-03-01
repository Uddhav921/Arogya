"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  Stethoscope, Heart, Brain, Wind,
  Calendar, Check, ArrowLeft, MapPin, Star,
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
        <div className="animate-fadeUp max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#34c759]/10 mx-auto flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#34c759]" />
            </div>
            <h2 className="text-lg font-bold text-[#1d1d1f]">Booking Confirmed</h2>
            <p className="text-[13px] text-[#aeaeb2] mt-1">Your appointment has been scheduled</p>

            <div className="mt-5 bg-[#f5f5f7] rounded-xl p-4 text-left">
              <p className="text-[14px] font-semibold text-[#1d1d1f]">{doc.name}</p>
              <p className="text-[12px] text-[#6e6e73] mt-0.5">{doc.specialty}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73]">
                  <Calendar className="w-3.5 h-3.5" /> {doc.available}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73]">
                  <MapPin className="w-3.5 h-3.5" /> Video Call
                </div>
              </div>
            </div>

            <button onClick={() => router.push("/dashboard")}
              className="mt-5 w-full h-12 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-semibold transition-all active:scale-[0.98]">
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="animate-fadeUp lg:grid lg:grid-cols-[1fr_320px] lg:gap-4">
        {/* Left: Doctor list */}
        <div>
          <div className="bg-white rounded-2xl p-5 mb-4">
            <button onClick={() => router.back()}
              className="flex items-center gap-1 text-[12px] text-[#6e6e73] mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <h1 className="text-xl font-bold text-[#1d1d1f]">Book a Doctor</h1>
            <p className="text-[12px] text-[#aeaeb2] mt-0.5">Select a specialist based on your assessment</p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0f0f0]">
            {DOCTORS.map((doc, i) => {
              const isSelected = selected === i;
              const Icon = doc.icon;
              return (
                <button key={i} onClick={() => setSelected(isSelected ? null : i)}
                  className={`w-full p-4 lg:p-5 flex items-center gap-4 text-left transition-colors ${isSelected ? "bg-[#f5f5f7]" : "hover:bg-[#fafafa]"}`}>
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#6e6e73]" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">{doc.name}</p>
                    <p className="text-[12px] text-[#aeaeb2]">{doc.specialty} · {doc.experience}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#ff9500] text-[#ff9500]" />
                        <span className="text-[11px] font-semibold text-[#1d1d1f]">{doc.rating}</span>
                      </div>
                      <span className="text-[10px] text-[#aeaeb2]">{doc.available}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[#007aff]" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <button onClick={() => setConfirmed(true)}
              className="mt-4 w-full h-12 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              <Calendar className="w-4 h-4" /> Confirm Booking
            </button>
          )}
        </div>

        {/* Right: info panel */}
        <div className="mt-4 lg:mt-0">
          <div className="bg-white rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">Booking Info</p>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#f5f5f7]">
                <p className="text-[12px] font-semibold text-[#1d1d1f]">Video Consultation</p>
                <p className="text-[11px] text-[#6e6e73]">All appointments are conducted via video call with the doctor.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#f5f5f7]">
                <p className="text-[12px] font-semibold text-[#1d1d1f]">Context Shared</p>
                <p className="text-[11px] text-[#6e6e73]">Your assessment results, records, and vitals can be shared with the doctor for better diagnosis.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#f5f5f7]">
                <p className="text-[12px] font-semibold text-[#1d1d1f]">Follow-up</p>
                <p className="text-[11px] text-[#6e6e73]">After consultation, new prescriptions and diagnoses are added to your records automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
