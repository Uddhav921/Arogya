"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import LandingPage from "@/app/landing/page";

export default function RootPage() {
  const router = useRouter();
  const { patientId, loading } = usePatient();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (patientId) {
      router.replace("/dashboard");
    } else {
      setShowLanding(true);
    }
  }, [patientId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-5">
        <div className="w-12 h-12 rounded-[14px] bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent"></div>
          <span className="text-[20px] font-black text-white tracking-tight relative z-10 block mt-1">V</span>
        </div>
        <div className="flex flex-col items-center gap-2">
           <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (showLanding) return <LandingPage />;
  return null;
}
