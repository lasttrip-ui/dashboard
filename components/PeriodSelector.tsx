"use client"

import { useState, useRef, useEffect } from "react"
import { PeriodKey, TODAY } from "@/lib/utils"

interface PeriodSelectorProps {
  period: PeriodKey
  customRange: { from: string; to: string } | null
  onChange: (period: PeriodKey, customRange?: { from: string; to: string }) => void
}

const QUICK: { key: PeriodKey; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mes" },
  { key: "anio", label: "Este año" },
  { key: "todo", label: "Todo" },
]

function fmtShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

export default function PeriodSelector({ period, customRange, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(customRange?.from ?? TODAY)
  const [to, setTo] = useState(customRange?.to ?? TODAY)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const triggerLabel = period === "custom" && customRange
    ? `${fmtShort(customRange.from)} → ${fmtShort(customRange.to)}`
    : QUICK.find(q => q.key === period)?.label ?? "Período"

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          padding: "0.4rem 0.875rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-hover)",
          color: "var(--text-primary)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {triggerLabel} ▾
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          width: "300px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          padding: "0.875rem",
          zIndex: 200,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.875rem" }}>
            {QUICK.map(q => (
              <button
                key={q.key}
                onClick={() => { onChange(q.key); setOpen(false) }}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78125rem",
                  fontWeight: period === q.key ? 700 : 400,
                  background: period === q.key ? "var(--green-dim)" : "var(--bg-hover)",
                  color: period === q.key ? "var(--green)" : "var(--text-secondary)",
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            Personalizado
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={dateInputStyle} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={dateInputStyle} />
          </div>
          <button
            onClick={() => { onChange("custom", { from, to }); setOpen(false) }}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 8,
              border: "none",
              background: "var(--orange)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}

const dateInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.4rem 0.5rem",
  borderRadius: 7,
  border: "1px solid var(--border)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontSize: "0.75rem",
}
