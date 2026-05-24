"use client"

interface WinRateGaugeProps {
  winRate: number
  wins: number
  breakevens: number
  losses: number
}

export default function WinRateGauge({ winRate, wins, breakevens, losses }: WinRateGaugeProps) {
  // Semicircle gauge: 0% at left, 100% at right, needle sweeps 180 degrees
  const clamp = Math.max(0, Math.min(100, winRate))
  // Angle: 0% = -90deg from top (i.e., pointing left), 100% = +90deg (pointing right)
  // SVG arc from 180 to 0 (top=90 means left half = left, right half = right)
  const cx = 100
  const cy = 95
  const r = 75
  const strokeW = 12

  // Arc path helper
  function polarToXY(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(startAngle: number, endAngle: number, radius: number) {
    const start = polarToXY(startAngle, radius)
    const end = polarToXY(endAngle, radius)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  // Gauge spans from -90 (left) to +90 (right) = 180 degrees total
  // In our polar coords: angle 0 = top, so left = 270deg, right = 90deg
  const startAngle = 180  // left
  const endAngle = 360    // right (wraps through top)

  // Fill angle based on winRate
  const fillAngle = startAngle + (clamp / 100) * 180

  // Color stops on gauge: red -> yellow -> green
  const needleAngle = startAngle + (clamp / 100) * 180
  const needleRad = ((needleAngle - 90) * Math.PI) / 180
  const needleLen = 55
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy + needleLen * Math.sin(needleRad)

  // Color based on rate
  const color = clamp >= 60 ? "#22c55e" : clamp >= 40 ? "#f97316" : "#ef4444"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <svg viewBox="0 0 200 105" style={{ width: "100%", maxWidth: 220, display: "block" }}>
        {/* Background arc */}
        <path
          d={arcPath(180, 360, r)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Ticks at 0, 25, 50, 75, 100% */}
        {[0, 25, 50, 75, 100].map(pct => {
          const a = 180 + (pct / 100) * 180
          const outer = polarToXY(a, r + 6)
          const inner = polarToXY(a, r - 6)
          return (
            <line
              key={pct}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="var(--bg-primary)"
              strokeWidth={1.5}
            />
          )
        })}
        {/* Filled arc */}
        {clamp > 0 && (
          <path
            d={arcPath(180, fillAngle, r)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill={color} />
        {/* Labels */}
        <text x={14} y={cy + 16} fontSize="9" fill="var(--text-muted)" textAnchor="middle">0%</text>
        <text x={186} y={cy + 16} fontSize="9" fill="var(--text-muted)" textAnchor="middle">100%</text>
      </svg>

      {/* Big percentage */}
      <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1, marginTop: "-0.5rem" }} className="num">
        {clamp.toFixed(1)}%
      </div>

      {/* W/BE/L counts */}
      <div style={{ display: "flex", gap: "0.875rem", marginTop: "0.625rem", fontSize: "0.8125rem" }}>
        <span style={{ color: "var(--green)", fontWeight: 600 }} className="num">{wins}W</span>
        <span style={{ color: "var(--text-secondary)" }} className="num">{breakevens}BE</span>
        <span style={{ color: "var(--red)", fontWeight: 600 }} className="num">{losses}L</span>
      </div>
    </div>
  )
}
