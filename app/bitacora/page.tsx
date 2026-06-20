"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronUp, Pencil, NotebookPen } from "lucide-react"
import { useAllTrades } from "@/hooks/use-all-trades"
import { loadImportedStockTxns, loadImportedDividends } from "@/lib/trade-store"
import { buildDeGiroPositions, ISIN_TICKER } from "@/lib/degiro-positions"
import { usdToEur } from "@/lib/currency"
import { useTradeNotes } from "@/lib/notes"
import type { OptionTrade } from "@/lib/data"
import type { ImportedDividend } from "@/lib/import-parser"
import type { IBKRSnapshot, Position } from "@/components/portfolio/types"

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// Best-effort USD/GBP → EUR conversion, consistent with the approximation
// already used across Cartera (no live FX feed wired up).
function toEur(amount: number, currency: string): number {
  if (currency === "GBP") return amount * 1.17
  if (currency === "EUR") return amount
  return usdToEur(amount)
}

function tickerKey(s: string): string {
  return s.toUpperCase().split(/\s+/)[0]
}

function netPremium(t: OptionTrade): number {
  if (t.status === "closed" && t.closePrice !== undefined) {
    return (t.premium - t.closePrice) * t.qty * 100
  }
  // Open trade: use currentPrice as mark-to-market (negative if trade is losing)
  return (t.premium - t.currentPrice) * t.qty * 100
}

interface TickerGroup {
  ticker: string
  shares: number
  avgCostEur: number
  totalInvestedEur: number
  trades: OptionTrade[]
  totalPremiumsUSD: number
  dividendsEur: number
  effectiveCostPerShare: number
  totalSavingEur: number
}

function buildGroups(positions: Position[], trades: OptionTrade[], dividends: ImportedDividend[]): TickerGroup[] {
  const groups = new Map<string, TickerGroup>()

  function ensure(ticker: string): TickerGroup {
    let g = groups.get(ticker)
    if (!g) {
      g = { ticker, shares: 0, avgCostEur: 0, totalInvestedEur: 0, trades: [], totalPremiumsUSD: 0, dividendsEur: 0, effectiveCostPerShare: 0, totalSavingEur: 0 }
      groups.set(ticker, g)
    }
    return g
  }

  for (const p of positions) {
    if (p.assetClass !== "STK" || p.position <= 0) continue
    const g = ensure(p.symbol.toUpperCase())
    g.shares += p.position
    g.totalInvestedEur += toEur(p.averagePrice * p.position, p.currency)
  }

  for (const t of trades) {
    const g = ensure(t.ticker.toUpperCase())
    g.trades.push(t)
    g.totalPremiumsUSD += netPremium(t)
  }

  for (const d of dividends) {
    const ticker = (d.isin && ISIN_TICKER[d.isin]) || tickerKey(d.company)
    const g = ensure(ticker)
    g.dividendsEur += toEur(d.amount, d.currency)
  }

  groups.forEach(g => {
    g.avgCostEur = g.shares > 0 ? g.totalInvestedEur / g.shares : 0
    const premiumsEur = toEur(g.totalPremiumsUSD, "USD")
    g.totalSavingEur = premiumsEur + g.dividendsEur
    if (g.shares > 0 && g.totalInvestedEur > 0) {
      g.effectiveCostPerShare = (g.totalInvestedEur - g.totalSavingEur) / g.shares
    }
    g.trades.sort((a, b) => b.date.localeCompare(a.date))
  })

  return Array.from(groups.values())
    .filter(g => g.shares > 0 || g.trades.length > 0 || g.dividendsEur !== 0)
    .sort((a, b) => b.totalInvestedEur - a.totalInvestedEur)
}

function NoteEditor({ id }: { id: string }) {
  const { get, set } = useTradeNotes()
  const note = get(id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)

  function save() { set(id, draft); setEditing(false) }

  if (editing) return (
    <div style={{ marginTop: 10 }}>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        autoFocus
        rows={3}
        placeholder="Notas sobre esta posición…"
        style={{ width: "100%", resize: "vertical", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 13, padding: "9px 11px", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" onClick={save} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-sans)" }}>Guardar</button>
        <button type="button" onClick={() => setEditing(false)} style={{ padding: "6px 14px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-sans)" }}>Cancelar</button>
      </div>
    </div>
  )

  if (note) return (
    <div onClick={() => { setDraft(note); setEditing(true) }} style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", display: "flex", gap: 8 }}>
      <NotebookPen size={14} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{note}</p>
    </div>
  )

  return (
    <button type="button" onClick={() => { setDraft(""); setEditing(true) }} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px dashed var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)" }}>
      <Pencil size={12} /> Añadir nota
    </button>
  )
}

function TickerCard({ g }: { g: TickerGroup }) {
  const [expanded, setExpanded] = useState(false)
  const hasSaving = g.totalSavingEur > 0.01 && g.shares > 0
  const saving = g.avgCostEur - g.effectiveCostPerShare
  const savingPct = g.avgCostEur > 0 ? (saving / g.avgCostEur) * 100 : 0

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {/* Summary row */}
      <div
        onClick={() => g.trades.length > 0 && setExpanded(e => !e)}
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "18px 20px", cursor: g.trades.length > 0 ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Ticker */}
          <div style={{ minWidth: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "var(--font-serif)" }}>{g.ticker}</div>
            {g.shares > 0 && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmt(g.shares, 0)} acciones</div>}
          </div>

          {/* Cost breakdown */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {g.avgCostEur > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Coste medio</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{fmt(g.avgCostEur)} €</div>
              </div>
            )}
            {g.totalPremiumsUSD !== 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>P&L opciones neto</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: g.totalPremiumsUSD >= 0 ? "var(--green)" : "var(--red)" }}>{g.totalPremiumsUSD >= 0 ? "+" : ""}{fmt(toEur(g.totalPremiumsUSD, "USD"))} €</div>
              </div>
            )}
            {g.dividendsEur !== 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Dividendos cobrados</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--green)" }}>+{fmt(g.dividendsEur)} €</div>
              </div>
            )}
            {hasSaving && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Coste efectivo</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--green)" }}>{fmt(g.effectiveCostPerShare)} €/acc</div>
                <div style={{ fontSize: 11, color: "var(--green)" }}>-{fmt(saving)} € ({fmt(savingPct, 1)}% menos)</div>
              </div>
            )}
            {g.totalInvestedEur > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>Capital invertido</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{fmt(g.totalInvestedEur)} €</div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <NoteEditor id={`ticker-${g.ticker}`} />
          </div>
        </div>

        {g.trades.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-start", color: "var(--text-secondary)", paddingTop: 4 }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </div>

      {/* Trades detail */}
      {expanded && g.trades.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-primary)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Fecha", "Tipo", "Qty", "Prima", "Cierre", "Prima neta", "Estado"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.trades.map(t => {
                const net = netPremium(t)
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>{t.date}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: t.type === "Put" ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)", color: t.type === "Put" ? "var(--amber)" : "var(--green)", fontSize: 12, fontWeight: 600 }}>
                        SELL {t.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>{t.qty}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>${fmt(t.premium)}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>
                      {t.status === "closed" && t.closePrice !== undefined ? `$${fmt(t.closePrice)}` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, color: net >= 0 ? "var(--green)" : "var(--red)" }}>
                      {net >= 0 ? "+" : ""}{fmt(toEur(net, "USD"))} €
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: t.status === "open" ? "rgba(251,191,36,0.12)" : "var(--bg-hover)", color: t.status === "open" ? "var(--amber)" : "var(--text-secondary)" }}>
                        {t.status === "open" ? "Abierta" : "Cerrada"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function BitacoraPage() {
  const trades = useAllTrades()
  const [snapshot, setSnapshot] = useState<IBKRSnapshot | null>(null)
  const [degiroPositions, setDegiroPositions] = useState<Position[]>([])
  const [dividends, setDividends] = useState<ImportedDividend[]>([])

  useEffect(() => {
    fetch("/api/ibkr", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSnapshot(d))
      .catch(() => null)
  }, [])

  useEffect(() => {
    function refresh() {
      setDegiroPositions(buildDeGiroPositions(loadImportedStockTxns()))
      setDividends(loadImportedDividends())
    }
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const positions = useMemo(() => [...(snapshot?.positions ?? []), ...degiroPositions], [snapshot, degiroPositions])
  const hasStockData = positions.some(p => p.assetClass === "STK")
  const groups = useMemo(() => buildGroups(positions, trades, dividends), [positions, trades, dividends])

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          Coste efectivo por posición
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Bitácora</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Precio medio de compra reducido por las primas capturadas vendiendo calls y puts, y por los dividendos cobrados, sobre cada acción.
          {!hasStockData && <span style={{ marginLeft: 8, color: "var(--amber)" }}>· Importa tus posiciones de acciones en Cartera → Importar para calcular el coste efectivo</span>}
        </p>
      </header>

      {groups.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
          Importa tus datos desde Cartera → Importar para ver el cálculo de coste efectivo.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map(g => <TickerCard key={g.ticker} g={g} />)}
        </div>
      )}
    </div>
  )
}
