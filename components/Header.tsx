"use client"

import { useEffect, useState } from "react"
import { PeriodKey } from "@/lib/utils"

interface HeaderProps {
  theme: "dark" | "light"
  onThemeToggle: () => void
  period: PeriodKey
  onPeriodChange: (p: PeriodKey) => void
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  mes: "Este mes",
  anio: "Este año",
  todo: "Todo",
}

export default function Header({ theme, onThemeToggle, period, onPeriodChange }: HeaderProps) {
  const [open, setOpen] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [open])

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: title */}
      <div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
          Tortuga_Trades Dashboard 🐢
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
          Interactive Brokers · Tiempo real
        </p>
      </div>

      {/* Right: controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          style={{
            padding: "0.375rem 0.75rem",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
        </button>

        {/* Period dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
            style={{
              padding: "0.375rem 0.75rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>PERÍODO:</span>
            {" "}{PERIOD_LABELS[period]}{" "}▼
          </button>
          {open && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                overflow: "hidden",
                minWidth: "140px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                zIndex: 100,
              }}
            >
              {(Object.entries(PERIOD_LABELS) as [PeriodKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={e => { e.stopPropagation(); onPeriodChange(key); setOpen(false) }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.625rem 1rem",
                    textAlign: "left",
                    background: period === key ? "var(--accent-dim)" : "transparent",
                    color: period === key ? "var(--accent)" : "var(--text-primary)",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    border: "none",
                    fontWeight: period === key ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
