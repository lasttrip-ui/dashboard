"use client"

import { useState, useEffect, useMemo } from "react"
import { navHistoryData } from "@/lib/data"
import { useAllTrades } from "@/hooks/use-all-trades"
import { calcStats, filterByPeriod, filterByMonth, filterByDateRange, tradePnl, getTickerStats, MONTH_NAMES_ES, PeriodKey, TODAY } from "@/lib/utils"
import { usdToEur } from "@/lib/currency"
import { loadMergedExecutions } from "@/lib/executions"
import PeriodSelector from "@/components/PeriodSelector"
import WinRateGauge from "@/components/WinRateGauge"
import ProfitFactorChart from "@/components/ProfitFactorChart"
import Calendar from "@/components/Calendar"
import TickersSidebar from "@/components/TickersSidebar"
import type { IBKRSnapshot, Trade as IBKRTrade } from "@/components/portfolio/types"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(n: number): string {
  const eur = Math.abs(usdToEur(n))
  const sign = n >= 0 ? "+" : "-"
  if (eur >= 1000) return `${sign}€${(eur / 1000).toFixed(1)}K`
  return `${sign}€${eur.toFixed(0)}`
}

function fmtEur(n: number): string {
  return `€${Math.abs(n).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`
}

function pnlColor(n: number) {
  return n > 0 ? "var(--green)" : n < 0 ? "var(--red)" : "var(--text-muted)"
}

const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

// ── Account Summary ───────────────────────────────────────────────────────────

function AccountSummary({ snapshot }: { snapshot: IBKRSnapshot | null }) {
  const s = snapshot?.summary
  const cells = [
    { label: "NLV", value: s ? fmtEur(s.netLiquidation) : "—" },
    { label: "Colchón", value: s ? fmtEur(s.excessLiquidity) : "—" },
    { label: "Poder de compra", value: s ? fmtEur(s.buyingPower ?? 0) : "—" },
    { label: "Liq. Excedente", value: s ? fmtEur(s.availableFunds) : "—" },
  ]
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Resumen de Cuenta
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flex: 1 }}>
        {cells.map(c => (
          <div key={c.label} style={{ background: "var(--bg-hover)", borderRadius: 8, padding: "0.5rem 0.625rem", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              {c.label}
            </div>
            <div className="num" style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── NAV History Chart ─────────────────────────────────────────────────────────

function NavHistoryCard({ snapshot }: { snapshot: IBKRSnapshot | null }) {
  // Use live IBKR NLV for the latest point so it always matches the account summary
  const liveNav = snapshot?.summary?.netLiquidation
  const data = useMemo(() => {
    if (!liveNav) return navHistoryData
    const copy = [...navHistoryData]
    copy[copy.length - 1] = { ...copy[copy.length - 1], nav: Math.round(liveNav) }
    return copy
  }, [liveNav])

  const first = data[0].nav
  const last  = data[data.length - 1].nav
  const gain  = last - first
  // With a tiny starting NAV (first snapshot = seed deposit) a %-since-inception
  // is meaningless noise (+34727%), so only show it from a real base
  const pct   = first >= 1000 ? ((last / first - 1) * 100).toFixed(1) : null
  const color = "#22c55e"

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Historial NAV Real · 2021 → Hoy
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Datos reales IBKR
          </div>
          {pct !== null && (
            <div style={{ fontSize: "0.75rem", color, fontWeight: 700 }} className="num">
              +{pct}%
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "2rem", marginBottom: "0.5rem", alignItems: "baseline", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>NAV Actual</div>
          <div className="num" style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1.1 }}>
            €{last.toLocaleString("es-ES")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ganancia total</div>
          <div className="num" style={{ fontSize: "1rem", fontWeight: 700, color }}>
            +€{gain.toLocaleString("es-ES")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Inicio</div>
          <div className="num" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            €{first}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 140 }}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
            <defs>
              <linearGradient id="grad_nav" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`}
              width={42}
            />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.75rem" }}
              formatter={(v: number) => [`€${v.toLocaleString("es-ES")}`, "NAV"]}
            />
            <Area type="monotone" dataKey="nav" stroke={color} strokeWidth={2.5} fill="url(#grad_nav)" dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Monthly Heatmap ───────────────────────────────────────────────────────────

function MonthlyHeatmap({
  years,
  trades,
  executions = [],
}: {
  years: number[]
  trades: import("@/lib/data").OptionTrade[]
  executions?: IBKRTrade[]
}) {
  const pnlByYear = useMemo(() => {
    const byYear: Record<number, Record<number, number>> = {}
    for (const year of years) {
      const result: Record<number, number> = {}

      // Real IBKR execution P&L (non-zero entries only, any secType)
      for (const e of executions) {
        if (!e.realizedPnl || e.realizedPnl === 0) continue
        const ey = parseInt(e.tradeTime.slice(0, 4), 10)
        const em = parseInt(e.tradeTime.slice(5, 7), 10)
        if (ey === year) result[em] = (result[em] ?? 0) + e.realizedPnl
      }

      // OptionTrade P&L for months where no execution data exists
      for (let m = 1; m <= 12; m++) {
        if (result[m] !== undefined) continue
        const monthTrades = filterByMonth(trades, year, m)
        if (monthTrades.length > 0) {
          const pnl = calcStats(monthTrades).totalPnl
          if (pnl !== 0) result[m] = pnl
        }
      }

      byYear[year] = result
    }
    return byYear
  }, [years, trades, executions])

  return (
    <div className="card" style={{ padding: "0.875rem 1rem" }}>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
        P&L Mensual
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8125rem" }}>
          <thead>
            <tr>
              <th style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.6875rem", padding: "0.25rem 0.5rem", textAlign: "left" }}>AÑO</th>
              {MONTHS_SHORT.map(m => (
                <th key={m} style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.6875rem", padding: "0.25rem 0.375rem", textAlign: "center" }}>{m}</th>
              ))}
              <th style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.6875rem", padding: "0.25rem 0.5rem", textAlign: "center" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const monthlyPnl = pnlByYear[year] ?? {}
              const total = Object.values(monthlyPnl).reduce((s, v) => s + v, 0)
              return (
                <tr key={year}>
                  <td style={{ padding: "0.25rem 0.5rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{year}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                    const v = monthlyPnl[m]
                    return (
                      <td key={m} style={{ padding: "0.1875rem 0.25rem", textAlign: "center" }}>
                        {v !== undefined ? (
                          <div style={{
                            background: v > 0 ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
                            color: v > 0 ? "var(--green)" : "var(--red)",
                            borderRadius: 6,
                            padding: "0.25rem 0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }} className="num">
                            {fmtK(v)}
                          </div>
                        ) : (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "0.25rem" }}>—</div>
                        )}
                      </td>
                    )
                  })}
                  <td style={{ padding: "0.1875rem 0.25rem", textAlign: "center" }}>
                    <div style={{
                      background: total > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
                      color: total > 0 ? "var(--green)" : "var(--red)",
                      borderRadius: 6,
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      border: `1px solid ${total > 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }} className="num">
                      {fmtK(total)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Panel Page ───────────────────────────────────────────────────────────

export default function PanelPage() {
  const trades = useAllTrades()
  const [period, setPeriod] = useState<PeriodKey>("anio")
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null)
  const [viewYear, setViewYear] = useState(2026)
  const [viewMonth, setViewMonth] = useState(6)
  const [snapshot, setSnapshot] = useState<IBKRSnapshot | null>(null)

  useEffect(() => {
    const [ty, tm] = TODAY.split("-").map(Number)
    setViewYear(ty)
    setViewMonth(tm)
  }, [])

  useEffect(() => {
    fetch("/api/ibkr", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSnapshot(d))
      .catch(() => null)
  }, [])

  // Full real execution history (Apr 2025 → today) + imported CSVs for the
  // calendar, deduped across sources (see lib/executions.ts)
  const [executions, setExecutions] = useState<IBKRTrade[]>([])
  useEffect(() => {
    loadMergedExecutions().then(setExecutions)
  }, [])

  const periodTrades = period === "custom" && customRange
    ? filterByDateRange(trades, customRange.from, customRange.to)
    : filterByPeriod(trades, period)
  const stats = calcStats(periodTrades)

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
            Panel de Trading
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
            Main account · IBKR Flex Query
          </p>
        </div>
        <PeriodSelector
          period={period}
          customRange={customRange}
          onChange={(p, range) => { setPeriod(p); if (range) setCustomRange(range) }}
        />
      </div>

      {/* Row 1: KPI grid */}
      <div className="grid-kpi3">
        <AccountSummary snapshot={snapshot} />

        {/* Factor de Beneficio */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Factor de Beneficio
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ProfitFactorChart
              profitFactor={stats.profitFactor}
              totalGains={stats.totalGains}
              totalLosses={stats.totalLosses}
            />
          </div>
        </div>

        {/* Tasa de Acierto */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tasa de Acierto
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WinRateGauge
              winRate={stats.winRate}
              wins={stats.wins}
              breakevens={stats.breakevens}
              losses={stats.losses}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            {stats.tradeCount} operaciones
          </div>
        </div>
      </div>

      {/* Row 2: Full NAV History */}
      <NavHistoryCard snapshot={snapshot} />

      {/* Row 3: Monthly Heatmap (multi-year) */}
      <MonthlyHeatmap years={[2024, 2025, 2026]} trades={trades} executions={executions} />

      {/* Row 4: Calendar + Tickers sidebar */}
      <div className="grid-cal">
        <Calendar
          trades={trades}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m) }}
          executions={executions.length > 0 ? executions : (snapshot?.recentTrades ?? [])}
        />
        <TickersSidebar trades={trades} viewYear={viewYear} viewMonth={viewMonth} />
      </div>
    </div>
  )
}
