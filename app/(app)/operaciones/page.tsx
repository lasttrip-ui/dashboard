"use client"

import { useState } from "react"
import { trades } from "@/lib/data"
import { calcStats, filterByMonth, MONTH_NAMES_ES } from "@/lib/utils"
import TradesTable from "@/components/TradesTable"
import { TODAY } from "@/lib/utils"

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "0.3rem 0.875rem",
      borderRadius: 6,
      border: active ? "none" : "1px solid var(--border)",
      background: active ? "var(--accent)" : "transparent",
      color: active ? "#fff" : "var(--text-secondary)",
      cursor: "pointer",
      fontSize: "0.8125rem",
      fontWeight: active ? 600 : 400,
    }}>{label}</button>
  )
}

export default function OperacionesPage() {
  const [ty, tm] = TODAY.split("-").map(Number)
  const [viewYear, setViewYear] = useState(ty)
  const [viewMonth, setViewMonth] = useState(tm)

  const monthTrades = filterByMonth(trades, viewYear, viewMonth)
  const stats = calcStats(monthTrades)
  const closedMonth = monthTrades.filter(t => t.status === "closed")
  const totalTrades = trades.length

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Operaciones
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
            {totalTrades} operaciones registradas en total
          </p>
        </div>
        {/* Stats strip */}
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "P&L mes", value: `${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toFixed(2)}`, color: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" },
            { label: "Ganadas", value: `${stats.wins}`, color: "var(--green)" },
            { label: "Perdidas", value: `${stats.losses}`, color: "var(--red)" },
            { label: "Win rate", value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 60 ? "var(--green)" : "var(--orange)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div className="num" style={{ fontSize: "1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trades Table */}
      <TradesTable
        trades={trades}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m) }}
      />
    </div>
  )
}
