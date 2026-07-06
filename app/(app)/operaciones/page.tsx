"use client"

import { useState, useEffect, useRef } from "react"
import { useAllTrades } from "@/hooks/use-all-trades"
import { calcStats, filterByMonth, filterByYear, fmtDollar, MONTH_NAMES_ES } from "@/lib/utils"
import TradesTable from "@/components/TradesTable"
import ExecutionsTable from "@/components/ExecutionsTable"
import AddTradeModal from "@/components/AddTradeModal"
import { TODAY } from "@/lib/utils"
import type { OptionTrade } from "@/lib/data"

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

type ViewMode = "mes" | "anio" | "todo"
type DataSource = "estrategias" | "ejecuciones"

export default function OperacionesPage() {
  const trades = useAllTrades()
  const [ty, tm] = TODAY.split("-").map(Number)
  const [source, setSource] = useState<DataSource>("estrategias")
  const [viewMode, setViewMode] = useState<ViewMode>("mes")
  const [viewYear, setViewYear] = useState(ty)
  const [viewMonth, setViewMonth] = useState(tm)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState<OptionTrade | undefined>(undefined)

  // If the current month has no trades yet, open on "Todo" so the first view isn't empty
  const autoAdjusted = useRef(false)
  useEffect(() => {
    if (autoAdjusted.current || trades.length === 0) return
    autoAdjusted.current = true
    if (filterByMonth(trades, ty, tm).length === 0) setViewMode("todo")
  }, [trades, ty, tm])

  const periodTrades = viewMode === "mes"
    ? filterByMonth(trades, viewYear, viewMonth)
    : viewMode === "anio"
      ? filterByYear(trades, viewYear)
      : trades
  const stats = calcStats(periodTrades)
  const totalTrades = trades.length
  const statsLabel = viewMode === "mes" ? "P&L mes" : viewMode === "anio" ? "P&L año" : "P&L total"

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
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {[
            { label: statsLabel, value: stats.tradeCount > 0 ? fmtDollar(stats.totalPnl) : "—", color: stats.tradeCount === 0 ? "var(--text-muted)" : stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" },
            { label: "Ganadas", value: `${stats.wins}`, color: stats.tradeCount === 0 ? "var(--text-muted)" : "var(--green)" },
            { label: "Perdidas", value: `${stats.losses}`, color: stats.tradeCount === 0 ? "var(--text-muted)" : "var(--red)" },
            { label: "Win rate", value: stats.wins + stats.losses > 0 ? `${stats.winRate.toFixed(1)}%` : "—", color: stats.wins + stats.losses === 0 ? "var(--text-muted)" : stats.winRate >= 60 ? "var(--green)" : "var(--orange)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div className="num" style={{ fontSize: "1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "0.4rem 0.875rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            + Nueva
          </button>
        </div>
      </div>

      {/* Source toggle: curated strategy trades vs raw IBKR executions */}
      <div style={{ display: "flex", gap: "2px", background: "var(--bg-card)", borderRadius: 8, padding: "3px", alignSelf: "flex-start", border: "1px solid var(--border)" }}>
        {([
          { key: "estrategias", label: "Estrategias" },
          { key: "ejecuciones", label: "Ejecuciones IBKR" },
        ] as { key: DataSource; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setSource(t.key)} style={{
            padding: "0.35rem 0.875rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: source === t.key ? "var(--accent)" : "transparent",
            color: source === t.key ? "#fff" : "var(--text-secondary)",
            fontSize: "0.8125rem", fontWeight: source === t.key ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {source === "ejecuciones" ? (
        <ExecutionsTable />
      ) : (
        <TradesTable
          trades={trades}
          viewMode={viewMode}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onModeChange={setViewMode}
          onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m) }}
          onYearChange={y => setViewYear(y)}
          onEdit={trade => setEditingTrade(trade)}
        />
      )}

      {(showAddModal || editingTrade) && (
        <AddTradeModal
          editingTrade={editingTrade}
          onClose={() => { setShowAddModal(false); setEditingTrade(undefined) }}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}
