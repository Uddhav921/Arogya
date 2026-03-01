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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#1d1d1f] flex items-center justify-center">
          <span className="text-[13px] font-bold text-white tracking-tight">A</span>
        </div>
        <p className="text-[13px] text-[#aeaeb2] font-medium">Loading…</p>
      </div>
    );
  }

  if (showLanding) return <LandingPage />;
  return null;
}
