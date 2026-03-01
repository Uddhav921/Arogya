"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity, Shield, Brain, Stethoscope, Wind, FileText, MessageSquare,
  ChevronRight, ArrowRight, Heart, Zap, Database, BarChart3, 
  Lock, CheckCircle2, Sparkles, Network, ArrowUpRight, Github
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
    <div ref={ref} className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-12 blur-[4px]"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground/20 font-sans overflow-x-hidden">
      
      {/* ── Background Noise & Gradients ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-foreground/5 opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-foreground/5 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-foreground/5 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* ════════════════ NAV ════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-md" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground group-hover:text-muted-foreground transition-colors">Arogya<span className="text-muted-foreground ml-1">by VAKR</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Engine</a>
            <a href="#tech" className="hover:text-foreground transition-colors">Architecture</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/vakr" target="_blank" rel="noreferrer" className="hidden sm:flex text-muted-foreground hover:text-foreground transition-colors mr-2">
              <Github className="w-5 h-5" />
            </a>
            <button onClick={() => router.push("/auth")}
              className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </button>
            <button onClick={() => router.push("/auth")}
              className="px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-bold transition-all hover:bg-foreground/80 hover:scale-105 active:scale-95 shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 md:pt-48 pb-20">
        
        {/* ════════════════ HERO ════════════════ */}
        <section className="relative max-w-7xl mx-auto px-6 text-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/80 border border-border text-[11px] font-bold text-foreground uppercase tracking-widest mb-8 backdrop-blur-md shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
            </span>
            Arogya Core Active
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="text-[48px] md:text-[80px] font-extrabold leading-[1.05] tracking-tighter max-w-5xl mx-auto text-foreground"
          >
            Context-Aware Health <br className="hidden md:block"/>
            <span className="text-foreground">
              Intelligence Engine.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-[16px] md:text-[20px] text-muted-foreground leading-relaxed max-w-3xl mx-auto mt-8 font-medium"
          >
            Arogya by VAKR fuses deterministic medical knowledge graphs with real-time wearable signals and predictive ML to build the ultimate semantic layer for personal health.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <button onClick={() => router.push("/auth")}
              className="group px-8 py-4 rounded-xl bg-foreground text-background text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm border border-transparent hover:border-border">
              Initialize Dashboard <ArrowUpRight className="w-5 h-5 text-background/50 group-hover:text-background transition-colors" />
            </button>
            <a href="#architecture"
              className="px-8 py-4 rounded-xl bg-muted border border-border text-foreground text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:bg-muted/80 active:scale-95">
              Read the Docs
            </a>
          </motion.div>

          {/* Metrics Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 p-6 rounded-3xl bg-card/50 border border-border backdrop-blur-sm"
          >
            {[
              { value: 17, suffix: "", label: "Clinical Models" },
              { value: 92, suffix: "%", label: "Diagnostic Acc." },
              { value: 6, suffix: "ms", label: "Inference Latency" },
              { value: 100, suffix: "%", label: "Local Privacy" },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="flex flex-col items-center justify-center p-4">
                <p className="text-[32px] md:text-[40px] font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm">
                  <CountUp end={value} suffix={suffix} />
                </p>
                <p className="text-[12px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ════════════════ FEATURES BENTO ════════════════ */}
        <section id="features" className="py-24 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-6">
            
            <FadeSection>
              <div className="mb-16">
                <h2 className="text-[36px] md:text-[56px] font-extrabold tracking-tight text-white leading-none">
                  Architected for precision.<br/>
                  <span className="text-zinc-600">Built for scale.</span>
                </h2>
              </div>
            </FadeSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
              
              {/* Bento 1: AI Chat (Large) */}
              <FadeSection className="md:col-span-2 md:row-span-2" delay={100}>
                <div className="h-full bg-card border border-border hover:border-foreground/20 transition-colors rounded-[32px] p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-foreground/10 transition-colors duration-700" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm">
                      <MessageSquare className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="text-[32px] font-bold text-foreground mb-4 tracking-tight">Arogya Semantic Layer</h3>
                    <p className="text-[16px] text-muted-foreground leading-relaxed max-w-md mb-8">
                       The conversational interface is just the surface. Underneath lies a deterministic knowledge graph that maps 200+ symptom aliases into clinical vectors before generating a response.
                    </p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-4">
                      {[
                        { title: "Deterministic Mapping", desc: "No LLM hallucinations in triage." },
                        { title: "Context Injection", desc: "Wearables & history embedded automatically." },
                      ].map(item => (
                        <div key={item.title} className="bg-background/80 border border-border p-5 rounded-2xl backdrop-blur-md">
                          <p className="text-[14px] font-bold text-foreground mb-1">{item.title}</p>
                          <p className="text-[12px] text-muted-foreground leading-snug">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeSection>

              {/* Bento 2: Predict */}
              <FadeSection delay={200}>
                <div className="h-full bg-card border border-border hover:border-foreground/20 transition-colors rounded-[32px] p-8 flex flex-col relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-5">
                    <BarChart3 className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-[22px] font-bold text-foreground mb-3 tracking-tight">XGBoost Risk Models</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    Evaluates hypertension, diabetes, and cardiovascular risk based on 24 distinct clinical features extracted from your profile and live vitals.
                  </p>
                  <div className="mt-auto flex items-center gap-2 px-3 py-2 bg-background/80 border border-border rounded-xl w-max">
                     <div className="w-2 h-2 rounded-full bg-foreground"></div>
                     <span className="text-[11px] font-mono text-muted-foreground">SHAP values exposed</span>
                  </div>
                </div>
              </FadeSection>

              {/* Bento 3: Data */}
              <FadeSection delay={300}>
                 <div className="h-full bg-card border border-border hover:border-foreground/20 transition-colors rounded-[32px] p-8 flex flex-col relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-5">
                    <Activity className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-[22px] font-bold text-foreground mb-3 tracking-tight">Streaming Vitals</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    Direct ingestion pipeline for SpO2, Heart Rate, and Blood Pressure. Automatically recalibrates risk baseline upon new data sync.
                  </p>
                </div>
              </FadeSection>

              {/* Bento 4: Privacy */}
               <FadeSection delay={400} className="md:col-span-3 h-[240px]">
                 <div className="h-full bg-card border border-border hover:border-foreground/20 transition-colors rounded-[32px] p-8 flex items-center justify-between relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                   <div className="max-w-xl z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-8 h-8 text-foreground" />
                      <h3 className="text-[28px] font-bold text-foreground tracking-tight">Zero-Trust Architecture</h3>
                    </div>
                    <p className="text-[16px] text-muted-foreground leading-relaxed">
                      All explanations and ML artifacts are cached locally on your device via SQLite. Only the absolute minimum triage vectors hit the inference endpoints.
                    </p>
                   </div>
                   <div className="hidden md:flex flex-col gap-3 z-10 mr-10">
                     {["End-to-end Encryption", "Local Vector Store", "No Data Selling"].map(t => (
                        <div key={t} className="flex items-center gap-2 opacity-80">
                          <CheckCircle2 className="w-5 h-5 text-foreground" />
                          <span className="text-[14px] font-bold text-foreground">{t}</span>
                        </div>
                     ))}
                   </div>
                </div>
              </FadeSection>

            </div>
          </div>
        </section>

        {/* ════════════════ TERMINAL / ARCHITECTURE ════════════════ */}
        <section id="architecture" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <FadeSection>
              <div className="text-center mb-16">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Under The Hood</p>
                <h2 className="text-[40px] md:text-[48px] font-extrabold tracking-tight text-foreground">
                  Developer Experience First.
                </h2>
              </div>
            </FadeSection>

            <FadeSection delay={200}>
              <div className="max-w-4xl mx-auto bg-background/50 border border-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
                {/* Mac OS Window Header */}
                <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5 opacity-50">
                    <div className="w-3 h-3 rounded-full bg-foreground"></div>
                    <div className="w-3 h-3 rounded-full bg-foreground"></div>
                    <div className="w-3 h-3 rounded-full bg-foreground"></div>
                  </div>
                  <div className="flex-1 text-center font-mono text-[11px] text-muted-foreground">arogya_inference.py</div>
                </div>
                {/* Code Body */}
                <div className="p-6 font-mono text-[13px] leading-relaxed text-foreground overflow-x-auto">
                  <div><span className="font-bold">def</span> <span className="italic">process_assessment</span>(patient_id: str, symptoms: list):</div>
                  <div className="pl-4 text-muted-foreground"># 1. Fetch multidimensional context</div>
                  <div className="pl-4">context = db.get_patient_context(patient_id)</div>
                  <div className="pl-4 mt-2 text-muted-foreground"># 2. Map textual input to SNOMED ontology nodes</div>
                  <div className="pl-4">nodes = normalize_to_knowledge_graph(symptoms)</div>
                  <div className="pl-4 mt-2 text-muted-foreground"># 3. Calculate deterministic risk (XGBoost)</div>
                  <div className="pl-4">risk_matrix = ml_engine.predict_risk(nodes, context)</div>
                  <div className="pl-4 mt-2 text-muted-foreground"># 4. Generate interpretability layer (SHAP)</div>
                  <div className="pl-4">shap_values = explain_model_prediction(risk_matrix)</div>
                  <div className="pl-4 mt-2"><span className="font-bold">return</span> Response(</div>
                  <div className="pl-8">triage=risk_matrix.triage_level,</div>
                  <div className="pl-8">attributions=shap_values,</div>
                  <div className="pl-8">llm_explanation=generate_arogya_summary(nodes, context)</div>
                  <div className="pl-4">)</div>
                </div>
              </div>
            </FadeSection>
          </div>
        </section>

      </main>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-border bg-background pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-4 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[20px] font-bold tracking-tight text-foreground">Arogya</span>
              </div>
              <p className="text-[14px] text-muted-foreground max-w-sm">
                Advanced AI medical intelligence and symptom triage. Open-source architecture designed for production.
              </p>
            </div>
            
            <div className="flex gap-4">
               <button onClick={() => router.push("/auth")} className="px-6 py-3 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-xl font-bold transition-all">Launch App</button>
               <a href="https://github.com/vakr" target="_blank" rel="noreferrer" className="px-6 py-3 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-xl font-medium transition-all flex items-center gap-2"><Github className="w-4 h-4" /> Source</a>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground font-medium tracking-wide">
            <p>2026 Arogya by VAKR. All systems operational.</p>
            <div className="flex space-x-6">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Docs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
