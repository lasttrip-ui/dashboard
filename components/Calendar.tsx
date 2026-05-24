"use client"

import { useState } from "react"
import { OptionTrade } from "@/lib/data"
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
}

export default function Calendar({ trades, viewYear, viewMonth, onMonthChange }: CalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; pnl: number; count: number } | null>(null)

  const monthTrades = filterByMonth(trades, viewYear, viewMonth)
  const dayData = getDayData(trades, viewYear, viewMonth)
  const monthStats = calcStats(monthTrades)
  const weeks = getWeeksInMonth(viewYear, viewMonth)

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
          for (const d of week) {
            const ds = dateToString(d)
            const dd = dayData.get(ds)
            if (dd) { weekPnl += dd.pnl; weekTrades += dd.tradeCount }
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

                let bg = "transparent"
                let textColor = "var(--text-muted)"
                if (isToday) {
                  bg = "rgba(59,130,246,0.18)"
                  textColor = "var(--accent)"
                } else if (dd && isCurrentMonth) {
                  bg = isProfitable ? "rgba(34,197,94,0.12)" : isLoss ? "rgba(239,68,68,0.12)" : "var(--bg-hover)"
                  textColor = "var(--text-primary)"
                }

                return (
                  <div
                    key={di}
                    onMouseEnter={() => dd && setTooltip({ date: ds, pnl: dd.pnl, count: dd.tradeCount })}
                    onMouseLeave={() => setTooltip(null)}
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
                      cursor: dd ? "pointer" : "default",
                      position: "relative",
                      opacity: isCurrentMonth ? 1 : 0.3,
                      border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
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
                    {dd && isCurrentMonth && (
                      <>
                        <span style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: isProfitable ? "var(--green)" : isLoss ? "var(--red)" : "var(--text-secondary)",
                          lineHeight: 1,
                        }} className="num">
                          {dd.pnl >= 0 ? "+" : ""}{Math.round(dd.pnl) >= 0 ? "" : ""}{fmtDollarShort(dd.pnl)}
                        </span>
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", lineHeight: 1 }}>
                          {dd.tradeCount}t
                        </span>
                      </>
                    )}
                  </div>
                )
              })}

              {/* Week summary column */}
              <div style={{
                background: weekTrades > 0 ? (weekPnl >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)") : "transparent",
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
                {weekTrades > 0 && (
                  <>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }} className="num">
                      {weekPnl >= 0 ? "+" : ""}{fmtDollarShort(weekPnl)}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{weekTrades}t</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
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
