"use client"

import { trades } from "@/lib/data"
import {
  tradePnl,
  tradeOutcome,
  fmtDollar,
  parseDate,
  MONTH_NAMES_ES,
  TradeOutcome,
} from "@/lib/utils"

const OUTCOME_META: Record<TradeOutcome, { label: string; bg: string; fg: string }> = {
  W: { label: "Ganada", bg: "var(--green-dim)", fg: "var(--green)" },
  BE: { label: "Break-even", bg: "var(--amber-dim)", fg: "var(--amber)" },
  L: { label: "Perdida", bg: "var(--red-dim)", fg: "var(--red)" },
}

export default function BitacoraPage() {
  const feed = [...trades]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 16)

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 760 }}>
      <header>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          <span className="lab-live-dot" /> En vivo
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Cuaderno de Bitácora</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Registro cronológico de cada operación: apertura, cierre y resultado real.
        </p>
      </header>

      <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {feed.map((t) => {
          const pnl = tradePnl(t)
          const outcome = tradeOutcome(t)
          const meta = OUTCOME_META[outcome]
          const d = parseDate(t.date)
          const positive = pnl >= 0
          return (
            <li
              key={t.id}
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <div style={{ textAlign: "center", flexShrink: 0, width: 46 }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginTop: 2 }}>
                  {MONTH_NAMES_ES[d.getMonth()].slice(0, 3)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <strong style={{ fontFamily: "var(--font-sans)", fontSize: 15 }}>{t.ticker}</strong>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Venta {t.type} · {t.qty} {t.qty === 1 ? "contrato" : "contratos"} · prima {fmtDollar(t.premium)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: meta.bg,
                      color: meta.fg,
                    }}
                  >
                    {meta.label}
                  </span>
                  {t.status === "open" && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--accent-dim)", color: "var(--amber)" }}>
                      Abierta
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                  Vencimiento {t.expiration}. {t.status === "closed" ? "Posición cerrada." : "Posición en seguimiento."}
                </p>
              </div>
              <div className="num" style={{ flexShrink: 0, textAlign: "right", fontWeight: 700, fontSize: 15, color: positive ? "var(--green)" : "var(--red)" }}>
                {positive ? "+" : ""}
                {fmtDollar(pnl)}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
