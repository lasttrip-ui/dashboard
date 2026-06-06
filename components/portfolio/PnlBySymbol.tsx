"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import type { Position } from "./types"

interface Props {
  positions: Position[]
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number; payload: { symbol: string; pnl: number; currency: string } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = d.pnl >= 0 ? "var(--green)" : "var(--red)"
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.symbol}</div>
      <div className="num" style={{ color, fontWeight: 500 }}>
        {d.pnl >= 0 ? "+" : "-"}${Math.abs(d.pnl).toFixed(0)} {d.currency}
      </div>
    </div>
  )
}

export default function PnlBySymbol({ positions }: Props) {
  const data = useMemo(() => {
    // Group by symbol (use only USD for simplicity, include STK & OPT combined)
    const map = new Map<string, { pnl: number; currency: string }>()
    for (const p of positions) {
      if (p.currency !== "USD") continue
      const existing = map.get(p.symbol)
      if (existing) existing.pnl += p.unrealizedPnl
      else map.set(p.symbol, { pnl: p.unrealizedPnl, currency: p.currency })
    }
    return Array.from(map.entries())
      .map(([symbol, v]) => ({ symbol, pnl: Math.round(v.pnl), currency: v.currency }))
      .sort((a, b) => a.pnl - b.pnl)
      .filter(d => Math.abs(d.pnl) > 5)
  }, [positions])

  return (
    <div className="card">
      <div style={{ marginBottom: "0.875rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Unrealized P&L by Symbol
          <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>
            USD · stocks + options combined
          </span>
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 60 }}>
          <XAxis
            dataKey="symbol"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            angle={-55}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            tickFormatter={v => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "var(--green)" : "var(--red)"} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
