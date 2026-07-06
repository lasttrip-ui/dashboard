"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { fmtDollarAbs } from "@/lib/utils"

interface ProfitFactorChartProps {
  profitFactor: number
  totalGains: number
  totalLosses: number
  size?: "normal" | "small"
}

export default function ProfitFactorChart({ profitFactor, totalGains, totalLosses, size = "normal" }: ProfitFactorChartProps) {
  const total = totalGains + totalLosses
  const gainsPct = total > 0 ? totalGains / total : 0.5
  const lossesPct = 1 - gainsPct

  if (total === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: size === "small" ? 80 : 110, gap: "0.25rem",
      }}>
        <span style={{ fontSize: size === "small" ? "0.75rem" : "0.875rem", color: "var(--text-muted)" }}>
          Sin datos
        </span>
        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
          No hay operaciones cerradas en este período
        </span>
      </div>
    )
  }

  const data = [
    { value: gainsPct, color: "#f97316" },
    { value: lossesPct, color: "#2a2a2a" },
  ]

  const chartH = size === "small" ? 80 : 110
  const innerR = size === "small" ? 26 : 34
  const outerR = size === "small" ? 36 : 46
  const valueFontSize = size === "small" ? "1rem" : "1.25rem"
  const labelFontSize = size === "small" ? "0.625rem" : "0.6875rem"

  const pfDisplay = profitFactor >= 99 ? "∞" : profitFactor.toFixed(2)

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: "100%", height: chartH }}>
        <ResponsiveContainer width="100%" height={chartH}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: valueFontSize, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }} className="num">
            {pfDisplay}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem" }}>
        <span style={{ fontSize: labelFontSize, color: "var(--green)", fontWeight: 600 }} className="num">
          +{fmtDollarAbs(totalGains, 0)}
        </span>
        <span style={{ fontSize: labelFontSize, color: "var(--red)", fontWeight: 600 }} className="num">
          -{fmtDollarAbs(totalLosses, 0)}
        </span>
      </div>
    </div>
  )
}
