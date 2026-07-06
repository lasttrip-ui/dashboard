"use client"

import type { Trade } from "./types"

interface Props {
  trades: Trade[]
}

function fmt(n: number, d = 2): string {
  return Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function PnlCell({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: "var(--text-muted)" }}>—</span>
  const color = value > 0 ? "var(--green)" : "var(--red)"
  return (
    <span className="num" style={{ color, fontWeight: 500 }}>
      {value > 0 ? "+" : "-"}${fmt(Math.abs(value))}
    </span>
  )
}

export default function TradesPanel({ trades }: Props) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Recent Trades
          <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>
            last 90 days
          </span>
        </h2>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        <table className="tt-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Type</th>
              <th>Side</th>
              <th>Size</th>
              <th>Price</th>
              <th>Net</th>
              <th>P&L</th>
              <th>Commission</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => {
              const isBuy = t.side === "BUY"
              return (
                <tr key={t.tradeId}>
                  <td style={{ fontWeight: 600 }}>
                    {t.symbol}
                    {t.companyName && (
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 400 }}>
                        {t.companyName.slice(0, 22)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{
                      fontSize: "0.6875rem",
                      background: t.secType === "OPT" ? "var(--purple-dim)" : "var(--accent-dim)",
                      color: t.secType === "OPT" ? "var(--purple)" : "var(--accent)",
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}>
                      {t.secType}
                    </span>
                  </td>
                  <td style={{ color: isBuy ? "var(--green)" : "var(--red)", fontWeight: 600, fontSize: "0.8125rem" }}>
                    {t.side}
                  </td>
                  <td className="num">{t.size}</td>
                  <td className="num">${fmt(t.price)}</td>
                  <td className="num" style={{ color: "var(--text-secondary)" }}>${fmt(t.netAmount)}</td>
                  <td><PnlCell value={t.realizedPnl} /></td>
                  <td className="num" style={{ color: "var(--text-muted)" }}>${fmt(t.commission)}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{relativeTime(t.tradeTime)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
