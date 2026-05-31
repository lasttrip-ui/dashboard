"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, RefreshCw, X, Briefcase, TrendingUp, TrendingDown, Loader, Pencil, Check } from "lucide-react"
import { parseDeGiroCSV, buildPositions } from "@/lib/degiro"
import { usePortfolio } from "@/lib/imported-portfolio"
import { useImportedTrades } from "@/lib/imported-trades"
import { useMarketPrices, fetchYahooPrice, toYahooTicker } from "@/lib/market-prices"
import IBFlexImport from "@/components/lab/IBFlexImport"
import type { OptionTrade } from "@/lib/data"

function netPremium(t: OptionTrade): number {
  if (t.status === "closed" && t.closePrice !== undefined) {
    return (t.premium - t.closePrice) * t.qty * 100
  }
  return (t.premium - t.currentPrice) * t.qty * 100
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function fmtSign(n: number, dec = 2) {
  return `${n >= 0 ? "+" : ""}${fmt(n, dec)}`
}

interface UnifiedRow {
  ticker: string
  yahoоTicker: string
  isin: string
  bolsa: string
  shares: number
  avgCost: number
  totalInvested: number
  degiroRealizedPnl: number
  ibPremiumsUSD: number
  ibTradeCount: number
  effectiveCostPerShare: number
}

function buildUnified(
  positions: ReturnType<typeof usePortfolio>["positions"],
  ibTrades: OptionTrade[]
): UnifiedRow[] {
  const ibByTicker = new Map<string, { premium: number; count: number }>()
  for (const t of ibTrades) {
    const key = t.ticker.toUpperCase()
    const ex = ibByTicker.get(key) ?? { premium: 0, count: 0 }
    ibByTicker.set(key, { premium: ex.premium + netPremium(t), count: ex.count + 1 })
  }

  const rows: UnifiedRow[] = []

  for (const pos of positions) {
    const ticker = pos.ticker.toUpperCase().split(" ")[0]
    const ib = ibByTicker.get(ticker) ?? { premium: 0, count: 0 }
    const ibEur = ib.premium / 1.08
    const effectiveCost = pos.shares > 0 ? (pos.totalInvested - ibEur) / pos.shares : pos.avgCost
    rows.push({
      ticker,
      yahoоTicker: toYahooTicker(ticker, pos.bolsa),
      isin: pos.isin,
      bolsa: pos.bolsa,
      shares: pos.shares,
      avgCost: pos.avgCost,
      totalInvested: pos.totalInvested,
      degiroRealizedPnl: pos.realizedPnl,
      ibPremiumsUSD: ib.premium,
      ibTradeCount: ib.count,
      effectiveCostPerShare: effectiveCost,
    })
  }

  ibByTicker.forEach((ib, ticker) => {
    if (rows.find(r => r.ticker === ticker)) return
    rows.push({ ticker, yahoоTicker: ticker, isin: "", bolsa: "", shares: 0, avgCost: 0, totalInvested: 0, degiroRealizedPnl: 0, ibPremiumsUSD: ib.premium, ibTradeCount: ib.count, effectiveCostPerShare: 0 })
  })

  return rows.sort((a, b) => b.totalInvested - a.totalInvested)
}

function PriceCell({ row, onSetPrice }: { row: UnifiedRow; onSetPrice: (t: string, p: number, c: string) => void }) {
  const { getPrice } = useMarketPrices()
  const cached = getPrice(row.ticker)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  function save() {
    const v = parseFloat(draft.replace(",", "."))
    if (!isNaN(v) && v > 0) onSetPrice(row.ticker, v, "EUR")
    setEditing(false)
  }

  if (editing) return (
    <td style={{ padding: "8px 12px" }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false) }}
          style={{ width: 80, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--amber)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 13 }}
        />
        <button type="button" onClick={save} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green)" }}><Check size={14} /></button>
        <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={14} /></button>
      </div>
    </td>
  )

  if (cached) return (
    <td style={{ padding: "8px 16px", textAlign: "right" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(cached.price)} {cached.currency}</span>
        <button type="button" onClick={() => { setDraft(String(cached.price)); setEditing(true) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 0 }}><Pencil size={11} /></button>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>{new Date(cached.updatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
    </td>
  )

  return (
    <td style={{ padding: "8px 16px", textAlign: "right" }}>
      <button type="button" onClick={() => { setDraft(""); setEditing(true) }} style={{ background: "none", border: "1px dashed var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)", fontSize: 11, padding: "3px 8px", fontFamily: "var(--font-sans)" }}>
        + precio
      </button>
    </td>
  )
}

export default function CarteraPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState("")
  const [filter, setFilter] = useState<"abiertas" | "cerradas" | "todas">("abiertas")
  const [fetchingPrices, setFetchingPrices] = useState(false)
  const [priceLog, setPriceLog] = useState<string[]>([])

  const { positions, meta: dMeta, save, clear: clearDegiro } = usePortfolio()
  const { importedTrades, meta: ibMeta, saveResult, clear: clearIB } = useImportedTrades()
  const { cache, setPrice, getPrice } = useMarketPrices()

  const unified = buildUnified(positions, importedTrades)
  const open = unified.filter(r => r.shares > 0.001)
  const closed = unified.filter(r => r.shares <= 0.001 && (r.degiroRealizedPnl !== 0 || r.ibPremiumsUSD !== 0))
  const visible = filter === "abiertas" ? open : filter === "cerradas" ? closed : unified.filter(r => r.shares > 0.001 || r.degiroRealizedPnl !== 0 || r.ibPremiumsUSD !== 0)

  const fetchAllPrices = useCallback(async () => {
    if (open.length === 0) return
    setFetchingPrices(true)
    setPriceLog([])
    const log: string[] = []
    for (const row of open) {
      const result = await fetchYahooPrice(row.yahoоTicker)
      if (result) {
        setPrice(row.ticker, result.price, result.currency)
        log.push(`✓ ${row.ticker}: ${result.price} ${result.currency}`)
      } else {
        // Try plain ticker as fallback
        const fallback = await fetchYahooPrice(row.ticker)
        if (fallback) {
          setPrice(row.ticker, fallback.price, fallback.currency)
          log.push(`✓ ${row.ticker}: ${fallback.price} ${fallback.currency}`)
        } else {
          log.push(`✗ ${row.ticker}: no encontrado`)
        }
      }
    }
    setPriceLog(log)
    setFetchingPrices(false)
  }, [open, setPrice])

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError("")
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseDeGiroCSV(ev.target?.result as string)
        const pos = buildPositions(rows)
        save(rows, pos, file.name)
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Error al parsear")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // Computed totals
  const totalInvested = open.reduce((s, r) => s + r.totalInvested, 0)
  const totalMarketValue = open.reduce((s, r) => {
    const p = getPrice(r.ticker)
    return s + (p ? r.shares * p.price : 0)
  }, 0)
  const totalUnrealized = open.reduce((s, r) => {
    const p = getPrice(r.ticker)
    if (!p || !r.totalInvested) return s
    return s + (r.shares * p.price - r.totalInvested)
  }, 0)
  const totalIBPremiums = unified.reduce((s, r) => s + r.ibPremiumsUSD, 0)
  const totalRealized = unified.reduce((s, r) => s + r.degiroRealizedPnl, 0)
  const pricesLoaded = open.filter(r => !!getPrice(r.ticker)).length
  const hasAnyData = !!(dMeta || ibMeta)

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>Portfolio unificado</span>
          <h1 style={{ fontSize: 30, margin: "6px 0 0" }}>Mi Cartera</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Posiciones DeGiro · primas IB · valor de mercado en tiempo real
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Market prices button */}
          {open.length > 0 && (
            <button type="button" onClick={fetchAllPrices} disabled={fetchingPrices} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-card)",
              color: pricesLoaded === open.length ? "var(--green)" : "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
            }}>
              {fetchingPrices ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
              {fetchingPrices ? "Actualizando…" : pricesLoaded > 0 ? `Precios (${pricesLoaded}/${open.length})` : "Obtener precios"}
            </button>
          )}
          {/* DeGiro */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {dMeta && <button type="button" onClick={clearDegiro} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}><X size={14} /></button>}
            <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: dMeta ? "var(--amber-dim)" : "var(--bg-card)", color: dMeta ? "var(--amber)" : "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)" }}>
              {dMeta ? <RefreshCw size={13} /> : <Upload size={13} />} {dMeta ? "DeGiro ✓" : "CSV DeGiro"}
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          </div>
          {/* IB */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {ibMeta && <button type="button" onClick={clearIB} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}><X size={14} /></button>}
            <IBFlexImport meta={ibMeta} onImport={saveResult} onClear={clearIB} />
          </div>
        </div>
      </header>

      {csvError && <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--red)", fontSize: 13 }}>{csvError}</div>}

      {/* Price log */}
      {priceLog.length > 0 && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {priceLog.map((l, i) => (
            <span key={i} style={{ color: l.startsWith("✓") ? "var(--green)" : "var(--red)" }}>{l}</span>
          ))}
        </div>
      )}

      {!hasAnyData ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 16, padding: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <Briefcase size={36} style={{ color: "var(--text-secondary)" }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>Conecta tus cuentas</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400 }}>
            Importa el CSV de DeGiro para tus acciones, y conecta IB para las primas capturadas con opciones.
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-sans)" }}>
            <Upload size={15} /> Importar CSV DeGiro
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            {[
              { label: "Capital invertido", value: `${fmt(totalInvested)} €`, sub: `${open.length} posiciones abiertas` },
              { label: "Valor de mercado", value: pricesLoaded > 0 ? `${fmt(totalMarketValue)} €` : "—", sub: pricesLoaded > 0 ? `${pricesLoaded} de ${open.length} precios` : "Pulsa «Obtener precios»", color: pricesLoaded > 0 ? "var(--text-primary)" : undefined },
              { label: "P&L no realizado", value: pricesLoaded > 0 ? `${fmtSign(totalUnrealized)} €` : "—", sub: pricesLoaded > 0 ? `${fmtSign((totalUnrealized / totalInvested) * 100, 1)}% sobre invertido` : "", color: pricesLoaded > 0 ? (totalUnrealized >= 0 ? "var(--green)" : "var(--red)") : undefined },
              { label: "Primas IB netas", value: `${fmtSign(totalIBPremiums)} $`, sub: `≈ ${fmt(totalIBPremiums / 1.08)} € reducción de coste`, color: totalIBPremiums >= 0 ? "var(--green)" : "var(--red)" },
              { label: "P&L realizado acc.", value: `${fmtSign(totalRealized)} €`, sub: `${closed.length} posiciones cerradas`, color: totalRealized >= 0 ? "var(--green)" : "var(--red)" },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color ?? "var(--text-primary)" }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, alignSelf: "flex-start" }}>
            {([["abiertas", open.length], ["cerradas", closed.length], ["todas", visible.length]] as const).map(([f, n]) => (
              <button key={f} type="button" onClick={() => setFilter(f as typeof filter)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: filter === f ? 600 : 500, background: filter === f ? "var(--amber)" : "transparent", color: filter === f ? "#0b1120" : "var(--text-secondary)", textTransform: "capitalize" }}>
                {f} ({n})
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
                    {["Ticker", "Acciones", "Coste medio", "Invertido", "Precio actual", "Valor mercado", "P&L no real.", "Primas IB", "Coste efectivo", "P&L realiz."].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => {
                    const p = getPrice(row.ticker)
                    const mktValue = p && row.shares > 0 ? row.shares * p.price : null
                    const unrealized = mktValue !== null && row.totalInvested > 0 ? mktValue - row.totalInvested : null
                    const unrealPct = unrealized !== null && row.totalInvested > 0 ? (unrealized / row.totalInvested) * 100 : null
                    const saving = row.avgCost - row.effectiveCostPerShare
                    const hasSaving = Math.abs(saving) > 0.01

                    return (
                      <tr key={row.ticker + row.isin} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{row.ticker}</div>
                          {row.bolsa && <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>{row.bolsa}</div>}
                          {row.ibTradeCount > 0 && <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 1 }}>{row.ibTradeCount} opciones</div>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14 }}>{row.shares > 0 ? fmt(row.shares, row.shares % 1 === 0 ? 0 : 2) : "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{row.avgCost > 0 ? `${fmt(row.avgCost)} €` : "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{row.totalInvested > 0 ? `${fmt(row.totalInvested)} €` : "—"}</td>

                        {/* Precio actual — editable */}
                        <PriceCell row={row} onSetPrice={setPrice} />

                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                          {mktValue !== null ? `${fmt(mktValue)} €` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {unrealized !== null ? (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: unrealized >= 0 ? "var(--green)" : "var(--red)" }}>{fmtSign(unrealized)} €</div>
                              <div style={{ fontSize: 11, color: unrealized >= 0 ? "var(--green)" : "var(--red)" }}>{fmtSign(unrealPct!,1)}%</div>
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, color: row.ibPremiumsUSD !== 0 ? (row.ibPremiumsUSD >= 0 ? "var(--green)" : "var(--red)") : "var(--text-secondary)", fontWeight: 600 }}>
                          {row.ibPremiumsUSD !== 0 ? `${fmtSign(row.ibPremiumsUSD)} $` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {row.effectiveCostPerShare > 0 ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: hasSaving ? "var(--green)" : "var(--text-primary)" }}>{fmt(row.effectiveCostPerShare)} €</div>
                              {hasSaving && <div style={{ fontSize: 10, color: "var(--green)" }}>-{fmt(saving)} €/acc</div>}
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: 13, color: row.degiroRealizedPnl > 0 ? "var(--green)" : row.degiroRealizedPnl < 0 ? "var(--red)" : "var(--text-secondary)" }}>
                          {row.degiroRealizedPnl !== 0 ? `${fmtSign(row.degiroRealizedPnl)} €` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>No hay posiciones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
            * Precios vía Yahoo Finance. Haz clic en «+ precio» para introducir manualmente. Coste efectivo = (invertido − primas IB ÷ 1.08) / acciones.
          </p>
        </>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
