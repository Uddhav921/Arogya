"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import MobileNav from "./MobileNav";
import {
  LayoutDashboard, Stethoscope, MessageCircle,
  FolderOpen, Settings, UserCircle, ChevronRight,
} from "lucide-react";

const FULL_BLEED = ["/auth", "/onboarding", "/"];

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assess", label: "Assessment", icon: Stethoscope },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/records", label: "Records", icon: FolderOpen },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

const PAGE_NAMES = {
  "/dashboard": "Dashboard",
  "/assess": "Assessment",
  "/chat": "AI Chat",
  "/records": "Records",
  "/profile": "Profile",
  "/doctor": "Book Doctor",
  "/settings": "Settings",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isFullBleed = FULL_BLEED.includes(pathname);
  const pageName = PAGE_NAMES[pathname] || "";

  if (isFullBleed) return children;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ─── Desktop: Sidebar + Content ─── */}
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-[#e5e5ea] flex flex-col sticky top-0 h-screen">
          <div className="px-5 pt-6 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">V</span>
              </div>
              <span className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight">VAKR</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#f5f5f7] text-[#1d1d1f]"
                      : "text-[#6e6e73] hover:bg-[#fafafa] hover:text-[#1d1d1f]"
                  }`}>
                  <Icon className="w-[16px] h-[16px]" strokeWidth={isActive ? 2 : 1.6} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-[#f0f0f0]">
            <p className="text-[10px] text-[#aeaeb2]">VAKR v1.0</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea] h-12 flex items-center px-6">
            <span className="text-[13px] font-semibold text-[#1d1d1f]">{pageName}</span>
          </div>
          <main className="p-6">{children}</main>
        </div>
      </div>

      {/* ─── Mobile: Top bar + Bottom nav ─── */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]">
          <div className="px-5 h-11 flex items-center gap-2">
            <Link href="/dashboard"
              className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#1d1d1f]">
              VAKR
            </Link>
            {pageName && (
              <>
                <ChevronRight className="w-3 h-3 text-[#aeaeb2]" />
                <span className="text-[11px] font-medium text-[#6e6e73]">{pageName}</span>
              </>
            )}
          </div>
        </div>
        <main className="min-h-screen pb-20">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
