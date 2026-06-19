"use client"

import { OptionTrade } from "@/lib/data"
import { calcStats, filterByMonth, getTickerStats, fmtDollar, fmtDollarAbs, MONTH_NAMES_ES } from "@/lib/utils"
import ProfitFactorChart from "./ProfitFactorChart"

interface TickersSidebarProps {
  trades: OptionTrade[]
  viewYear: number
  viewMonth: number
}

export default function TickersSidebar({ trades, viewYear, viewMonth }: TickersSidebarProps) {
  const monthTrades = filterByMonth(trades, viewYear, viewMonth)
  const allOpenTrades = trades.filter(t => t.status === "open")
  const monthStats = calcStats(monthTrades)
  const allStats = calcStats(trades)

  const tickerStats = getTickerStats(monthTrades)
  const maxPnl = tickerStats.length > 0 ? Math.max(...tickerStats.map(t => Math.abs(t.pnl))) : 1

  const monthName = MONTH_NAMES_ES[viewMonth - 1].toUpperCase()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Traded Tickers */}
      <div className="card">
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.875rem" }}>
          Traded Tickers — {monthName}
        </div>
        {tickerStats.length === 0 ? (
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
            Sin trades
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {tickerStats.map(ts => {
              const pct = maxPnl > 0 ? Math.abs(ts.pnl) / maxPnl : 0
              const isPos = ts.pnl >= 0
              return (
                <div key={ts.ticker}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {ts.ticker}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{ fontSize: "0.8125rem", color: isPos ? "var(--green)" : "var(--red)", fontWeight: 600 }} className="num">
                        {fmtDollar(ts.pnl, 0)}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} className="num">
                        {ts.tradeCount}t
                      </span>
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct * 100}%`,
                      background: isPos ? "var(--green)" : "var(--red)",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Crédito Abierto */}
      <div className="card">
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
          Crédito Abierto
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#3b82f6" }} className="num">
          {fmtDollarAbs(allStats.openCredit)}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
          {allOpenTrades.length} posiciones abiertas
        </div>
      </div>

      {/* Profit Factor - Mes */}
      <div className="card">
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
          Profit Factor — {monthName}
        </div>
        <ProfitFactorChart
          profitFactor={monthStats.profitFactor}
          totalGains={monthStats.totalGains}
          totalLosses={monthStats.totalLosses}
          size="small"
        />
      </div>
    </div>
  )
}
