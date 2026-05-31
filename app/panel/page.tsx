"use client"

import { useState } from "react"
import { trades as demoTrades } from "@/lib/data"
import { useImportedTrades } from "@/lib/imported-trades"
import {
  calcStats, filterByPeriod, filterByMonth, tradePnl,
  getTickerStats, MONTH_NAMES_ES, TODAY, fmtDollar, fmtDollarAbs,
  dateToString, getWeeksInMonth, getDayData,
} from "@/lib/utils"
import ProfitFactorChart from "@/components/ProfitFactorChart"
import WinRateGauge from "@/components/WinRateGauge"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function buildCumulativePnl(trades: ReturnType<typeof demoTrades.filter>) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  const points: { date: string; pnl: number }[] = []
  for (const t of sorted) {
    cum += tradePnl(t)
    const last = points[points.length - 1]
    if (last && last.date === t.date) {
      last.pnl = cum
    } else {
      points.push({ date: t.date, pnl: cum })
    }
  }
  return points
}

function buildMonthlyPnl(trades: ReturnType<typeof demoTrades.filter>) {
  const map = new Map<string, number>()
  for (const t of trades) {
    const ym = t.date.slice(0, 7)
    map.set(ym, (map.get(ym) ?? 0) + tradePnl(t))
  }
  const years = new Set<number>()
  map.forEach((_, k) => years.add(parseInt(k.slice(0, 4))))
  return { map, years: Array.from(years).sort() }
}

function fmtShort(n: number): string {
  if (n === 0) return "—"
  const abs = Math.abs(n)
  const s = n < 0 ? "-" : "+"
  if (abs >= 1000) return `${s}$${(abs / 1000).toFixed(1)}K`
  return `${s}$${Math.round(abs)}`
}

const DAY_HDRS = ["L", "M", "X", "J", "V", "S"]

export default function PanelPage() {
  const [ty, tm] = TODAY.split("-").map(Number)
  const [calYear, setCalYear] = useState(ty)
  const [calMonth, setCalMonth] = useState(tm)

  const { importedTrades, meta: ibMeta } = useImportedTrades()
  const isLive = !!(ibMeta && importedTrades.length > 0)
  const trades = isLive ? importedTrades : demoTrades

  const yearTrades = filterByPeriod(trades, "anio")
  const stats = calcStats(yearTrades)
  const monthTrades = filterByMonth(trades, calYear, calMonth)
  const monthStats = calcStats(monthTrades)
  const tickerStats = getTickerStats(monthTrades).slice(0, 6)
  const cumulativePnl = buildCumulativePnl(yearTrades)
  const { map: monthlyMap, years } = buildMonthlyPnl(trades)

  const weeks = getWeeksInMonth(calYear, calMonth)
  const dayData = getDayData(trades, calYear, calMonth)

  function navCal(dir: -1 | 1) {
    let m = calMonth + dir, y = calYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setCalYear(y); setCalMonth(m)
  }

  const dateRange = cumulativePnl.length > 0
    ? `${cumulativePnl[0].date} · ${cumulativePnl[cumulativePnl.length - 1].date}`
    : ""

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
            {isLive ? "Main account · IBKR Flex Query" : "Demo data"}
          </span>
          <h1 style={{ fontSize: 28, margin: "4px 0 0" }}>Panel</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          01/01/{ty} — {TODAY.split("-").reverse().join("/")}
        </div>
      </header>

      {/* Top row: gauges + cumulative chart */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 220px 1fr", gap: 14 }}>
        {/* Profit factor */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>Factor de beneficio</div>
          <ProfitFactorChart
            profitFactor={stats.profitFactor}
            totalGains={stats.totalGains}
            totalLosses={stats.totalLosses}
          />
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: stats.profitFactor >= 1.5 ? "var(--green)" : stats.profitFactor >= 1 ? "var(--amber)" : "var(--red)" }}>
            {stats.profitFactor >= 99 ? "∞" : stats.profitFactor.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>factor de beneficio</div>
        </div>

        {/* Win rate */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>Tasa de acierto</div>
          <WinRateGauge
            winRate={stats.winRate}
            wins={stats.wins}
            breakevens={stats.breakevens}
            losses={stats.losses}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)" }}>
            {yearTrades.filter(t => t.status === "closed").length} ops cerradas este año
          </div>
        </div>

        {/* P&L acumulado */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>P&L Acumulado</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1.1, marginTop: 4 }}>
                {fmtDollar(stats.totalPnl, 2)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "right" }}>{dateRange}</div>
          </div>
          <div style={{ flex: 1, minHeight: 120 }}>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={cumulativePnl} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pnlG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stats.totalPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={stats.totalPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmtDollarAbs(v), "P&L"]}
                  labelFormatter={l => l}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={stats.totalPnl >= 0 ? "#22c55e" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#pnlG)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly P&L table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", width: 60 }}>AÑO</th>
              {MONTHS_SHORT.map(m => (
                <th key={m} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{m}</th>
              ))}
              <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const yearTotal = Array.from({ length: 12 }, (_, i) => {
                const ym = `${year}-${String(i + 1).padStart(2, "0")}`
                return monthlyMap.get(ym) ?? 0
              }).reduce((s, v) => s + v, 0)

              return (
                <tr key={year} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 13 }}>{year}</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const ym = `${year}-${String(i + 1).padStart(2, "0")}`
                    const val = monthlyMap.get(ym) ?? null
                    const isActive = year === calYear && i + 1 === calMonth
                    return (
                      <td
                        key={i}
                        onClick={() => { setCalYear(year); setCalMonth(i + 1) }}
                        style={{
                          padding: "10px 6px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: val !== null ? "pointer" : "default",
                          color: val === null ? "var(--text-secondary)" : val >= 0 ? "var(--green)" : "var(--red)",
                          background: isActive ? "var(--amber-dim)" : "transparent",
                          borderRadius: isActive ? 6 : 0,
                        }}
                      >
                        {val !== null ? fmtShort(val) : "—"}
                      </td>
                    )
                  })}
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, fontSize: 13, color: yearTotal >= 0 ? "var(--green)" : "var(--red)" }}>
                    {fmtShort(yearTotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom: mini calendar + tickers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
        {/* Mini calendar */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => navCal(-1)} style={navBtn}>{"‹"}</button>
              <span style={{ fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: "center" }}>
                {MONTH_NAMES_ES[calMonth - 1]} {calYear}
              </span>
              <button onClick={() => navCal(1)} style={navBtn}>{"›"}</button>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>{monthStats.tradeCount}t</span>
              <span style={{ fontWeight: 700, color: monthStats.totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmtDollar(monthStats.totalPnl, 0)}
              </span>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr) 54px", gap: 2, marginBottom: 2 }}>
            {DAY_HDRS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-secondary)", padding: "2px 0" }}>{d}</div>
            ))}
            <div style={{ textAlign: "center", fontSize: 10, color: "var(--amber)", padding: "2px 0" }}>SEM</div>
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => {
            let wPnl = 0, wT = 0
            for (const d of week) {
              const dd = dayData.get(dateToString(d))
              if (dd) { wPnl += dd.pnl; wT += dd.tradeCount }
            }
            const weekDays = week.slice(0, 6) // Mon–Sat only
            return (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr) 54px", gap: 2, marginBottom: 2 }}>
                {weekDays.map((date, di) => {
                  const ds = dateToString(date)
                  const inMonth = date.getMonth() + 1 === calMonth && date.getFullYear() === calYear
                  const dd = dayData.get(ds)
                  const isToday = ds === TODAY
                  const bg = isToday ? "rgba(59,130,246,0.2)" : dd && inMonth ? (dd.pnl > 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "transparent"
                  return (
                    <div key={di} style={{ background: bg, borderRadius: 6, padding: "4px 2px", minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 1, border: isToday ? "1px solid rgba(59,130,246,0.5)" : "1px solid transparent", opacity: inMonth ? 1 : 0.3 }}>
                      <span style={{ fontSize: 10, color: isToday ? "#3b82f6" : "var(--text-secondary)", fontWeight: isToday ? 700 : 400 }}>{date.getDate()}</span>
                      {dd && inMonth && (
                        <>
                          <span style={{ fontSize: 9, fontWeight: 700, color: dd.pnl > 0 ? "var(--green)" : "var(--red)" }}>
                            {dd.pnl > 0 ? "+" : ""}{Math.abs(dd.pnl) >= 1000 ? `$${(Math.abs(dd.pnl) / 1000).toFixed(1)}K` : `$${Math.round(Math.abs(dd.pnl))}`}
                          </span>
                          <span style={{ fontSize: 8, color: "var(--text-secondary)" }}>{dd.tradeCount}t</span>
                        </>
                      )}
                    </div>
                  )
                })}
                <div style={{ background: wT > 0 ? (wPnl >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)") : "transparent", borderRadius: 6, minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, borderLeft: "1px solid var(--border)" }}>
                  {wT > 0 && (
                    <>
                      <span style={{ fontSize: 9, fontWeight: 700, color: wPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                        {wPnl > 0 ? "+" : ""}{Math.abs(wPnl) >= 1000 ? `$${(Math.abs(wPnl) / 1000).toFixed(1)}K` : `$${Math.round(Math.abs(wPnl))}`}
                      </span>
                      <span style={{ fontSize: 8, color: "var(--text-secondary)" }}>{wT}t</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tickers del mes */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 14 }}>
            Tickers operados · {MONTH_NAMES_ES[calMonth - 1]}
          </div>
          {tickerStats.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sin operaciones este mes</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tickerStats.map(ts => {
                const maxAbs = Math.max(...tickerStats.map(s => Math.abs(s.pnl)))
                const pct = maxAbs > 0 ? Math.abs(ts.pnl) / maxAbs : 0
                return (
                  <div key={ts.ticker}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{ts.ticker}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: ts.pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                          {fmtDollar(ts.pnl, 0)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 6 }}>{ts.tradeCount}t</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--bg-hover)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, background: ts.pnl >= 0 ? "var(--green)" : "var(--red)", borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Open credit */}
          {stats.openCredit > 0 && (
            <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--bg-primary)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Crédito abierto</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--amber)" }}>+{fmtDollarAbs(stats.openCredit, 0)}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                {yearTrades.filter(t => t.status === "open").length} posiciones abiertas
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .panel-top { grid-template-columns: 1fr !important; }
          .panel-bot { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 6,
  color: "var(--text-secondary)", fontSize: 16, cursor: "pointer", padding: "2px 10px", lineHeight: 1.5,
}
