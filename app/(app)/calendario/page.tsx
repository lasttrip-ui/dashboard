"use client"

import { useState } from "react"
import { useAllTrades } from "@/hooks/use-all-trades"
import { calcStats, filterByMonth, tradePnl, getWeeksInMonth, dateToString, getDayData, MONTH_NAMES_ES, TODAY } from "@/lib/utils"
import { usdToEur } from "@/lib/currency"
import type { OptionTrade } from "@/lib/data"

const DAY_HEADERS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

function fmtK(n: number): string {
  const eur = Math.abs(usdToEur(n))
  const sign = n >= 0 ? "+" : "-"
  if (eur >= 1000) return `${sign}€${(eur / 1000).toFixed(1)}K`
  return `${sign}€${eur.toFixed(0)}`
}

type CalView = "mes" | "anio"

function YearView({ year, trades }: { year: number; trades: OptionTrade[] }) {
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
      {MONTHS.map(m => {
        const monthTrades = filterByMonth(trades, year, m)
        const stats = calcStats(monthTrades)
        const hasData = monthTrades.length > 0
        return (
          <div key={m} className="card" style={{ padding: "0.875rem 1rem" }}>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
              {MONTH_NAMES_ES[m - 1]}
            </div>
            {hasData ? (
              <>
                <div className="num" style={{ fontSize: "1.25rem", fontWeight: 700, color: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                  {fmtK(stats.totalPnl)}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {stats.wins}G · {stats.losses}P · {stats.winRate.toFixed(0)}% WR
                </div>
              </>
            ) : (
              <div className="num" style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>—</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ year, month, trades }: { year: number; month: number; trades: OptionTrade[] }) {
  const dayData = getDayData(trades, year, month)
  const weeks = getWeeksInMonth(year, month)
  const monthTrades = filterByMonth(trades, year, month)
  const monthStats = calcStats(monthTrades)
  const totalCount = monthTrades.length

  return (
    <div>
      {/* Month total bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }} className="num">{totalCount}t</span>
        <span className="num" style={{ fontSize: "1.25rem", fontWeight: 700, color: monthStats.totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>
          {fmtK(monthStats.totalPnl)}
        </span>
      </div>

      {/* Day headers + SEM */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr) 90px", gap: 3, marginBottom: 3 }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.25rem 0" }}>{d}</div>
        ))}
        <div style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.25rem 0" }}>SEM.</div>
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        const weekPnl = week.reduce((s, d) => {
          const ds = dateToString(d)
          return s + (dayData.get(ds)?.pnl ?? 0)
        }, 0)
        const weekCount = week.reduce((s, d) => s + (dayData.get(dateToString(d))?.tradeCount ?? 0), 0)
        const isCurrentMonth = (d: Date) => d.getMonth() + 1 === month && d.getFullYear() === year

        return (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr) 90px", gap: 3, marginBottom: 3 }}>
            {week.map((day, di) => {
              const ds = dateToString(day)
              const data = dayData.get(ds)
              const inMonth = isCurrentMonth(day)
              const isToday = ds === TODAY
              const hasTrades = data && data.tradeCount > 0
              const hasOpenTrades = !data && inMonth

              return (
                <div
                  key={di}
                  style={{
                    minHeight: 80,
                    borderRadius: 8,
                    border: isToday ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
                    background: !inMonth
                      ? "transparent"
                      : hasTrades
                        ? data.pnl > 0
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)"
                        : "var(--bg-card)",
                    padding: "0.375rem 0.5rem",
                    opacity: inMonth ? 1 : 0.25,
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{day.getDate()}</div>
                  {hasTrades && (
                    <>
                      <div className="num" style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: data.pnl > 0 ? "var(--green)" : "var(--red)",
                        marginTop: "0.25rem",
                        lineHeight: 1.2,
                      }}>
                        {fmtK(data.pnl)}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", position: "absolute", bottom: 4, left: 8 }}>
                        {data.tradeCount}t
                      </div>
                    </>
                  )}
                  {hasOpenTrades && (
                    <div style={{ fontSize: "0.6875rem", color: "var(--accent)", marginTop: "0.25rem" }}>OPEN</div>
                  )}
                </div>
              )
            })}

            {/* Week total */}
            <div style={{
              minHeight: 80,
              borderRadius: 8,
              background: weekCount > 0
                ? weekPnl >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"
                : "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "0.375rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
              <div style={{ fontSize: "0.5625rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>SEM.</div>
              {weekCount > 0 && (
                <>
                  <div className="num" style={{ fontSize: "0.875rem", fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                    {fmtK(weekPnl)}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{weekCount}t</div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CalendarioPage() {
  const trades = useAllTrades()
  const [ty, tm] = TODAY.split("-").map(Number)
  const [view, setView] = useState<CalView>("mes")
  const [viewYear, setViewYear] = useState(ty)
  const [viewMonth, setViewMonth] = useState(tm)

  function navigate(dir: -1 | 1) {
    if (view === "mes") {
      let m = viewMonth + dir
      let y = viewYear
      if (m < 1) { m = 12; y-- }
      if (m > 12) { m = 1; y++ }
      setViewMonth(m)
      setViewYear(y)
    } else {
      setViewYear(y => y + dir)
    }
  }

  const title = view === "mes" ? `${MONTH_NAMES_ES[viewMonth - 1]} ${viewYear}` : `${viewYear}`

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Calendario</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
            Vistas anual, mensual y semanal de tu P&L.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {(["anio", "mes"] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "0.3rem 0.875rem", borderRadius: 6, border: "none", cursor: "pointer",
              background: view === v ? "var(--accent)" : "var(--bg-hover)",
              color: view === v ? "#fff" : "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: view === v ? 600 : 400,
            }}>
              {v === "anio" ? "Año" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Nav + title */}
      <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <button onClick={() => navigate(-1)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem 0.625rem", fontSize: "0.875rem" }}>{"<"}</button>
          <span style={{ fontSize: "1rem", fontWeight: 700, minWidth: 160 }}>{title}</span>
          <button onClick={() => navigate(1)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem 0.625rem", fontSize: "0.875rem" }}>{">"}</button>
          <button onClick={() => { setViewYear(ty); setViewMonth(tm) }} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem 0.75rem", fontSize: "0.8125rem" }}>Hoy</button>
        </div>

        {view === "mes" && <MonthView year={viewYear} month={viewMonth} trades={trades} />}
        {view === "anio" && <YearView year={viewYear} trades={trades} />}
      </div>
    </div>
  )
}
