"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Briefcase,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm shrink-0">
          TT
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] leading-none">
            Tortuga Trades
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            IB Dashboard
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 group ${
                active
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <Icon
                size={16}
                className={`shrink-0 ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                }`}
              />
              <span>{label}</span>
              {active && (
                <ChevronRight size={12} className="ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle */}
      <div className="px-3 pb-4 border-t border-[var(--border)] pt-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
        >
          {settings.theme === "dark" ? (
            <Sun size={16} className="shrink-0 text-[var(--yellow)]" />
          ) : (
            <Moon size={16} className="shrink-0 text-[var(--accent)]" />
          )}
          <span>{settings.theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <div className="mt-3 px-3 py-2 rounded bg-[var(--bg-hover)]">
          <div className="text-xs text-[var(--text-muted)]">Account</div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            Interactive Brokers
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="text-xs text-[var(--green)]">Connected</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border)] h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border)] h-full z-50">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
