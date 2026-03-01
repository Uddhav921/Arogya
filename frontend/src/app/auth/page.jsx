"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { login } = usePatient();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        if (!name.trim() || !age.trim()) {
          setError("Name and age are required.");
          setLoading(false);
          return;
        }
        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
          setError("Please enter a valid age (1-120).");
          setLoading(false);
          return;
        }
        const res = await api.register({
          username: username.trim(),
          password,
          name: name.trim(),
          age: parsedAge,
          sex,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
        });
        login(res.patient_id, username.trim(), { name: name.trim() });
        localStorage.setItem("aroga_patient_name", name.trim());
        router.replace("/onboarding");
      } else {
        const res = await api.login({ username: username.trim(), password });
        login(res.patient_id, username.trim(), res.patient || null);
        if (res.patient?.name) localStorage.setItem("aroga_patient_name", res.patient.name);
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fadeUp">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#1d1d1f] flex items-center justify-center mx-auto mb-4">
            <span className="text-[15px] font-bold text-white">V</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-[13px] text-[#6e6e73] mt-1">
            {isSignUp ? "Set up your health profile" : "Sign in to Arogya by VAKR"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />

          {isSignUp && (
            <div className="space-y-3 pt-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name *"
                className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                  placeholder="Age *" min="1" max="120"
                  className="h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
                <select value={sex} onChange={e => setSex(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                  placeholder="Weight (kg)"
                  className="h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
                <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  placeholder="Height (cm)"
                  className="h-12 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none border border-transparent focus:border-[#d2d2d7] transition-colors" />
              </div>
            </div>
          )}

          {error && <p className="text-[12px] text-[#ff3b30] text-center">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full h-12 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-[13px] text-[#6e6e73] mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-[#1d1d1f] font-semibold hover:underline">
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </div>
  );
}
