"use client"

import { useState } from "react"
import { trades as demoTrades } from "@/lib/data"
import { useImportedTrades } from "@/lib/imported-trades"
import {
  getDayData, getWeeksInMonth, dateToString, filterByMonth,
  calcStats, fmtDollar, MONTH_NAMES_ES, TODAY,
} from "@/lib/utils"

const DAY_HDRS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]

function fmtShort(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : "+"
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  return `${sign}$${Math.round(abs)}`
}

export default function CalendarioPage() {
  const [ty, tm] = TODAY.split("-").map(Number)
  const [year, setYear] = useState(ty)
  const [month, setMonth] = useState(tm)

  const { importedTrades, meta: ibMeta } = useImportedTrades()
  const isLive = !!(ibMeta && importedTrades.length > 0)
  const trades = isLive ? importedTrades : demoTrades

  const monthTrades = filterByMonth(trades, year, month)
  const stats = calcStats(monthTrades)
  const dayData = getDayData(trades, year, month)
  const weeks = getWeeksInMonth(year, month)

  function nav(dir: -1 | 1) {
    let m = month + dir, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setYear(y); setMonth(m)
  }

  function goToday() {
    setYear(ty); setMonth(tm)
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>Operativa</span>
          <h1 style={{ fontSize: 28, margin: "4px 0 0" }}>Calendario</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "3px 0 0" }}>Vistas mensual y semanal de tu P&L.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => nav(-1)} style={navBtn}>{"‹"}</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 150, textAlign: "center" }}>
              {MONTH_NAMES_ES[month - 1]} {year}
            </span>
            <button onClick={() => nav(1)} style={navBtn}>{"›"}</button>
          </div>
          <button onClick={goToday} style={todayBtn}>Hoy</button>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <span>{stats.tradeCount}t</span>
            <span style={{ marginLeft: 12, fontWeight: 700, color: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>
              {fmtDollar(stats.totalPnl, 2)}
            </span>
          </div>
        </div>
      </header>

      {/* Calendar grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr) 100px", gap: 2 }}>
          {DAY_HDRS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-secondary)", padding: "6px 0", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
          <div style={{ textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--amber)", padding: "6px 0", textTransform: "uppercase" }}>
            TOTAL
          </div>
        </div>

        {/* Weeks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {weeks.map((week, wi) => {
            let wPnl = 0, wT = 0
            for (const d of week) {
              const dd = dayData.get(dateToString(d))
              if (dd) { wPnl += dd.pnl; wT += dd.tradeCount }
            }
            const weekDays = week.slice(0, 6)

            return (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr) 100px", gap: 2, flex: 1 }}>
                {weekDays.map((date, di) => {
                  const ds = dateToString(date)
                  const inMonth = date.getMonth() + 1 === month && date.getFullYear() === year
                  const dd = dayData.get(ds)
                  const isToday = ds === TODAY
                  const hasPnl = !!dd && inMonth

                  const bg = isToday
                    ? "rgba(59,130,246,0.12)"
                    : hasPnl
                      ? dd!.pnl > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"
                      : "var(--bg-card)"

                  return (
                    <div
                      key={di}
                      style={{
                        background: bg,
                        borderRadius: 8,
                        padding: "10px 12px",
                        minHeight: 90,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        opacity: inMonth ? 1 : 0.25,
                        border: isToday ? "1.5px solid rgba(59,130,246,0.6)" : "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 12, color: isToday ? "#3b82f6" : "var(--text-secondary)", fontWeight: isToday ? 700 : 400 }}>
                        {date.getDate()}
                      </span>
                      {hasPnl && (
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: dd!.pnl > 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
                            {fmtShort(dd!.pnl)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
                            {dd!.tradeCount}t
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Week total */}
                <div style={{
                  background: wT > 0 ? (wPnl >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)") : "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  minHeight: 90,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderLeft: "2px solid var(--border)",
                }}>
                  {wT > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--text-secondary)", textTransform: "uppercase" }}>Sem.</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: wPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                        {fmtShort(wPnl)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{wT}t</div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text-secondary)", fontSize: 18, cursor: "pointer", padding: "4px 12px", lineHeight: 1.4,
}

const todayBtn: React.CSSProperties = {
  background: "var(--amber-dim)", border: "1px solid var(--amber)", borderRadius: 8,
  color: "var(--amber)", fontSize: 13, cursor: "pointer", padding: "6px 14px", fontWeight: 600,
}
