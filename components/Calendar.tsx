"use client"

import { useState, useMemo } from "react"
import { OptionTrade } from "@/lib/data"
import type { Trade as IBKRTrade } from "@/components/portfolio/types"
import {
  getDayData,
  getWeeksInMonth,
  dateToString,
  filterByMonth,
  tradePnl,
  MONTH_NAMES_ES,
  TODAY,
  calcStats,
  fmtDollar,
} from "@/lib/utils"

const DAY_HEADERS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

interface CalendarProps {
  trades: OptionTrade[]
  viewYear: number
  viewMonth: number
  onMonthChange: (year: number, month: number) => void
  executions?: IBKRTrade[]
}

export default function Calendar({ trades, viewYear, viewMonth, onMonthChange, executions = [] }: CalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; pnl: number; count: number } | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthTrades = filterByMonth(trades, viewYear, viewMonth)
  const dayData = getDayData(trades, viewYear, viewMonth)
  const monthStats = calcStats(monthTrades)
  const weeks = getWeeksInMonth(viewYear, viewMonth)

  // Real IBKR executions grouped by date (YYYY-MM-DD)
  const execsByDay = useMemo(() => {
    const map = new Map<string, IBKRTrade[]>()
    for (const e of executions) {
      const d = e.tradeTime.slice(0, 10)
      const list = map.get(d)
      if (list) list.push(e)
      else map.set(d, [e])
    }
    return map
  }, [executions])

  // Realized P&L per day from real executions
  const execPnlByDay = useMemo(() => {
    const map = new Map<string, number>()
    execsByDay.forEach((list, d) => {
      map.set(d, list.reduce((s, e) => s + e.realizedPnl, 0))
    })
    return map
  }, [execsByDay])

  const selectedTrades = selectedDay ? trades.filter(t => t.date === selectedDay) : []
  const selectedExecs = selectedDay ? (execsByDay.get(selectedDay) ?? []) : []

  function navigate(dir: -1 | 1) {
    let m = viewMonth + dir
    let y = viewYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    onMonthChange(y, m)
  }

  function goToday() {
    const [ty, tm] = TODAY.split("-").map(Number)
    onMonthChange(ty, tm)
  }

  return (
    <div className="card" style={{ flex: "0 0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>{"<"}</button>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, minWidth: "130px", textAlign: "center" }}>
            {MONTH_NAMES_ES[viewMonth - 1]} {viewYear}
          </span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>{">"}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            <span className="num">{monthStats.tradeCount}</span> trades&nbsp;&nbsp;
            <span style={{ color: monthStats.totalPnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }} className="num">
              {fmtDollar(monthStats.totalPnl)}
            </span>
          </span>
          <button onClick={goToday} style={todayBtnStyle}>Este mes</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr) 80px", gap: "2px", marginBottom: "2px" }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.25rem 0" }}>
            {d}
          </div>
        ))}
        <div style={{ textAlign: "center", fontSize: "0.6875rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.25rem 0" }}>
          SEM
        </div>
      </div>

      {/* Weeks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {weeks.map((week, wi) => {
          // Compute week totals
          let weekPnl = 0
          let weekTrades = 0
          let weekExecPnl = 0
          let weekExecs = 0
          for (const d of week) {
            const ds = dateToString(d)
            const dd = dayData.get(ds)
            if (dd) { weekPnl += dd.pnl; weekTrades += dd.tradeCount }
            const el = execsByDay.get(ds)
            if (el) { weekExecPnl += execPnlByDay.get(ds) ?? 0; weekExecs += el.length }
          }

          return (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr) 80px", gap: "2px" }}>
              {week.map((date, di) => {
                const ds = dateToString(date)
                const isCurrentMonth = date.getMonth() + 1 === viewMonth && date.getFullYear() === viewYear
                const dd = dayData.get(ds)
                const isToday = ds === TODAY
                const isProfitable = dd && dd.pnl > 0
                const isLoss = dd && dd.pnl < 0

                const dayExecs = execsByDay.get(ds)
                const dayExecPnl = execPnlByDay.get(ds) ?? 0
                const hasAny = !!dd || !!dayExecs
                const isSelected = selectedDay === ds

                let bg = "transparent"
                let textColor = "var(--text-muted)"
                if (isToday) {
                  bg = "rgba(59,130,246,0.18)"
                  textColor = "var(--accent)"
                } else if (dd && isCurrentMonth) {
                  bg = isProfitable ? "rgba(34,197,94,0.12)" : isLoss ? "rgba(239,68,68,0.12)" : "var(--bg-hover)"
                  textColor = "var(--text-primary)"
                } else if (dayExecs && isCurrentMonth) {
                  bg = dayExecPnl > 0 ? "rgba(34,197,94,0.07)" : dayExecPnl < 0 ? "rgba(239,68,68,0.07)" : "var(--bg-hover)"
                  textColor = "var(--text-primary)"
                }

                return (
                  <div
                    key={di}
                    onMouseEnter={() => dd && setTooltip({ date: ds, pnl: dd.pnl, count: dd.tradeCount })}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => hasAny && setSelectedDay(isSelected ? null : ds)}
                    style={{
                      background: bg,
                      borderRadius: "6px",
                      padding: "0.375rem 0.25rem",
                      minHeight: "56px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "2px",
                      cursor: hasAny ? "pointer" : "default",
                      position: "relative",
                      opacity: isCurrentMonth ? 1 : 0.3,
                      border: isSelected ? "1px solid var(--green)" : isToday ? "1px solid var(--accent)" : "1px solid transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{
                      fontSize: "0.6875rem",
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? "var(--accent)" : "var(--text-secondary)",
                      lineHeight: 1,
                    }}>
                      {date.getDate()}
                    </span>
                    {dd && isCurrentMonth && dd.pnl !== 0 && (
                      <>
                        <span style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: isProfitable ? "var(--green)" : isLoss ? "var(--red)" : "var(--text-secondary)",
                          lineHeight: 1,
                        }} className="num">
                          {fmtDollarShort(dd.pnl)}
                        </span>
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", lineHeight: 1 }}>
                          {dd.tradeCount}t
                        </span>
                      </>
                    )}
                    {dayExecs && isCurrentMonth && dayExecPnl !== 0 && (
                      <span style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        color: dayExecPnl > 0 ? "var(--green)" : "var(--red)",
                        lineHeight: 1,
                      }} className="num">
                        {fmtDollarShort(dayExecPnl)}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Week summary column */}
              <div style={{
                background: (weekTrades > 0 || weekExecs > 0)
                  ? ((weekPnl + weekExecPnl) >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)")
                  : "transparent",
                borderRadius: "6px",
                padding: "0.375rem 0.375rem",
                minHeight: "56px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                borderLeft: "1px solid var(--border-subtle)",
              }}>
                {weekTrades > 0 && weekPnl !== 0 && (
                  <>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }} className="num">
                      {fmtDollarShort(weekPnl)}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{weekTrades}t</span>
                  </>
                )}
                {weekExecPnl !== 0 && (
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: weekExecPnl >= 0 ? "var(--green)" : "var(--red)" }} className="num">
                    {fmtDollarShort(weekExecPnl)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.875rem 1rem",
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Movimientos del {selectedDay.split("-").reverse().join("/")}
              {selectedExecs.length > 0 && (() => {
                const total = selectedExecs.reduce((s, e) => s + e.realizedPnl, 0)
                return (
                  <span style={{ marginLeft: "0.75rem", fontWeight: 700, color: total > 0 ? "var(--green)" : total < 0 ? "var(--red)" : "var(--text-muted)" }} className="num">
                    {total >= 0 ? "+" : ""}${total.toFixed(2)} realizado
                  </span>
                )
              })()}
            </span>
            <button onClick={() => setSelectedDay(null)} style={{
              background: "transparent", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0.125rem 0.375rem",
            }}>✕</button>
          </div>

          {selectedTrades.length === 0 && selectedExecs.length === 0 && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sin movimientos este día.</div>
          )}

          {selectedTrades.length > 0 && (
            <div style={{ marginBottom: selectedExecs.length > 0 ? "0.875rem" : 0 }}>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                Operaciones de opciones
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr>
                    {["Ticker", "Tipo", "Cant.", "Prima", "Cierre", "Estado", "P&L"].map(h => (
                      <th key={h} style={{ textAlign: h === "P&L" ? "right" : "left", padding: "0.2rem 0.4rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.625rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTrades.map(t => {
                    const pnl = tradePnl(t)
                    return (
                      <tr key={t.id}>
                        <td style={{ padding: "0.25rem 0.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{t.ticker}</td>
                        <td style={{ padding: "0.25rem 0.4rem", color: t.type === "Put" ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                          {t.type.toUpperCase()}
                        </td>
                        <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">{t.qty}</td>
                        <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">${t.premium.toFixed(2)}</td>
                        <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">
                          {t.status === "closed" ? `$${(t.closePrice ?? 0).toFixed(2)}` : "—"}
                        </td>
                        <td style={{ padding: "0.25rem 0.4rem", color: t.status === "open" ? "var(--accent)" : "var(--text-muted)", fontSize: "0.6875rem" }}>
                          {t.status === "open" ? "Abierta" : "Cerrada"}
                        </td>
                        <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: pnl > 0 ? "var(--green)" : pnl < 0 ? "var(--red)" : "var(--text-muted)" }} className="num">
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedExecs.length > 0 && (
            <div>
              <div style={{ fontSize: "0.625rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                Ejecuciones reales IBKR
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr>
                    {["Hora", "Símbolo", "Tipo", "Lado", "Cant.", "Precio", "P&L realizado"].map(h => (
                      <th key={h} style={{ textAlign: h.startsWith("P&L") ? "right" : "left", padding: "0.2rem 0.4rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.625rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedExecs.map(e => (
                    <tr key={e.tradeId}>
                      <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.6875rem" }}>
                        {e.tradeTime.slice(11, 16)}
                      </td>
                      <td style={{ padding: "0.25rem 0.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{e.symbol}</td>
                      <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)", fontSize: "0.6875rem" }}>{e.secType}</td>
                      <td style={{ padding: "0.25rem 0.4rem", fontWeight: 600, color: e.side === "SELL" ? "var(--red)" : "var(--green)" }}>
                        {e.side}
                      </td>
                      <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">{e.size}</td>
                      <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">${e.price.toFixed(2)}</td>
                      <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: e.realizedPnl > 0 ? "var(--green)" : e.realizedPnl < 0 ? "var(--red)" : "var(--text-muted)" }} className="num">
                        {e.realizedPnl !== 0 ? `${e.realizedPnl >= 0 ? "+" : ""}$${e.realizedPnl.toFixed(0)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && !selectedDay && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
        }}>
          {tooltip.date}: <span style={{ color: tooltip.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }} className="num">
            {fmtDollar(tooltip.pnl)}
          </span> · {tooltip.count} trade{tooltip.count !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

function fmtDollarShort(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : "+"
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`
  return `${sign}$${Math.round(abs)}`
}

const navBtnStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text-secondary)",
  fontSize: "0.875rem",
  cursor: "pointer",
  padding: "0.25rem 0.625rem",
  lineHeight: 1.5,
}

const todayBtnStyle: React.CSSProperties = {
  background: "var(--accent-dim)",
  border: "1px solid var(--accent)",
  borderRadius: "6px",
  color: "var(--accent)",
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: "0.25rem 0.625rem",
  fontWeight: 600,
}
