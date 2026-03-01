"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import MobileNav from "./MobileNav";
import {
  Search, Bell, Calendar, Settings, FileText,
  StickyNote, CheckSquare, BookOpen, Plus,
  LogOut, Sun, Moon, Sparkles, User, ChevronUp, Zap
} from "lucide-react";

// The full-bleed pages where we don't show the App Shell sidebar
const FULL_BLEED = ["/auth", "/onboarding", "/"];

// Core Action Links
const MAIN_MENU = [
  { href: "/dashboard", label: "Dashboard",       icon: Search },
  { href: "/assess",    label: "Symptom Check",   icon: FileText },
  { href: "/chat",      label: "Arogya AI Chat",  icon: Sparkles },
  { href: "/records",   label: "Records",         icon: Calendar },
  { href: "/profile",   label: "My Profile",      icon: User },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { patient } = usePatient();
  const isFullBleed = FULL_BLEED.includes(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isFullBleed) return children;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-foreground/20">
      
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen sticky top-0 bg-sidebar border-r border-sidebar-border shrink-0">
        
        {/* Workspace / App Brand Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-foreground flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-background" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-sidebar-foreground tracking-tight leading-tight">Arogya</span>
            <span className="text-[10px] text-muted-foreground leading-tight font-extrabold tracking-widest uppercase mt-1">CORE</span>
          </div>
        </div>

        {/* Navigation Wrapper */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-6 px-4 scrollbar-hide">
          <p className="px-3 mb-4 text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">Core Actions</p>
          <nav className="space-y-0.5">
            {MAIN_MENU.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link href={item.href} key={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-200 ${
                    isActive 
                    ? "bg-muted border border-border text-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium border border-transparent"
                  }`}>
                  <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ─── FLOATING PROFILE POPOVER ─── */}
        <div className="p-4 relative" ref={profileRef}>
          <AnimatePresence>
            {profileOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-[80px] left-4 right-4 w-[240px] bg-popover border border-border rounded-2xl p-2 shadow-2xl origin-bottom z-50 flex flex-col">
                
                {/* Header in popover */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-muted rounded-xl mb-1.5 border border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <span className="text-[13px] font-bold text-popover-foreground tracking-wide">AROGYA CORE</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Connected</span>
                </div>

                <div className="flex flex-col py-1">
                  <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors w-full text-left font-medium">
                    <Settings className="w-4 h-4 text-muted-foreground" /> Account Settings
                  </Link>
                  <button className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-destructive hover:bg-muted hover:text-destructive/80 rounded-xl transition-colors w-full text-left font-medium mb-2">
                    <LogOut className="w-4 h-4 text-destructive" /> Sign out
                  </button>
                </div>

                {/* Switch Account Section */}
                <div className="pt-3 border-t border-border px-4 pb-2 flex items-center justify-between">
                  <div className="py-1 min-w-0">
                    <p className="text-[14px] font-bold text-popover-foreground truncate">{patient?.name || "Patient User"}</p>
                    <p className="text-[12px] text-muted-foreground truncate mt-0.5">{patient?.email || "patient@arogya.com"}</p>
                  </div>
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full h-16 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-[20px] px-3.5 flex items-center justify-between transition-colors shadow-sm focus:border-sidebar-ring outline-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[15px] font-medium text-foreground">{(patient?.name?.[0] || "A").toUpperCase()}</span>
              </div>
              <div className="flex flex-col items-start min-w-0 pr-2">
                <span className="text-[14px] font-semibold text-sidebar-foreground truncate w-full leading-tight">{patient?.name || "admin"}</span>
                <span className="text-[12px] text-muted-foreground truncate w-full leading-tight mt-1">Free Plan</span>
              </div>
            </div>
            <motion.div animate={{ rotate: profileOpen ? 180 : 0 }}>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
        </div>

      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
             {children}
          </motion.div>
        </div>
      </main>

      {/* ─── MOBILE NAV ─── */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

    </div>
  );
}
