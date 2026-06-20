"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { fmtDollarAbs } from "@/lib/utils"
import { usdToEur } from "@/lib/currency"

interface DataPoint {
  date: string
  pnl: number
}

interface PnlMiniChartProps {
  data: DataPoint[]
  dateRange: string
}

export default function PnlMiniChart({ data, dateRange }: PnlMiniChartProps) {
  const minVal = Math.min(0, ...data.map(d => d.pnl))
  const maxVal = Math.max(...data.map(d => d.pnl))

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "right", marginBottom: "0.25rem" }}>
        {dateRange}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.replace("2026-", "")}
            />
            <YAxis
              domain={[minVal * 1.05, maxVal * 1.05]}
              tick={{ fontSize: 9, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={v => `€${Math.round(usdToEur(v) / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.75rem",
                color: "var(--text-primary)",
              }}
              formatter={(v: number) => [fmtDollarAbs(v), "P&L"]}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#pnlGrad)"
              dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
