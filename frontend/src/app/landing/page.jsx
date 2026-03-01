"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Shield, Brain, Stethoscope, Wind, FileText, MessageSquare,
  ChevronRight, ArrowRight, Heart, Zap, Database, BarChart3, Smartphone,
  LineChart, Eye, Star, Lock, Users, CheckCircle2, Sparkles, Network,
} from "lucide-react";

/* ── Animated counter ── */
function CountUp({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Fade-in section ── */
function FadeSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] antialiased">
      {/* ════════════════ NAV ════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-[#f0f0f0] shadow-sm" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1d1d1f] flex items-center justify-center">
              <span className="text-[13px] font-bold text-white tracking-tight">V</span>
            </div>
            <span className="text-[16px] font-bold tracking-tight">VAKR</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#6e6e73]">
            <a href="#features" className="hover:text-[#1d1d1f] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#1d1d1f] transition-colors">How It Works</a>
            <a href="#tech" className="hover:text-[#1d1d1f] transition-colors">Technology</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/auth")}
              className="px-4 py-2 text-[13px] font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
              Sign In
            </button>
            <button onClick={() => router.push("/auth")}
              className="px-5 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-semibold transition-all hover:bg-[#2d2d2f] active:scale-95">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] to-white pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1d1d1f 1px, transparent 0)", backgroundSize: "48px 48px" }} />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e8e8ed] text-[11px] font-semibold text-[#6e6e73] uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#ff9500]" />
            AI-Powered Preventive Health Intelligence
          </div>

          <h1 className="text-[42px] md:text-[64px] font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Your health.
            <br />
            <span className="bg-gradient-to-r from-[#1d1d1f] via-[#6e6e73] to-[#1d1d1f] bg-clip-text text-transparent">
              Understood deeply.
            </span>
          </h1>

          <p className="text-[17px] md:text-[19px] text-[#6e6e73] leading-relaxed max-w-2xl mx-auto mt-5">
            VAKR combines a medical knowledge graph, machine learning, and real-time wearable data to analyze your symptoms, predict disease risks, and guide you toward better health outcomes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button onClick={() => router.push("/auth")}
              className="group px-8 py-3.5 rounded-xl bg-[#1d1d1f] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#2d2d2f] active:scale-95 shadow-lg shadow-black/10">
              Start Assessment <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#features"
              className="px-8 py-3.5 rounded-xl bg-white text-[#1d1d1f] text-[15px] font-semibold flex items-center justify-center gap-2 border border-[#d2d2d7] transition-all hover:bg-[#f5f5f7] active:scale-95">
              See Features
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mt-14">
            {[
              { value: 17, suffix: "", label: "Disease Models" },
              { value: 24, suffix: "", label: "ML Features" },
              { value: 200, suffix: "+", label: "Symptom Aliases" },
            ].map(({ value, suffix, label }) => (
              <div key={label}>
                <p className="text-[28px] md:text-[36px] font-bold">
                  <CountUp end={value} suffix={suffix} />
                </p>
                <p className="text-[12px] text-[#aeaeb2] font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ BENTO FEATURES ════════════════ */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest text-center mb-2">Features</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-center leading-tight">
              Everything you need.<br className="hidden md:block" /> Nothing you don't.
            </h2>
            <p className="text-[15px] text-[#6e6e73] text-center max-w-xl mx-auto mt-3 mb-12">
              Six intelligent modules working together to keep you healthy.
            </p>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Feature 1 — Symptom Assessment (large) */}
            <FadeSection className="md:col-span-2 md:row-span-2" delay={100}>
              <div className="h-full bg-gradient-to-br from-[#1d1d1f] to-[#3d3d3f] rounded-3xl p-7 md:p-9 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 group-hover:scale-110 transition-transform duration-700" />
                <Stethoscope className="w-7 h-7 mb-4 text-white/80" strokeWidth={1.5} />
                <h3 className="text-[22px] font-bold mb-2">Symptom Assessment</h3>
                <p className="text-[14px] text-white/60 leading-relaxed max-w-md mb-6">
                  Select symptoms or describe how you feel in natural language. Our normalizer maps 200+ symptom aliases to canonical forms, then runs weighted inference against a medical knowledge graph.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Network, label: "Knowledge Graph", desc: "17 conditions with weighted symptoms" },
                    { icon: Zap, label: "Instant Triage", desc: "HIGH / MEDIUM / LOW risk in milliseconds" },
                    { icon: Brain, label: "AI Explanation", desc: "MedGemma generates plain-language analysis" },
                    { icon: FileText, label: "Saved Reports", desc: "Every assessment saved & viewable anytime" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3.5 hover:bg-white/15 transition-colors">
                      <Icon className="w-4 h-4 text-white/60 mb-1.5" />
                      <p className="text-[12px] font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>

            {/* Feature 2 — ML Risk Prediction */}
            <FadeSection delay={200}>
              <div className="h-full bg-[#f5f5f7] rounded-3xl p-7 relative overflow-hidden group hover:bg-[#ebebed] transition-colors">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-[#ff3b30]/5 group-hover:scale-125 transition-transform duration-500" />
                <BarChart3 className="w-6 h-6 mb-3 text-[#ff3b30]" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-1.5">ML Risk Prediction</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                  XGBoost models trained on clinical data predict risk for <strong>diabetes, hypertension, and heart disease</strong>. SHAP explainability shows exactly which factors drive your risk.
                </p>
                <div className="mt-4 space-y-2">
                  {["Age & BMI", "Family History", "Vitals & Symptoms"].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                      <span className="text-[11px] text-[#6e6e73]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>

            {/* Feature 3 — Wearable Vitals */}
            <FadeSection delay={300}>
              <div className="h-full bg-[#f5f5f7] rounded-3xl p-7 relative overflow-hidden group hover:bg-[#ebebed] transition-colors">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-[#007aff]/5 group-hover:scale-125 transition-transform duration-500" />
                <Activity className="w-6 h-6 mb-3 text-[#007aff]" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-1.5">Real-Time Vitals</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                  Heart rate, SpO₂, blood pressure, temperature, and sleep data — all tracked continuously and fed into your health context.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["HR", "SpO₂", "BP", "Temp", "Sleep", "Steps"].map(v => (
                    <span key={v} className="px-2 py-1 rounded-md bg-[#007aff]/8 text-[10px] font-bold text-[#007aff]">{v}</span>
                  ))}
                </div>
              </div>
            </FadeSection>

            {/* Feature 4 — AI Chatbot */}
            <FadeSection delay={400}>
              <div className="h-full bg-[#f5f5f7] rounded-3xl p-7 relative overflow-hidden group hover:bg-[#ebebed] transition-colors">
                <MessageSquare className="w-6 h-6 mb-3 text-[#af52de]" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-1.5">Health Assistant</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                  Context-aware chatbot powered by MedGemma. Knows your medical history, vitals, assessments, and profile — every answer is personalized.
                </p>
              </div>
            </FadeSection>

            {/* Feature 5 — AQI */}
            <FadeSection delay={500}>
              <div className="h-full bg-[#f5f5f7] rounded-3xl p-7 relative overflow-hidden group hover:bg-[#ebebed] transition-colors">
                <Wind className="w-6 h-6 mb-3 text-[#34c759]" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-1.5">Air Quality Indexing</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                  Location-based AQI data factored into your respiratory risk assessment. Environmental health context that most systems miss.
                </p>
              </div>
            </FadeSection>

            {/* Feature 6 — Medical Records */}
            <FadeSection delay={600}>
              <div className="h-full bg-[#f5f5f7] rounded-3xl p-7 relative overflow-hidden group hover:bg-[#ebebed] transition-colors">
                <FileText className="w-6 h-6 mb-3 text-[#ff9500]" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-1.5">Record Management</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                  Upload lab reports, prescriptions, and medical records. AI extracts diagnoses and conditions to enrich your health context for future assessments.
                </p>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest text-center mb-2">How It Works</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-center leading-tight mb-4">
              From symptoms to insight.<br className="hidden md:block" /> In seconds.
            </h2>
          </FadeSection>

          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              {
                step: "01",
                icon: Stethoscope,
                title: "Describe Symptoms",
                desc: "Select from common symptoms or describe how you feel in plain language. Our NLP normalizer handles 200+ aliases.",
                color: "#007aff",
              },
              {
                step: "02",
                icon: Network,
                title: "Knowledge Inference",
                desc: "Weighted inference against 17 conditions in the medical knowledge graph. Deterministic, explainable, no black box.",
                color: "#ff9500",
              },
              {
                step: "03",
                icon: Shield,
                title: "Triage & ML Risk",
                desc: "Rule-based triage determines urgency. XGBoost models predict diabetes, hypertension, and heart disease risk with SHAP explanation.",
                color: "#ff3b30",
              },
              {
                step: "04",
                icon: Brain,
                title: "AI Analysis",
                desc: "MedGemma generates a comprehensive explanation using your full patient context — vitals, history, profile, and AQI.",
                color: "#af52de",
              },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <FadeSection key={step} delay={i * 150}>
                <div className="relative">
                  {i < 3 && <div className="hidden md:block absolute top-8 left-full w-6 h-px bg-[#d2d2d7] z-10" />}
                  <div className="bg-white rounded-2xl p-6 h-full shadow-sm border border-[#f0f0f0]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
                        <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-bold text-[#aeaeb2]">STEP {step}</span>
                    </div>
                    <h3 className="text-[15px] font-bold mb-2">{title}</h3>
                    <p className="text-[13px] text-[#6e6e73] leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ TECH STACK ════════════════ */}
      <section id="tech" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest text-center mb-2">Under The Hood</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-center leading-tight mb-4">
              Built for transparency.
            </h2>
            <p className="text-[15px] text-[#6e6e73] text-center max-w-xl mx-auto mb-12">
              Every decision is explainable. No black boxes.
            </p>
          </FadeSection>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeSection delay={100}>
              <div className="bg-[#1d1d1f] rounded-3xl p-7 text-white">
                <Database className="w-6 h-6 mb-3 text-white/60" strokeWidth={1.5} />
                <h3 className="text-[17px] font-bold mb-3">Intelligence Pipeline</h3>
                <div className="space-y-2.5 text-[13px] text-white/60 font-mono">
                  <p><span className="text-[#34c759]">1.</span> Symptom Normalizer <span className="text-white/30">→ 200+ aliases → canonical forms</span></p>
                  <p><span className="text-[#34c759]">2.</span> Knowledge Graph <span className="text-white/30">→ 17 conditions × weighted symptoms</span></p>
                  <p><span className="text-[#34c759]">3.</span> Inference Engine <span className="text-white/30">→ score = Σ(matching weights)</span></p>
                  <p><span className="text-[#34c759]">4.</span> Triage Engine <span className="text-white/30">→ rule-based HIGH / MEDIUM / LOW</span></p>
                  <p><span className="text-[#34c759]">5.</span> ML Predictor <span className="text-white/30">→ XGBoost + 24 features + SHAP</span></p>
                  <p><span className="text-[#34c759]">6.</span> Context Builder <span className="text-white/30">→ records + vitals + profile + AQI</span></p>
                  <p><span className="text-[#34c759]">7.</span> AI Explainer <span className="text-white/30">→ MedGemma with full context</span></p>
                </div>
              </div>
            </FadeSection>

            <FadeSection delay={200}>
              <div className="space-y-4">
                <div className="bg-[#f5f5f7] rounded-2xl p-6">
                  <h4 className="text-[14px] font-bold mb-3">Tech Stack</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Backend", tech: "FastAPI + SQLAlchemy" },
                      { label: "Frontend", tech: "Next.js 15 + React" },
                      { label: "ML Models", tech: "XGBoost + SHAP" },
                      { label: "AI Engine", tech: "MedGemma" },
                      { label: "Database", tech: "SQLite (portable)" },
                      { label: "Vitals Sim", tech: "Real-time generation" },
                    ].map(({ label, tech }) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wide">{label}</p>
                        <p className="text-[13px] font-medium text-[#1d1d1f]">{tech}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f5f5f7] rounded-2xl p-6">
                  <h4 className="text-[14px] font-bold mb-3">Key Design Principles</h4>
                  <div className="space-y-2.5">
                    {[
                      "Explainable AI — every prediction has SHAP attribution",
                      "Separation of concerns — inference ≠ triage ≠ ML ≠ AI",
                      "Context-aware — all data enriches every interaction",
                      "Privacy-first — SQLite, runs locally, no cloud dependency",
                    ].map(p => (
                      <div key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759] mt-0.5 shrink-0" />
                        <p className="text-[12px] text-[#6e6e73] leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ════════════════ ARCHITECTURE ════════════════ */}
      <section className="py-20 md:py-28 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-6">
          <FadeSection>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest text-center mb-2">Architecture</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-center leading-tight mb-12">
              End-to-end pipeline.
            </h2>
          </FadeSection>

          <FadeSection delay={200}>
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#f0f0f0]">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Input Layer */}
                <div>
                  <p className="text-[10px] font-bold text-[#007aff] uppercase tracking-widest mb-3">Input Layer</p>
                  <div className="space-y-2">
                    {["Symptom Selection", "Free-Text Input", "Wearable Vitals", "Medical Records", "Patient Profile", "Location (AQI)"].map(i => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-[#007aff]/5 text-[12px] font-medium text-[#007aff]">{i}</div>
                    ))}
                  </div>
                </div>

                {/* Processing Layer */}
                <div>
                  <p className="text-[10px] font-bold text-[#ff9500] uppercase tracking-widest mb-3">Processing</p>
                  <div className="space-y-2">
                    {[
                      "Symptom Normalizer",
                      "Knowledge Graph Inference",
                      "Deterministic Triage",
                      "XGBoost Risk Models",
                      "SHAP Explainability",
                      "Context Aggregation",
                    ].map(i => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-[#ff9500]/5 text-[12px] font-medium text-[#ff9500]">{i}</div>
                    ))}
                  </div>
                </div>

                {/* Output Layer */}
                <div>
                  <p className="text-[10px] font-bold text-[#34c759] uppercase tracking-widest mb-3">Output</p>
                  <div className="space-y-2">
                    {[
                      "Triage Level (HIGH/MED/LOW)",
                      "Ranked Conditions",
                      "Disease Risk Probabilities",
                      "SHAP Factor Attribution",
                      "AI Explanation Report",
                      "Actionable Recommendations",
                    ].map(i => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-[#34c759]/5 text-[12px] font-medium text-[#34c759]">{i}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ════════════════ CTA ════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeSection>
            <div className="bg-gradient-to-br from-[#1d1d1f] to-[#3d3d3f] rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 -translate-x-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 translate-x-1/4" />

              <div className="relative">
                <Heart className="w-8 h-8 text-[#ff3b30] mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-[28px] md:text-[36px] font-bold leading-tight mb-3">
                  Take control of your health
                </h2>
                <p className="text-[15px] text-white/60 max-w-md mx-auto mb-6">
                  Start with a free symptom assessment. No sign-up wall, no data selling. Your health intelligence, powered by AI.
                </p>
                <button onClick={() => router.push("/auth")}
                  className="group px-8 py-3.5 rounded-xl bg-white text-[#1d1d1f] text-[15px] font-semibold inline-flex items-center gap-2 transition-all hover:bg-[#f5f5f7] active:scale-95">
                  Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-[#f0f0f0] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#1d1d1f] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">V</span>
            </div>
            <span className="text-[13px] font-bold tracking-tight">VAKR</span>
            <span className="text-[11px] text-[#aeaeb2] ml-1">Preventive Health Intelligence</span>
          </div>
          <p className="text-[11px] text-[#aeaeb2]">
            Built with FastAPI, Next.js, XGBoost, MedGemma. For educational and demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
