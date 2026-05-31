"use client"

import { useState } from "react"
import { NotebookPen, Pencil } from "lucide-react"
import { trades, OptionTrade } from "@/lib/data"
import {
  tradePnl,
  tradeOutcome,
  fmtDollar,
  parseDate,
  MONTH_NAMES_ES,
  TradeOutcome,
} from "@/lib/utils"
import { useTradeNotes } from "@/lib/notes"

const OUTCOME_META: Record<TradeOutcome, { label: string; bg: string; fg: string }> = {
  W: { label: "Ganada", bg: "var(--green-dim)", fg: "var(--green)" },
  BE: { label: "Break-even", bg: "var(--amber-dim)", fg: "var(--amber)" },
  L: { label: "Perdida", bg: "var(--red-dim)", fg: "var(--red)" },
}

export default function BitacoraPage() {
  const feed = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 16)

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 760 }}>
      <header>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          <span className="lab-live-dot" /> En vivo
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Cuaderno de Bitácora</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Registro cronológico de cada operación. Añade tus notas: se guardan en este navegador.
        </p>
      </header>

      <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {feed.map((t) => (
          <BitacoraEntry key={t.id} trade={t} />
        ))}
      </ol>
    </div>
  )
}

function BitacoraEntry({ trade: t }: { trade: OptionTrade }) {
  const { get, set } = useTradeNotes()
  const note = get(t.id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)

  const pnl = tradePnl(t)
  const outcome = tradeOutcome(t)
  const meta = OUTCOME_META[outcome]
  const d = parseDate(t.date)
  const positive = pnl >= 0

  function startEdit() {
    setDraft(get(t.id))
    setEditing(true)
  }
  function save() {
    set(t.id, draft)
    setEditing(false)
  }

  return (
    <li style={{ display: "flex", gap: 14, padding: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <div style={{ textAlign: "center", flexShrink: 0, width: 46 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
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
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: meta.bg, color: meta.fg }}>
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

        {/* Nota */}
        {editing ? (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={3}
              placeholder="¿Por qué entraste? ¿Qué aprendiste?"
              style={{
                width: "100%",
                resize: "vertical",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                padding: "9px 11px",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={save} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-sans)" }}>
                Guardar
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: "6px 14px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-sans)" }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : note ? (
          <div
            onClick={startEdit}
            style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: 8, cursor: "pointer", display: "flex", gap: 8 }}
          >
            <NotebookPen size={14} strokeWidth={1.75} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{note}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)" }}
          >
            <Pencil size={12} strokeWidth={1.75} /> Añadir nota
          </button>
        )}
      </div>

      <div className="num" style={{ flexShrink: 0, textAlign: "right", fontWeight: 700, fontSize: 15, color: positive ? "var(--green)" : "var(--red)" }}>
        {positive ? "+" : ""}
        {fmtDollar(pnl)}
      </div>
    </li>
  )
}
