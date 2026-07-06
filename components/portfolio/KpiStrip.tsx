"use client"

import type { AccountSummary, Balance } from "./types"

interface Props {
  summary: AccountSummary
  balances: Balance[]
}

function fmt(n: number, decimals = 0): string {
  return Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtCcy(n: number, ccy = "€", decimals = 0): string {
  const sign = n >= 0 ? "+" : "-"
  return `${sign}${ccy}${fmt(Math.abs(n), decimals)}`
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: "1.375rem", fontWeight: 600, color: color ?? "var(--text-primary)", lineHeight: 1.15 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function KpiStrip({ summary, balances }: Props) {
  const base = balances.find(b => b.currency === "BASE")
  const usdBal = balances.find(b => b.currency === "USD")
  const upnl = base?.unrealizedPnl ?? summary.unrealizedPnl
  const pnlColor = upnl >= 0 ? "var(--green)" : "var(--red)"
  const lev = parseFloat(summary.leverage)
  const levColor = lev > 3 ? "var(--red)" : lev > 2 ? "var(--orange)" : "var(--text-primary)"

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <KpiCard
        label="Net Liquidation"
        value={`€${fmt(summary.netLiquidation)}`}
        sub={`Equity €${fmt(summary.equityWithLoanValue ?? summary.netLiquidation)}`}
      />
      <KpiCard
        label="Unrealized P&L"
        value={fmtCcy(upnl, "€")}
        sub={usdBal ? `USD: ${fmtCcy(usdBal.unrealizedPnl, "$")}` : undefined}
        color={pnlColor}
      />
      <KpiCard
        label="Cash"
        value={`€${fmt(summary.totalCashValue)}`}
        sub={`Avail: €${fmt(summary.availableFunds)}`}
      />
      <KpiCard
        label="Gross Exposure"
        value={`€${fmt(summary.grossPositionValue)}`}
        sub={`Maint margin: €${fmt(summary.maintenanceMargin)}`}
      />
      <KpiCard
        label="Leverage"
        value={`${summary.leverage}x`}
        sub={`Excess liq: €${fmt(summary.excessLiquidity)}`}
        color={levColor}
      />
      <KpiCard
        label="Dividends"
        value={`€${fmt(summary.dividends, 2)}`}
        sub="Accrued"
      />
    </div>
  )
}
