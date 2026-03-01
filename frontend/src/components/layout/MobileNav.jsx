"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Stethoscope, MessageCircle, FolderOpen, Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/assess", label: "Check", icon: Stethoscope },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/records", label: "Records", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const HIDDEN_ON = ["/auth", "/onboarding", "/"];

export default function MobileNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-[#e5e5ea] safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? "text-[#1d1d1f]" : "text-[#aeaeb2]"
              }`}>
              <Icon className={`w-[20px] h-[20px] transition-transform ${isActive ? "scale-105" : ""}`}
                strokeWidth={isActive ? 2.2 : 1.6} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
