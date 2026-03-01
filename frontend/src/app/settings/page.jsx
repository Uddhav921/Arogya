"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import AppShell from "@/components/layout/AppShell";
import {
  Settings, User, Bell, Shield, Eye, Database,
  Languages, Moon, Smartphone, LogOut, ChevronRight,
  Monitor, Loader2, Sparkles, Key, Sun, Trash2
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { patient, logout } = usePatient();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    router.replace("/auth");
  };

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "account", label: "Account & Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const langs = ["English", "Hindi (Coming Soon)", "Marathi (Coming Soon)"];

  const fadeAnim = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <AppShell>
      <div className="w-full max-w-[1000px] mx-auto min-h-[calc(100vh-8rem)]">
        
        <div className="mb-8">
          <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" /> System Control
          </p>
          <h1 className="text-[32px] font-extrabold text-foreground tracking-tight leading-none mb-3">Settings</h1>
          <p className="text-[14px] text-muted-foreground font-medium">Manage your preferences, security, and global application options.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-[240px] shrink-0">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all whitespace-nowrap ${
                    activeTab === s.id 
                    ? "bg-muted border border-border text-foreground shadow-sm font-bold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <s.icon className={`w-4 h-4 ${activeTab === s.id ? "text-emerald-500" : "text-muted-foreground"}`} />
                  {s.label}
                </button>
              ))}
            </div>
            
            <div className="mt-8 hidden md:block">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive/80 transition-all border border-transparent hover:border-destructive/20 w-full text-left">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Sign Out Securely
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === "general" && (
              <motion.div variants={fadeAnim} initial="hidden" animate="visible" className="space-y-6">
                
                {/* Language Settings */}
                <div className="bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Languages className="w-5 h-5 text-blue-500" />
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-foreground">Language Details</h2>
                       <p className="text-[13px] text-muted-foreground mt-0.5">Set your preferred UI language.</p>
                     </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {langs.map(l => {
                      const lKey = l.replace(" (Coming Soon)", "");
                      return (
                      <button 
                        key={l}
                        onClick={() => setLanguage(lKey)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          language === lKey 
                          ? "bg-blue-500/10 border-blue-500/30 text-foreground" 
                          : "bg-muted/50 border-border hover:bg-muted hover:border-border text-muted-foreground"
                        } cursor-pointer`}
                      >
                        <span className="text-[14px] font-bold">{l}</span>
                        {language === lKey && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                      </button>
                    )})}
                  </div>
                </div>

                {/* Theme Options */}
                <div className="bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5 text-purple-500" />
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-foreground">Appearance</h2>
                       <p className="text-[13px] text-muted-foreground mt-0.5">Customize the visual interface.</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {[
                        {name: "Absolute Dark", icon: Moon, value: "dark"}, 
                        {name: "Light Mode", icon: Sun, value: "light"}, 
                        {name: "System", icon: Monitor, value: "system"}
                     ].map(t => (
                        <button 
                          key={t.name}
                          onClick={() => setTheme(t.value)}
                          className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${
                            theme === t.value ? 'bg-muted border-border' : 'bg-transparent border-border/50 opacity-70 hover:opacity-100 hover:bg-muted/50'
                          }`}
                        >
                           <t.icon className={`w-6 h-6 mb-3 ${theme === t.value ? 'text-foreground' : 'text-muted-foreground'}`} />
                           <span className={`text-[13px] font-bold ${theme === t.value ? 'text-foreground' : 'text-muted-foreground'}`}>{t.name}</span>
                        </button>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "account" && (
              <motion.div variants={fadeAnim} initial="hidden" animate="visible" className="space-y-6">
                
                {/* Access */}
                <div className="bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5 text-emerald-500" />
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-foreground">Access & Security</h2>
                       <p className="text-[13px] text-muted-foreground mt-0.5">Manage your credentials and API access.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl">
                        <div>
                          <p className="text-[14px] font-bold text-foreground">Email Address</p>
                          <p className="text-[13px] text-muted-foreground mt-1">{patient?.email || "patient@arogya.com"}</p>
                        </div>
                        <button className="text-[12px] font-bold text-muted-foreground bg-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors">Change</button>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl">
                        <div>
                          <p className="text-[14px] font-bold text-foreground">Password</p>
                          <p className="text-[13px] text-muted-foreground mt-1">Last changed 2 months ago</p>
                        </div>
                        <button className="text-[12px] font-bold text-muted-foreground bg-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors">Update</button>
                     </div>
                  </div>
                </div>

                {/* Data privacy */}
                <div className="bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-amber-500" />
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-foreground">Data Control</h2>
                       <p className="text-[13px] text-muted-foreground mt-0.5">Control how your clinical data is used.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl">
                        <div className="pr-6">
                          <p className="text-[14px] font-bold text-foreground">Local Inference Mode</p>
                          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">Runs risk models locally using SQlite logic before hitting cloud endpoints. Maximum privacy.</p>
                        </div>
                        <div className="w-12 h-6 rounded-full bg-emerald-500 relative shrink-0">
                           <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border">
                     <button className="flex items-center gap-2 text-[13px] font-bold text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="w-4 h-4" /> Delete Account & Medical Records
                     </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div variants={fadeAnim} initial="hidden" animate="visible" className="space-y-6">
                <div className="bg-card border border-border rounded-[24px] p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-rose-500" />
                     </div>
                     <div>
                       <h2 className="text-[18px] font-bold text-foreground">Alert Preferences</h2>
                       <p className="text-[13px] text-muted-foreground mt-0.5">Manage triage and vital sign alerts.</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {[
                        { title: "Critical Triage Alerts", desc: "Push notifications when a symptom check flags HIGH/CRITICAL risk." },
                        { title: "Wearable Anomalies", desc: "Alerts for sudden drops in SpO2 or irregular heart rate." },
                        { title: "Medical Record Sync", desc: "Notify when a new document is processed and structured." }
                     ].map(opt => (
                        <div key={opt.title} className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl">
                          <div className="pr-6">
                            <p className="text-[14px] font-bold text-foreground">{opt.title}</p>
                            <p className="text-[13px] text-muted-foreground mt-1">{opt.desc}</p>
                          </div>
                          <div className="w-12 h-6 rounded-full bg-emerald-500 relative shrink-0">
                             <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}
            
          </div>
        </div>

        {/* Mobile Logout */}
        <div className="mt-8 md:hidden pb-12">
           <button onClick={handleLogout} className="flex items-center justify-center gap-3 bg-muted border border-border px-4 py-4 rounded-2xl text-[14px] font-bold text-destructive hover:bg-muted/80 transition-all w-full">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
             Sign Out Securely
           </button>
        </div>

      </div>
    </AppShell>
  );
}
