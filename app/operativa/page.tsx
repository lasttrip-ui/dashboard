"use client"

import { useState } from "react"
import { trades } from "@/lib/data"
import { calcStats, filterByPeriod, PeriodKey } from "@/lib/utils"
import { useLocalStorage } from "@/lib/store"
import KpiCards from "@/components/KpiCards"
import Calendar from "@/components/Calendar"
import TickersSidebar from "@/components/TickersSidebar"
import TradesTable from "@/components/TradesTable"

const PERIOD_LABELS: Record<PeriodKey, string> = {
  mes: "ESTE MES",
  anio: "ESTE AÑO",
  todo: "TOTAL",
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "mes", label: "Mes" },
  { key: "anio", label: "Año" },
  { key: "todo", label: "Todo" },
]

export default function OperativaPage() {
  const [period, setPeriod] = useLocalStorage<PeriodKey>("lol-period", "anio")
  const [viewYear, setViewYear] = useState(2026)
  const [viewMonth, setViewMonth] = useState(4)

  const periodTrades = filterByPeriod(trades, period)
  const stats = calcStats(periodTrades)

  function handleMonthChange(y: number, m: number) {
    setViewYear(y)
    setViewMonth(m)
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
            Cuaderno de operaciones
          </span>
          <h1 style={{ fontSize: 30, margin: "6px 0 0" }}>Tu operativa</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Estrategia de venta de opciones (cobro de prima · theta decay).
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}>
          {PERIODS.map((p) => {
            const active = period === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  background: active ? "var(--amber)" : "transparent",
                  color: active ? "#0b1120" : "var(--text-secondary)",
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </header>

      <KpiCards stats={stats} periodLabel={PERIOD_LABELS[period]} />

      <div className="lol-operativa-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Calendar trades={trades} viewYear={viewYear} viewMonth={viewMonth} onMonthChange={handleMonthChange} />
        <TickersSidebar trades={trades} viewYear={viewYear} viewMonth={viewMonth} />
      </div>

      <TradesTable trades={trades} viewYear={viewYear} viewMonth={viewMonth} onMonthChange={handleMonthChange} />

      <style>{`
        @media (max-width: 880px) {
          .lol-operativa-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
