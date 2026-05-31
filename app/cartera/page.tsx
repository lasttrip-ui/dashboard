"use client"

import { useRef, useState } from "react"
import { Upload, RefreshCw, X, TrendingUp, TrendingDown, Briefcase } from "lucide-react"
import { parseDeGiroCSV, buildPositions, type Position } from "@/lib/degiro"
import { usePortfolio } from "@/lib/imported-portfolio"
import { useImportedTrades } from "@/lib/imported-trades"
import IBFlexImport from "@/components/lab/IBFlexImport"
import type { OptionTrade } from "@/lib/data"

// Net premium collected per IB trade (in USD, per-contract × 100 shares)
function netPremium(t: OptionTrade): number {
  if (t.status === "closed" && t.closePrice !== undefined) {
    return (t.premium - t.closePrice) * t.qty * 100
  }
  return t.premium * t.qty * 100
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtSign(n: number, dec = 2) {
  return `${n >= 0 ? "+" : ""}${fmt(n, dec)}`
}

interface UnifiedRow {
  ticker: string
  isin: string
  // DeGiro
  shares: number
  avgCost: number      // EUR per share
  totalInvested: number
  degiroRealizedPnl: number
  // IB premiums (USD converted loosely — we show as-is, same currency note)
  ibPremiumsUSD: number
  ibTradeCount: number
  // Effective cost
  effectiveCostPerShare: number  // (totalInvested - ibPremiums converted) / shares
}

function buildUnified(positions: Position[], ibTrades: OptionTrade[]): UnifiedRow[] {
  // Group IB premiums by ticker
  const ibByTicker = new Map<string, { premium: number; count: number }>()
  for (const t of ibTrades) {
    const key = t.ticker.toUpperCase()
    const existing = ibByTicker.get(key) ?? { premium: 0, count: 0 }
    ibByTicker.set(key, { premium: existing.premium + netPremium(t), count: existing.count + 1 })
  }

  const rows: UnifiedRow[] = []

  // DeGiro positions
  for (const pos of positions) {
    const ticker = pos.ticker.toUpperCase().split(" ")[0]
    const ib = ibByTicker.get(ticker) ?? { premium: 0, count: 0 }
    // Rough USD→EUR at 1.08 (user can see it's approximate)
    const ibEur = ib.premium / 1.08
    const effectiveCost = pos.shares > 0 ? (pos.totalInvested - ibEur) / pos.shares : pos.avgCost

    rows.push({
      ticker,
      isin: pos.isin,
      shares: pos.shares,
      avgCost: pos.avgCost,
      totalInvested: pos.totalInvested,
      degiroRealizedPnl: pos.realizedPnl,
      ibPremiumsUSD: ib.premium,
      ibTradeCount: ib.count,
      effectiveCostPerShare: effectiveCost,
    })
  }

  // IB-only tickers (no DeGiro position)
  ibByTicker.forEach((ib, ticker) => {
    if (rows.find(r => r.ticker === ticker)) return
    rows.push({ ticker, isin: "", shares: 0, avgCost: 0, totalInvested: 0, degiroRealizedPnl: 0, ibPremiumsUSD: ib.premium, ibTradeCount: ib.count, effectiveCostPerShare: 0 })
  })

  return rows.sort((a, b) => b.totalInvested - a.totalInvested)
}

export default function CarteraPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState("")
  const [filter, setFilter] = useState<"todas" | "abiertas" | "cerradas">("abiertas")

  const { positions, meta: dMeta, save, clear: clearDegiro } = usePortfolio()
  const { importedTrades, meta: ibMeta, saveResult, clear: clearIB } = useImportedTrades()

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError("")
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const rows = parseDeGiroCSV(text)
        const pos = buildPositions(rows)
        save(rows, pos, file.name)
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Error al parsear el CSV")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const unified = buildUnified(positions, importedTrades)
  const open = unified.filter(r => r.shares > 0.001)
  const closed = unified.filter(r => r.shares <= 0.001 && (r.degiroRealizedPnl !== 0 || r.ibPremiumsUSD !== 0))
  const ibOnly = unified.filter(r => r.shares <= 0.001 && r.ibPremiumsUSD !== 0 && r.degiroRealizedPnl === 0)
  const visible = filter === "abiertas" ? open : filter === "cerradas" ? closed : unified.filter(r => r.shares > 0.001 || r.degiroRealizedPnl !== 0 || r.ibPremiumsUSD !== 0)

  const totalInvested = open.reduce((s, r) => s + r.totalInvested, 0)
  const totalIBPremiums = unified.reduce((s, r) => s + r.ibPremiumsUSD, 0)
  const totalRealized = unified.reduce((s, r) => s + r.degiroRealizedPnl, 0)
  const totalEffectiveSaving = totalIBPremiums / 1.08

  const hasAnyData = dMeta || ibMeta

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
            Portfolio unificado
          </span>
          <h1 style={{ fontSize: 30, margin: "6px 0 0" }}>Mi Cartera</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Posiciones DeGiro + primas capturadas en Interactive Brokers
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* DeGiro import */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {dMeta && (
              <button type="button" onClick={clearDegiro} title="Eliminar DeGiro" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}>
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: dMeta ? "var(--amber-dim)" : "var(--bg-card)",
                color: dMeta ? "var(--amber)" : "var(--text-secondary)",
                cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
              }}
            >
              {dMeta ? <RefreshCw size={13} /> : <Upload size={13} />}
              {dMeta ? "DeGiro ✓" : "CSV DeGiro"}
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          </div>

          {/* IB import */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {ibMeta && (
              <button type="button" onClick={clearIB} title="Eliminar IB" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}>
                <X size={14} />
              </button>
            )}
            <IBFlexImport meta={ibMeta} onImport={saveResult} onClear={clearIB} />
          </div>
        </div>
      </header>

      {csvError && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--red)", fontSize: 13 }}>
          {csvError}
        </div>
      )}

      {!hasAnyData ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 16, padding: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <Briefcase size={36} style={{ color: "var(--text-secondary)" }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>Conecta tus cuentas</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400 }}>
            Importa el CSV de DeGiro para ver tus posiciones de acciones, y conecta Interactive Brokers para ver las primas capturadas con opciones sobre esas mismas acciones.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-sans)" }}>
              <Upload size={15} /> Importar CSV DeGiro
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Capital invertido", value: `${fmt(totalInvested)} €`, sub: `${open.length} posiciones abiertas` },
              { label: "Primas IB capturadas", value: `${fmtSign(totalIBPremiums)} $`, sub: `≈ ${fmt(totalEffectiveSaving)} € de ahorro en coste`, color: "var(--green)" },
              { label: "P&L realizado (acciones)", value: `${fmtSign(totalRealized)} €`, sub: `${closed.length} posiciones cerradas`, color: totalRealized >= 0 ? "var(--green)" : "var(--red)" },
              { label: "Tickers con opciones IB", value: String(new Set(importedTrades.map(t => t.ticker)).size), sub: `${importedTrades.length} trades en total` },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color ?? "var(--text-primary)" }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, alignSelf: "flex-start" }}>
            {([["abiertas", open.length], ["cerradas", closed.length], ["todas", visible.length]] as const).map(([f, count]) => (
              <button key={f} type="button" onClick={() => setFilter(f as typeof filter)} style={{
                padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: filter === f ? 600 : 500,
                background: filter === f ? "var(--amber)" : "transparent",
                color: filter === f ? "#0b1120" : "var(--text-secondary)",
                textTransform: "capitalize",
              }}>
                {f} ({count})
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
                    {["Ticker", "Acciones", "Coste medio €", "Invertido €", "Primas IB $", "Coste efectivo €/acc", "P&L realizado €"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => {
                    const saving = row.avgCost - row.effectiveCostPerShare
                    const hasSaving = Math.abs(saving) > 0.01
                    return (
                      <tr key={row.ticker + row.isin} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{row.ticker}</div>
                          {row.isin && <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>{row.isin}</div>}
                          {row.ibTradeCount > 0 && (
                            <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 2 }}>{row.ibTradeCount} opciones IB</div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14 }}>
                          {row.shares > 0 ? fmt(row.shares, row.shares % 1 === 0 ? 0 : 2) : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14 }}>
                          {row.avgCost > 0 ? `${fmt(row.avgCost)} €` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14 }}>
                          {row.totalInvested > 0 ? `${fmt(row.totalInvested)} €` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: row.ibPremiumsUSD > 0 ? "var(--green)" : "var(--text-secondary)" }}>
                          {row.ibPremiumsUSD !== 0 ? `${fmtSign(row.ibPremiumsUSD)} $` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {row.effectiveCostPerShare > 0 ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: hasSaving ? "var(--green)" : "var(--text-primary)" }}>
                                {fmt(row.effectiveCostPerShare)} €
                              </div>
                              {hasSaving && (
                                <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>
                                  -{fmt(saving)} € vs coste medio
                                </div>
                              )}
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: row.degiroRealizedPnl > 0 ? "var(--green)" : row.degiroRealizedPnl < 0 ? "var(--red)" : "var(--text-secondary)" }}>
                          {row.degiroRealizedPnl !== 0 ? `${fmtSign(row.degiroRealizedPnl)} €` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No hay posiciones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {ibMeta && (
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
              * Coste efectivo = (capital invertido - primas IB capturadas convertidas a EUR aprox. ÷ 1.08) / acciones. Las primas en $ se muestran sin conversión exacta.
            </p>
          )}
        </>
      )}
    </div>
  )
}
