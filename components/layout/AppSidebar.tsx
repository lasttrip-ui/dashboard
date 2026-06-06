"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, TrendingUp, Calendar, Briefcase,
  Tag, Settings, Moon, Sun, LogOut, Upload, ChevronLeft, ChevronRight,
  Activity
} from "lucide-react"

const NAV = [
  { href: "/panel",       icon: LayoutDashboard, label: "Panel" },
  { href: "/operaciones", icon: TrendingUp,       label: "Operaciones" },
  { href: "/calendario",  icon: Calendar,         label: "Calendario" },
  { href: "/cartera",     icon: Briefcase,        label: "Cartera" },
  { href: "/clasificacion", icon: Tag,            label: "Clasificación" },
]

const BOTTOM = [
  { href: "/importar",  icon: Upload,   label: "Importar operaciones" },
  { href: "/ajustes",   icon: Settings, label: "Ajustes" },
]

interface Props {
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function AppSidebar({ theme, onThemeToggle }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const path = usePathname()

  function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const active = path === href || path.startsWith(href + "/")
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: collapsed ? "0.6rem 0" : "0.5rem 0.75rem",
          borderRadius: 8,
          cursor: "pointer",
          background: active ? "var(--accent-dim)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-secondary)",
          justifyContent: collapsed ? "center" : "flex-start",
          transition: "all 0.15s",
          fontSize: "0.8125rem",
          fontWeight: active ? 600 : 400,
        }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)" }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <Icon size={15} strokeWidth={1.8} />
          {!collapsed && <span>{label}</span>}
        </div>
      </Link>
    )
  }

  return (
    <aside style={{
      width: collapsed ? 52 : 180,
      minHeight: "100vh",
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
      transition: "width 0.2s ease",
      flexShrink: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "1rem 0" : "1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
        {collapsed ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Activity size={18} color="var(--accent)" />
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "0.5625rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Options Dashboard
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginTop: 2 }}>
              Tortuga Trades
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "0.75rem 0" : "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "1px" }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", margin: "0 0.5rem" }} />

      {/* Bottom */}
      <div style={{ padding: collapsed ? "0.75rem 0" : "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "1px" }}>
        {BOTTOM.map(item => <NavItem key={item.href} {...item} />)}

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: collapsed ? "0.6rem 0" : "0.5rem 0.75rem",
            borderRadius: 8,
            cursor: "pointer",
            background: "transparent",
            color: "var(--text-secondary)",
            border: "none",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: "0.8125rem",
          }}
        >
          {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          {!collapsed && <span>Modo {theme === "dark" ? "claro" : "oscuro"}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: collapsed ? "0.6rem 0" : "0.5rem 0.75rem",
            borderRadius: 8,
            cursor: "pointer",
            background: "transparent",
            color: "var(--text-muted)",
            border: "none",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: "0.8125rem",
          }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}
