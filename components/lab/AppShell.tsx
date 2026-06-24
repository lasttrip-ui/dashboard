"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  BookOpen,
  FileText,
  Bookmark,
  CandlestickChart,
  NotebookPen,
  Menu,
  X,
  Sun,
  Moon,
  User,
  ChevronDown,
  Briefcase,
  type LucideIcon,
} from "lucide-react"
import { useLocalStorage } from "@/lib/store"
import { USER } from "@/lib/content"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutGrid },
  { href: "/cartera", label: "Cartera", icon: Briefcase },
  { href: "/operaciones", label: "Operativa", icon: CandlestickChart },
  { href: "/bitacora", label: "Bitácora", icon: NotebookPen },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [theme, setTheme] = useLocalStorage<"dark" | "light">("lol-theme", "dark")
  const [drawer, setDrawer] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  useEffect(() => {
    setDrawer(false)
    setUserOpen(false)
  }, [pathname])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9000,
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Brand />

          <nav className="lol-desktop-nav" style={{ display: "flex", gap: 2, flex: 1, marginLeft: 8 }}>
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 13px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--amber)" : "var(--text-secondary)",
                    background: active ? "var(--amber-dim)" : "transparent",
                    transition: "all .15s",
                  }}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              style={iconBtn}
            >
              {theme === "dark" ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
            </button>

            <div className="lol-user-wrap" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 11px",
                  borderRadius: 8,
                  background: userOpen ? "var(--amber-dim)" : "rgba(248,250,252,0.05)",
                  border: `1px solid ${userOpen ? "var(--amber)" : "var(--border)"}`,
                  color: userOpen ? "var(--amber)" : "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <User size={17} strokeWidth={1.75} />
                <span className="lol-user-name">{USER.name}</span>
                <ChevronDown size={14} strokeWidth={1.75} />
              </button>
              {userOpen && (
                <div
                  className="animate-in"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    minWidth: 200,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: 6,
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
                    <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>{USER.name}</strong>
                    <div style={{ marginTop: 4 }}>
                      <span className="lab-badge lab-badge--premium">Premium</span>
                    </div>
                  </div>
                  <Link href="/favoritos" style={menuLink}><Bookmark size={15} strokeWidth={1.75} /> Favoritos</Link>
                  <Link href="/operaciones" style={menuLink}><CandlestickChart size={15} strokeWidth={1.75} /> Mi operativa</Link>
                </div>
              )}
            </div>

            <button
              type="button"
              className="lol-burger"
              onClick={() => setDrawer(true)}
              aria-label="Abrir menú"
              style={{ ...iconBtn, display: "none" }}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)", zIndex: 9997 }}
          />
          <aside
            className="animate-in"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(300px,85vw)",
              background: "var(--bg-card)",
              borderRight: "1px solid var(--border)",
              zIndex: 9998,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflowY: "auto",
            }}
          >
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Cerrar"
              style={{ ...iconBtn, alignSelf: "flex-end", marginBottom: 8 }}
            >
              <X size={18} strokeWidth={1.75} />
            </button>
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "11px 13px",
                    borderRadius: 9,
                    fontSize: 15,
                    fontWeight: 500,
                    color: active ? "var(--amber)" : "var(--text-secondary)",
                    background: active ? "var(--amber-dim)" : "transparent",
                  }}
                >
                  <item.icon size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
              )
            })}
          </aside>
        </>
      )}

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto", padding: "24px" }}>
        {children}
      </main>

      <Footer />

      {/* ── Mobile bottom nav ── */}
      <nav className="lol-mobnav">
        {NAV.slice(0, 5).map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} className={active ? "lol-mobnav-item --on" : "lol-mobnav-item"}>
              <item.icon size={22} strokeWidth={1.75} />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          )
        })}
      </nav>

      <ShellStyles />
    </div>
  )
}

function Brand() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--amber-dim)",
          border: "1px solid rgba(251,191,36,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--amber)",
        }}
      >
        <CandlestickChart size={17} strokeWidth={2} />
      </span>
      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>
        Cartera de <span style={{ color: "var(--amber)" }}>LastTrip</span>
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "1.4px",
          color: "var(--amber)",
          background: "var(--amber-dim)",
          border: "1px solid rgba(251,191,36,0.3)",
          borderRadius: 6,
          padding: "3px 6px",
        }}
      >
        PRO
      </span>
    </Link>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 8 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <span>© 2026 LWS Options Lab · El contenido es educativo y no constituye asesoramiento financiero.</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="lab-live-dot" /> Cuaderno de Bitácora · LIVE
        </span>
      </div>
    </footer>
  )
}

function ShellStyles() {
  return (
    <style>{`
      .lol-mobnav { display: none; }
      .lol-user-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (max-width: 920px) {
        .lol-desktop-nav { display: none !important; }
        .lol-user-name { display: none; }
        .lol-burger { display: inline-flex !important; }
        .lol-mobnav {
          display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 9000;
          justify-content: space-around; background: var(--bg-card);
          border-top: 1px solid var(--border); padding: 8px 0 calc(8px + env(safe-area-inset-bottom,0px));
        }
        .lol-mobnav-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1;
          color: var(--text-muted); font-size: 11px; font-weight: 500;
        }
        .lol-mobnav-item.--on { color: var(--amber); font-weight: 600; }
        body { padding-bottom: 70px; }
      }
    `}</style>
  )
}

const iconBtn: React.CSSProperties = {
  background: "rgba(248,250,252,0.05)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: 8,
  borderRadius: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const menuLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  borderRadius: 7,
  fontSize: 13,
  color: "var(--text-secondary)",
}
