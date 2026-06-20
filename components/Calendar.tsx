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
  getMarketHoliday,
} from "@/lib/utils"
import { usdToEur } from "@/lib/currency"

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

  // Days within the viewed month where a position was opened and nothing closed (still pending)
  const openTradesByDay = useMemo(() => {
    const opens = new Map<string, number>()
    const hasClosed = new Map<string, boolean>()
    for (const t of monthTrades) {
      if (t.status === "open") opens.set(t.date, (opens.get(t.date) ?? 0) + 1)
      else hasClosed.set(t.date, true)
    }
    hasClosed.forEach((_, d) => opens.delete(d))
    return opens
  }, [monthTrades])

  // Current win-streak: consecutive most-recent days (any month, full history) with positive combined P&L
  const winStreak = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of trades) {
      map.set(t.date, (map.get(t.date) ?? 0) + tradePnl(t))
    }
    execPnlByDay.forEach((v, d) => map.set(d, (map.get(d) ?? 0) + v))
    const sortedDates = Array.from(map.keys()).sort()
    let streak = 0
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const pnl = map.get(sortedDates[i])!
      if (pnl > 0) streak++
      else break
    }
    return streak
  }, [trades, execPnlByDay])

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
          {winStreak > 0 && (
            <span style={{ fontSize: "0.8125rem", color: "var(--orange)", fontWeight: 600 }}>
              🔥 <span className="num">{winStreak}</span>
            </span>
          )}
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
                const isOpenOnly = isCurrentMonth && openTradesByDay.has(ds)
                const holiday = isCurrentMonth ? getMarketHoliday(ds) : undefined

                let bg = "transparent"
                let textColor = "var(--text-muted)"
                if (isToday) {
                  bg = "rgba(59,130,246,0.18)"
                  textColor = "var(--accent)"
                } else if (isOpenOnly) {
                  bg = "rgba(59,130,246,0.14)"
                  textColor = "var(--accent)"
                } else if (dd && isCurrentMonth) {
                  bg = isProfitable ? "rgba(34,197,94,0.12)" : isLoss ? "rgba(239,68,68,0.12)" : "var(--bg-hover)"
                  textColor = "var(--text-primary)"
                } else if (dayExecs && isCurrentMonth) {
                  bg = dayExecPnl > 0 ? "rgba(34,197,94,0.07)" : dayExecPnl < 0 ? "rgba(239,68,68,0.07)" : "var(--bg-hover)"
                  textColor = "var(--text-primary)"
                } else if (holiday) {
                  bg = "var(--purple-dim)"
                  textColor = "var(--purple)"
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
                      minHeight: "64px",
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
                    {isOpenOnly ? (
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>
                        OPEN
                      </span>
                    ) : (
                      <>
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
                        {holiday && !dd && !dayExecs && (
                          <span style={{ fontSize: "0.5rem", color: "var(--purple)", textAlign: "center", lineHeight: 1.1, fontWeight: 600, padding: "0 2px" }}>
                            {holiday}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              {/* Week summary column */}
              <div style={{
                background: (weekTrades > 0 || weekExecs > 0)
                  ? "rgba(251,146,60,0.14)"
                  : "transparent",
                borderRadius: "6px",
                padding: "0.375rem 0.375rem",
                minHeight: "64px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                borderLeft: "1px solid var(--border-subtle)",
              }}>
                <span style={{ fontSize: "0.625rem", color: "var(--orange)", fontWeight: 700, letterSpacing: "0.04em" }}>
                  S{wi + 1}
                </span>
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
      {selectedDay && (() => {
        const [dy, dm, dd2] = selectedDay.split("-").map(Number)
        const dateLabel = `${dd2} ${MONTH_NAMES_ES[dm - 1]} ${dy}`
        const openRows = selectedTrades.filter(t => t.status === "open")
        const closedOptionRows = selectedTrades.filter(t => t.status === "closed")
        const totalPnl = openRows.reduce((s, t) => s + tradePnl(t), 0)
          + closedOptionRows.reduce((s, t) => s + tradePnl(t), 0)
          + selectedExecs.reduce((s, e) => s + e.realizedPnl, 0)
        const closedCount = closedOptionRows.length + selectedExecs.length

        return (
          <div style={{
            marginTop: "0.75rem",
            padding: "1rem 1.125rem",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Operaciones del día
                </div>
                <div style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                  {dateLabel}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{
                background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "0.875rem", lineHeight: 1, padding: "0.375rem 0.5rem",
              }}>✕</button>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.875rem", fontSize: "0.8125rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Abiertos <span className="num" style={{ fontWeight: 700, color: "var(--text-primary)" }}>{openRows.length}</span></span>
              <span style={{ color: "var(--text-secondary)" }}>Cerrados <span className="num" style={{ fontWeight: 700, color: "var(--text-primary)" }}>{closedCount}</span></span>
              <span className="num" style={{ fontWeight: 700, color: totalPnl > 0 ? "var(--green)" : totalPnl < 0 ? "var(--red)" : "var(--text-muted)" }}>
                {totalPnl >= 0 ? "+" : ""}€{usdToEur(totalPnl).toFixed(2)}
              </span>
            </div>

            {/* Operaciones abiertas */}
            <div style={{ marginBottom: "0.875rem" }}>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                Operaciones abiertas
              </div>
              {openRows.length === 0 ? (
                <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Sin aperturas este día.
                </div>
              ) : (
                <DayDetailTable rows={openRows.map(t => ({
                  key: t.id,
                  symbol: t.ticker,
                  type: t.type,
                  action: "SELL" as const,
                  qty: t.qty,
                  price: t.premium,
                  commission: undefined,
                  pnl: tradePnl(t),
                }))} />
              )}
            </div>

            {/* Operaciones cerradas */}
            <div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                Operaciones cerradas
              </div>
              {closedCount === 0 ? (
                <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Sin cierres este día.
                </div>
              ) : (
                <DayDetailTable rows={[
                  ...closedOptionRows.map(t => ({
                    key: t.id,
                    symbol: t.ticker,
                    type: t.type,
                    action: (t.closePrice ?? 0) > 0 ? "BUY" : "EXPIRADA",
                    qty: t.qty,
                    price: t.closePrice ?? t.premium,
                    commission: undefined,
                    pnl: tradePnl(t),
                  })),
                  ...selectedExecs.map(e => ({
                    key: e.tradeId,
                    symbol: e.symbol,
                    type: e.secType,
                    action: e.side,
                    qty: e.size,
                    price: e.price,
                    commission: e.commission,
                    pnl: e.realizedPnl,
                  })),
                ]} />
              )}
            </div>
          </div>
        )
      })()}

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

interface DayDetailRow {
  key: string
  symbol: string
  type: string
  action: string
  qty: number
  price: number
  commission?: number
  pnl: number
}

function DayDetailTable({ rows }: { rows: DayDetailRow[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
      <thead>
        <tr>
          {["Símbolo", "Tipo", "Acción", "Cant.", "Precio", "Com.", "P&L"].map(h => (
            <th key={h} style={{ textAlign: h === "P&L" ? "right" : "left", padding: "0.2rem 0.4rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.625rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.key}>
            <td style={{ padding: "0.25rem 0.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{r.symbol}</td>
            <td style={{ padding: "0.25rem 0.4rem", color: r.type === "Put" ? "var(--red)" : r.type === "Call" ? "var(--accent)" : "var(--text-secondary)", fontWeight: 600, fontSize: "0.6875rem" }}>
              {r.type.toUpperCase()}
            </td>
            <td style={{ padding: "0.25rem 0.4rem", color: r.action === "EXPIRADA" ? "var(--text-muted)" : r.action === "SELL" ? "var(--orange)" : "var(--green)", fontSize: "0.6875rem", fontWeight: 600 }}>
              {r.action}
            </td>
            <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">{r.qty}</td>
            <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-secondary)" }} className="num">${r.price.toFixed(2)}</td>
            <td style={{ padding: "0.25rem 0.4rem", color: "var(--text-muted)" }} className="num">
              {r.commission !== undefined ? `€${Math.abs(usdToEur(r.commission)).toFixed(2)}` : "—"}
            </td>
            <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: r.pnl > 0 ? "var(--green)" : r.pnl < 0 ? "var(--red)" : "var(--text-muted)" }} className="num">
              {r.pnl !== 0 ? `${r.pnl >= 0 ? "+" : ""}€${usdToEur(r.pnl).toFixed(0)}` : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function fmtDollarShort(n: number): string {
  const eur = Math.abs(usdToEur(n))
  const sign = n < 0 ? "-" : "+"
  if (eur >= 1000) return `${sign}€${(eur / 1000).toFixed(1)}k`
  return `${sign}€${Math.round(eur)}`
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
