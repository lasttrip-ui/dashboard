"use client"

import { PeriodStats } from "@/lib/utils"
import { fmtDollar, fmtDollarAbs } from "@/lib/utils"
import ProfitFactorChart from "./ProfitFactorChart"
import WinRateGauge from "./WinRateGauge"
import PnlMiniChart from "./PnlMiniChart"
import { cumulativePnlData } from "@/lib/data"

interface KpiCardsProps {
  stats: PeriodStats
  periodLabel: string
}

export default function KpiCards({ stats, periodLabel }: KpiCardsProps) {
  const pnlColor = stats.totalPnl >= 0 ? "var(--green)" : "var(--red)"

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.35fr 1.65fr",
      gap: "1rem",
    }}>
      {/* Card 1: P&L PERÍODO */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          P&L {periodLabel}
        </div>
        <div style={{ fontSize: "1.875rem", fontWeight: 800, color: pnlColor, lineHeight: 1.1 }} className="num">
          {fmtDollar(stats.totalPnl)}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }} className="num">
          {stats.tradeCount} trades
        </div>
      </div>

      {/* Card 2: PROFIT FACTOR */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Profit Factor
        </div>
        <ProfitFactorChart
          profitFactor={stats.profitFactor}
          totalGains={stats.totalGains}
          totalLosses={stats.totalLosses}
        />
      </div>

      {/* Card 3: WIN RATE */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Win Rate
        </div>
        <WinRateGauge
          winRate={stats.winRate}
          wins={stats.wins}
          breakevens={stats.breakevens}
          losses={stats.losses}
        />
      </div>

      {/* Card 4: P&L ACUMULADO */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minHeight: 160 }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          P&L Acumulado
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <PnlMiniChart
            data={cumulativePnlData}
            dateRange="2026-01 → 2026-04"
          />
        </div>
      </div>
    </div>
  )
}
