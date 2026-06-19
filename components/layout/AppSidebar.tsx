"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, TrendingUp, Calendar, Briefcase,
  Tag, Settings, Moon, Sun, LogOut, Upload, ChevronLeft, ChevronRight,
  Activity, Menu, X
} from "lucide-react"

const MOBILE_BREAKPOINT = 768

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
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const path = usePathname()

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < MOBILE_BREAKPOINT) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [path])

  const showExpanded = isMobile ? mobileOpen : !collapsed

  function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const active = path === href || path.startsWith(href + "/")
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: showExpanded ? "0.5rem 0.75rem" : "0.6rem 0",
          borderRadius: 8,
          cursor: "pointer",
          background: active ? "var(--accent-dim)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-secondary)",
          justifyContent: showExpanded ? "flex-start" : "center",
          transition: "all 0.15s",
          fontSize: "0.8125rem",
          fontWeight: active ? 600 : 400,
        }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)" }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <Icon size={15} strokeWidth={1.8} />
          {showExpanded && <span>{label}</span>}
        </div>
      </Link>
    )
  }

  if (isMobile && !mobileOpen) {
    return (
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        style={{
          position: "fixed", top: "0.75rem", left: "0.75rem", zIndex: 50,
          width: 36, height: 36, borderRadius: 8,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Menu size={18} strokeWidth={1.8} />
      </button>
    )
  }

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 45 }}
        />
      )}
      <aside style={{
      width: showExpanded ? 180 : 52,
      minHeight: "100vh",
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      position: isMobile ? "fixed" : "sticky",
      top: 0,
      left: 0,
      bottom: isMobile ? 0 : undefined,
      transition: "width 0.2s ease",
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: showExpanded ? "1rem 0.75rem" : "1rem 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {showExpanded ? (
          <div>
            <div style={{ fontSize: "0.5625rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Options Dashboard
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginTop: 2 }}>
              Tortuga Trades
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Activity size={18} color="var(--accent)" />
          </div>
        )}
        {isMobile && mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: showExpanded ? "0.75rem 0.5rem" : "0.75rem 0", display: "flex", flexDirection: "column", gap: "1px" }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", margin: "0 0.5rem" }} />

      {/* Bottom */}
      <div style={{ padding: showExpanded ? "0.75rem 0.5rem" : "0.75rem 0", display: "flex", flexDirection: "column", gap: "1px" }}>
        {BOTTOM.map(item => <NavItem key={item.href} {...item} />)}

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: showExpanded ? "0.5rem 0.75rem" : "0.6rem 0",
            borderRadius: 8,
            cursor: "pointer",
            background: "transparent",
            color: "var(--text-secondary)",
            border: "none",
            width: "100%",
            justifyContent: showExpanded ? "flex-start" : "center",
            fontSize: "0.8125rem",
          }}
        >
          {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          {showExpanded && <span>Modo {theme === "dark" ? "claro" : "oscuro"}</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: showExpanded ? "0.5rem 0.75rem" : "0.6rem 0",
              borderRadius: 8,
              cursor: "pointer",
              background: "transparent",
              color: "var(--text-muted)",
              border: "none",
              width: "100%",
              justifyContent: showExpanded ? "flex-start" : "center",
              fontSize: "0.8125rem",
            }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {showExpanded && <span>Colapsar</span>}
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
