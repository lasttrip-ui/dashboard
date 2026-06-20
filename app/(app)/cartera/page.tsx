"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap,
  AreaChart, Area,
} from "recharts"
import { Info } from "lucide-react"
import { useAllTrades } from "@/hooks/use-all-trades"
import { realizedPnl, TODAY, parseDate, dateToString } from "@/lib/utils"
import {
  DIVIDEND_DATA_2026,
  TOTAL_DIVIDENDS_2026,
  buildMonthlyDividends,
  buildCumulativeDividends,
  buildDividendTotals,
  buildActiveCompanies,
  buildCompanyDetail,
  colorForCompany,
} from "@/lib/dividends"
import { loadImportedDividends, loadImportedStockTxns } from "@/lib/trade-store"
import type { ImportedDividend } from "@/lib/import-parser"
import { buildDeGiroPositions } from "@/lib/degiro-positions"
import type { DividendEntry } from "@/lib/dividends"
import type { IBKRSnapshot, Position, Balance } from "@/components/portfolio/types"
import { useLiveQuotes } from "@/hooks/use-live-quotes"
import { dteRemaining } from "@/lib/utils"
import type { OptionTrade } from "@/lib/data"

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

type Tab = "cartera" | "posiciones" | "mapa" | "dividendos"

// ── Positions sub-tab ────────────────────────────────────────────────────────

type PositionFilter = "todas" | "largas" | "cortas" | "efectivo"
type PosSortKey = "value" | "pnl" | "pctPnl"

function strategyForPosition(p: Position): string {
  if (p.assetClass === "STK") return p.position > 0 ? "Long" : "Short"
  const dir = p.position > 0 ? "Long" : "Short"
  const type = p.optionType === "P" ? "Put" : "Call"
  return `${dir} ${type}`
}

// Multi-currency aggregation: a portfolio can hold positions in USD, EUR, GBP
// and HKD at once, so summing raw market values is meaningless. Convert each to
// the account base currency (EUR) first. IBKR's snapshot carries an
// exchangeRate per currency (native → base); DeGiro positions reuse those
// rates, with fallbacks for any currency the snapshot doesn't include.
const FALLBACK_RATES: Record<string, number> = { EUR: 1, USD: 0.92, GBP: 1.17, HKD: 0.118 }

function buildRateFor(balances: Balance[]): (ccy: string) => number {
  const map = new Map<string, number>()
  for (const b of balances) {
    if (b.currency !== "BASE" && b.exchangeRate > 0) map.set(b.currency, b.exchangeRate)
  }
  return (ccy: string) => map.get(ccy) ?? FALLBACK_RATES[ccy] ?? 1
}

function currencySymbol(ccy: string): string {
  return ccy === "EUR" ? "€" : ccy === "GBP" ? "£" : ccy === "HKD" ? "HK$" : "$"
}

function PositionesTab({ positions, balances, baseCurrency }: { positions: Position[]; balances: Balance[]; baseCurrency: string }) {
  const [filter, setFilter] = useState<PositionFilter>("todas")
  const [sortKey, setSortKey] = useState<PosSortKey>("value")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const { live, lastUpdate } = useLiveQuotes(positions)
  const rateFor = useMemo(() => buildRateFor(balances), [balances])

  function fmt(n: number, d = 2) {
    return Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
  }

  function toggleSort(key: PosSortKey) {
    if (key === sortKey) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  // Value of a position in the account base currency (for totals and weights).
  function baseValue(p: Position): number {
    const v = live.get(p.contractId)?.marketValue ?? p.marketValue
    return Math.abs(v) * rateFor(p.currency)
  }

  const portfolioTotal = useMemo(
    () => positions.reduce((s, p) => s + baseValue(p), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions, live, rateFor]
  )

  const filtered = useMemo(() => {
    let result = [...positions]
    if (filter === "largas") result = result.filter(p => p.position > 0)
    else if (filter === "cortas") result = result.filter(p => p.position < 0)

    result.sort((a, b) => {
      const va = live.get(a.contractId)?.marketValue ?? a.marketValue
      const vb = live.get(b.contractId)?.marketValue ?? b.marketValue
      const pa = live.get(a.contractId)?.unrealizedPnl ?? a.unrealizedPnl
      const pb = live.get(b.contractId)?.unrealizedPnl ?? b.unrealizedPnl
      const costA = va - pa, costB = vb - pb
      const pctA = costA !== 0 ? (pa / Math.abs(costA)) * 100 : 0
      const pctB = costB !== 0 ? (pb / Math.abs(costB)) * 100 : 0
      let diff = 0
      if (sortKey === "value") diff = Math.abs(va) - Math.abs(vb)
      else if (sortKey === "pnl") diff = pa - pb
      else diff = pctA - pctB
      return sortDir === "desc" ? -diff : diff
    })
    return result
  }, [positions, filter, sortKey, sortDir, live])

  const stats = {
    count: filtered.length,
    value: filtered.reduce((s, p) => s + baseValue(p), 0),
  }

  const tabs: { key: PositionFilter; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "largas", label: "Largas" },
    { key: "cortas", label: "Cortas" },
    { key: "efectivo", label: "Efectivo" },
  ]

  const sortArrow = (key: PosSortKey) => sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : ""

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "2px", background: "var(--bg-primary)", borderRadius: "8px", padding: "2px" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding: "0.3rem 0.875rem", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === t.key ? "var(--bg-card)" : "transparent",
              color: filter === t.key ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: "0.8125rem", fontWeight: filter === t.key ? 600 : 400,
              boxShadow: filter === t.key ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>
        {lastUpdate && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
            Cotizaciones en vivo · {new Date(lastUpdate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {filter !== "efectivo" && (
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <span>POSICIONES <span className="num" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{stats.count}</span></span>
          <span>VALOR DE MERCADO TOTAL <span className="num" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{currencySymbol(baseCurrency)}{fmt(stats.value)}</span></span>
        </div>
      )}

      {filter === "efectivo" ? (
        <div style={{ overflowX: "auto" }}>
          <table className="tt-table">
            <thead>
              <tr>
                <th>Moneda</th>
                <th>Efectivo</th>
                <th>Valor Neto Liquidación</th>
              </tr>
            </thead>
            <tbody>
              {balances.filter(b => b.currency !== "BASE").map(b => (
                <tr key={b.currency}>
                  <td style={{ fontWeight: 600 }}>{b.currency}</td>
                  <td className="num">{fmt(b.cashBalance)}</td>
                  <td className="num">{fmt(b.netLiquidationValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tt-table">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Tipo</th>
                <th>Estrategia</th>
                <th style={{ textAlign: "right" }}>Cant.</th>
                <th style={{ textAlign: "right" }}>Coste Medio</th>
                <th style={{ textAlign: "right" }}>Precio Mdo.</th>
                <th style={{ textAlign: "right" }}>DTE</th>
                <th className="sortable" style={{ textAlign: "right" }} onClick={() => toggleSort("value")}>Valor de Mercado{sortArrow("value")}</th>
                <th className="sortable" style={{ textAlign: "right" }} onClick={() => toggleSort("pnl")}>P&L No Realizado{sortArrow("pnl")}</th>
                <th className="sortable" style={{ textAlign: "right" }} onClick={() => toggleSort("pctPnl")}>% No Realiz.{sortArrow("pctPnl")}</th>
                <th style={{ textAlign: "right" }}>% Cartera</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const ccy = p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : p.currency === "HKD" ? "HK$" : "$"
                const lq = live.get(p.contractId)
                const price = lq?.price ?? p.marketPrice
                const value = lq?.marketValue ?? p.marketValue
                const upnl = lq?.unrealizedPnl ?? p.unrealizedPnl
                const cost = value - upnl
                const pctPnl = cost !== 0 ? (upnl / Math.abs(cost)) * 100 : 0
                const pctCartera = portfolioTotal > 0 ? (baseValue(p) / portfolioTotal) * 100 : 0
                const dte = p.assetClass === "OPT" && p.expiration ? dteRemaining(p.expiration) : null
                return (
                  <tr key={p.contractId}>
                    <td style={{ fontWeight: 600 }}>{p.symbol}</td>
                    <td>
                      <span style={{
                        padding: "0.125rem 0.5rem", borderRadius: 5, fontSize: "0.75rem", fontWeight: 600,
                        background: p.assetClass === "OPT" ? (p.optionType === "P" ? "var(--purple-dim)" : "var(--accent-dim)") : "var(--bg-hover)",
                        color: p.assetClass === "OPT" ? (p.optionType === "P" ? "var(--purple)" : "var(--accent)") : "var(--text-secondary)",
                      }}>
                        {p.assetClass === "OPT" ? (p.optionType === "P" ? "Put" : "Call") : "STK"}
                      </span>
                    </td>
                    <td style={{ color: p.position > 0 ? "var(--green)" : "var(--red)", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {strategyForPosition(p)}
                    </td>
                    <td className="num" style={{ textAlign: "right", color: p.position > 0 ? "var(--green)" : "var(--red)" }}>
                      {p.position > 0 ? "+" : ""}{p.position}
                    </td>
                    <td className="num" style={{ textAlign: "right" }}>{ccy}{fmt(p.averagePrice)}</td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {ccy}{fmt(price)}
                      {lq && <span style={{ color: "var(--green)", fontSize: "0.5625rem", marginLeft: 3, verticalAlign: "super" }}>●</span>}
                    </td>
                    <td className="num" style={{ textAlign: "right", color: "var(--text-muted)" }}>{dte !== null ? `${dte}d` : "—"}</td>
                    <td className="num" style={{ textAlign: "right" }}>{ccy}{fmt(Math.abs(value))}</td>
                    <td className="num" style={{ textAlign: "right", color: upnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 500 }}>
                      {upnl >= 0 ? "+" : "-"}{ccy}{fmt(Math.abs(upnl))}
                    </td>
                    <td className="num" style={{ textAlign: "right", color: pctPnl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {pctPnl >= 0 ? "+" : ""}{pctPnl.toFixed(1)}%
                    </td>
                    <td className="num" style={{ textAlign: "right", color: "var(--text-secondary)" }}>{pctCartera.toFixed(1)}%</td>
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

// ── Heatmap sub-tab ──────────────────────────────────────────────────────────

function colorForPct(pct: number): string {
  const capped = Math.max(-20, Math.min(20, pct))
  const t = Math.abs(capped) / 20
  return pct >= 0 ? `rgba(34,197,94,${0.25 + t * 0.55})` : `rgba(239,68,68,${0.25 + t * 0.55})`
}

function HeatmapCell(props: any) {
  const { x, y, width, height, name, pct } = props
  if (width < 2 || height < 2) return null
  const showText = width > 42 && height > 30
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: colorForPct(pct), stroke: "var(--bg-card)", strokeWidth: 2 }} />
      {showText && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={700}>{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 11} textAnchor="middle" fill="#fff" fontSize={11}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </text>
        </>
      )}
    </g>
  )
}

function HeatmapTab({ positions, balances }: { positions: Position[]; balances: Balance[] }) {
  const rateFor = useMemo(() => buildRateFor(balances), [balances])
  const data = useMemo(() => {
    return positions
      .filter(p => p.marketValue !== 0)
      .map(p => {
        const cost = p.marketValue - p.unrealizedPnl
        const pct = cost !== 0 ? (p.unrealizedPnl / Math.abs(cost)) * 100 : 0
        // Cell size compares positions against each other, so normalise to the
        // base currency — otherwise a HK$ holding dwarfs a same-value $ holding.
        return { name: p.symbol, size: Math.abs(p.marketValue) * rateFor(p.currency), pct }
      })
  }, [positions, rateFor])

  const winners = data.filter(d => d.pct > 0).length
  const losers = data.filter(d => d.pct < 0).length

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Sin posiciones para mostrar.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card" style={{ padding: "0.875rem 1rem" }}>
        <div style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 2 }}>Mapa de calor</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Tamaño de celda = porcentaje del valor de mercado de la cartera. Color = P&L no realizado frente al coste.
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          POSICIONES <span className="num" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{data.length}</span>
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          GANADORAS <span className="num" style={{ color: "var(--green)", fontWeight: 700 }}>{winners}</span>
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          PERDEDORAS <span className="num" style={{ color: "var(--red)", fontWeight: 700 }}>{losers}</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
          {[-20, -10, -3, 3, 10, 20].map(v => (
            <div key={v} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: 22, height: 10, borderRadius: 2, background: colorForPct(v) }} />
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>{v > 0 ? `+${v}` : v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: "0.75rem" }}>
        <ResponsiveContainer width="100%" height={420}>
          <Treemap data={data} dataKey="size" stroke="var(--bg-card)" content={<HeatmapCell />} isAnimationActive={false} />
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Dividends sub-tab ────────────────────────────────────────────────────────

const CURRENT_YEAR = 2026
const YEAR_RANGE = [2021, 2022, 2023, 2024, 2025, 2026]

// All dividend figures are normalised to EUR for display. Amounts span several
// years so a single point-in-time FX rate is necessarily approximate; this
// constant keeps the conversion consistent across the whole tab.
const USD_TO_EUR = 0.92

function dividendAmountEur(amount: number, currency?: string): number {
  return currency === "EUR" ? amount : amount * USD_TO_EUR
}

function importedDivsToEntries(divs: ImportedDividend[], year: number): DividendEntry[] {
  return divs
    .filter(d => d.date.startsWith(String(year)))
    .map(d => ({
      month: parseInt(d.date.slice(5, 7), 10),
      company: d.company,
      amount: d.amount,
      date: d.date,
      currency: d.currency,
    }))
}

function DividendosTab() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [importedDivs, setImportedDivs] = useState<ImportedDividend[]>([])
  const [chartMode, setChartMode] = useState<"mensual" | "acumulado">("mensual")

  useEffect(() => {
    setImportedDivs(loadImportedDividends())
    const onStorage = () => setImportedDivs(loadImportedDividends())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const yearData = useMemo<DividendEntry[]>(() => {
    const imported = importedDivsToEntries(importedDivs, year)
    const raw = year === CURRENT_YEAR ? [...DIVIDEND_DATA_2026, ...imported] : imported
    // Convert every entry to EUR up front so all downstream aggregates
    // (chart, KPIs, company table) are already in the same currency.
    return raw.map(e => ({ ...e, amount: dividendAmountEur(e.amount, e.currency) }))
  }, [year, importedDivs])

  const monthlyData = useMemo(() => buildMonthlyDividends(yearData), [yearData])
  const cumulativeData = useMemo(() => buildCumulativeDividends(yearData), [yearData])
  const chartData = chartMode === "mensual" ? monthlyData : cumulativeData
  const totals = useMemo(() => buildDividendTotals(yearData), [yearData])
  const companyDetail = useMemo(() => buildCompanyDetail(yearData, year), [yearData, year])
  const activeCos = useMemo(() => buildActiveCompanies(yearData), [yearData])
  const totalYear = yearData.reduce((s, d) => s + d.amount, 0)
  const monthsWithData = new Set(yearData.map(d => d.month)).size
  const topPayer = totals[0]?.company ?? "—"
  const hasData = yearData.length > 0

  // Years that have imported data
  const yearsWithImported = useMemo(() => {
    const set = new Set<number>()
    for (const d of importedDivs) {
      const y = parseInt(d.date.slice(0, 4), 10)
      if (!isNaN(y)) set.add(y)
    }
    return set
  }, [importedDivs])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Year navigator */}
      <div className="card" style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setYear(y => Math.max(YEAR_RANGE[0], y - 1))}
            disabled={year === YEAR_RANGE[0]}
            style={{ background: "none", border: "none", cursor: year === YEAR_RANGE[0] ? "default" : "pointer", color: year === YEAR_RANGE[0] ? "var(--text-muted)" : "var(--text-primary)", fontSize: "1rem", padding: "0 0.25rem" }}
          >◀</button>
          {YEAR_RANGE.map(y => {
            const active = y === year
            const hasAny = y === CURRENT_YEAR || yearsWithImported.has(y)
            return (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: "0.3rem 0.75rem", borderRadius: 6, border: "none", cursor: "pointer",
                background: active ? "var(--accent)" : "var(--bg-hover)",
                color: active ? "#fff" : hasAny ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "0.8125rem", fontWeight: active ? 700 : 400,
                opacity: hasAny ? 1 : 0.55,
              }}>
                {y}
                {hasAny && !active && <span style={{ marginLeft: 3, color: "var(--green)", fontSize: "0.5rem" }}>●</span>}
              </button>
            )
          })}
          <button
            onClick={() => setYear(y => Math.min(YEAR_RANGE[YEAR_RANGE.length - 1], y + 1))}
            disabled={year === YEAR_RANGE[YEAR_RANGE.length - 1]}
            style={{ background: "none", border: "none", cursor: year === YEAR_RANGE[YEAR_RANGE.length - 1] ? "default" : "pointer", color: year === YEAR_RANGE[YEAR_RANGE.length - 1] ? "var(--text-muted)" : "var(--text-primary)", fontSize: "1rem", padding: "0 0.25rem" }}
          >▶</button>
        </div>
      </div>

      {/* No data state */}
      {!hasData && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📂</div>
          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
            Sin datos para {year}
          </div>
          <div style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
            Importa tu extracto de actividad de IBKR del año {year} desde la sección{" "}
            <a href="/importar" style={{ color: "var(--accent)", textDecoration: "underline" }}>Importar</a>{" "}
            para ver tus dividendos históricos.
          </div>
        </div>
      )}

      {hasData && <>
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {[
            { label: `Ingresos ${year}`, value: `€${totalYear.toFixed(2)}`, sub: undefined },
            { label: "Promedio Mensual", value: `€${monthsWithData > 0 ? (totalYear / monthsWithData).toFixed(2) : "0.00"}`, sub: `${monthsWithData} meses con dividendos` },
            { label: "Promedio Diario", value: `€${(totalYear / 365).toFixed(2)}`, sub: undefined },
            { label: "Empresas", value: `${activeCos.length}`, sub: topPayer !== "—" ? `${topPayer} es tu mayor pagador` : undefined },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: "0.875rem 1rem" }}>
              <div style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
                {c.label}
              </div>
              <div className="num" style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)" }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 2 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Stacked bar chart */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Ingresos {chartMode === "mensual" ? "mensuales" : "acumulados"} {year}
            </div>
            <div style={{ display: "flex", gap: "2px", background: "var(--bg-primary)", borderRadius: "8px", padding: "2px" }}>
              {(["mensual", "acumulado"] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)} style={{
                  padding: "0.3rem 0.75rem", borderRadius: 6, border: "none", cursor: "pointer",
                  background: chartMode === m ? "var(--accent)" : "transparent",
                  color: chartMode === m ? "#fff" : "var(--text-secondary)",
                  fontSize: "0.75rem", fontWeight: chartMode === m ? 600 : 400,
                }}>
                  {m === "mensual" ? "Mensual" : "Acumulado"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
              <XAxis dataKey="month" tickFormatter={i => MONTHS_SHORT[i - 1]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={v => `€${v.toFixed(0)}`} width={48} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.75rem" }}
                formatter={(v: number, name: string) => [`€${v.toFixed(2)}`, name]}
                labelFormatter={m => MONTHS_SHORT[Number(m) - 1]}
              />
              {activeCos.map((co, idx) => (
                <Bar key={co} dataKey={co} stackId="a" fill={colorForCompany(co)} radius={idx === activeCos.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem" }}>
            {activeCos.map(co => (
              <div key={co} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: colorForCompany(co) }} />
                {co}
              </div>
            ))}
          </div>
        </div>

        {/* Analysis by company */}
        <div className="card">
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
            Análisis por Empresa · {year}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tt-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Total {year}</th>
                  <th>Pagos</th>
                  <th>Prom./Pago</th>
                  <th>Meses activos</th>
                  <th>% del Total</th>
                  <th style={{ minWidth: 160 }}>Distribución</th>
                  <th>Último pago</th>
                </tr>
              </thead>
              <tbody>
                {companyDetail.map(({ company, amount, count, avgPerPayment, monthsActive, lastPayment }) => {
                  const pct = totalYear > 0 ? (amount / totalYear) * 100 : 0
                  const color = colorForCompany(company)
                  return (
                    <tr key={company}>
                      <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        {company}
                      </td>
                      <td className="num">€{amount.toFixed(2)}</td>
                      <td className="num" style={{ color: "var(--text-secondary)" }}>{count}</td>
                      <td className="num" style={{ color: "var(--text-secondary)" }}>€{avgPerPayment.toFixed(2)}</td>
                      <td className="num" style={{ color: "var(--text-secondary)" }}>{monthsActive}/12</td>
                      <td className="num" style={{ color: "var(--text-secondary)" }}>{pct.toFixed(1)}%</td>
                      <td>
                        <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{lastPayment}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </div>
  )
}

// ── Seguimiento de Cartera ────────────────────────────────────────────────────

type EvolPeriod = "1m" | "3m" | "6m" | "ytd" | "1y" | "all"

const EVOL_PERIOD_LABELS: Record<EvolPeriod, string> = {
  "1m": "1M", "3m": "3M", "6m": "6M", ytd: "YTD", "1y": "1Y", all: "ALL",
}

function startDateForEvolPeriod(period: EvolPeriod): string | null {
  if (period === "all") return null
  const d = parseDate(TODAY)
  if (period === "ytd") {
    d.setMonth(0, 1)
  } else {
    const monthsBack = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12
    d.setMonth(d.getMonth() - monthsBack)
  }
  return dateToString(d)
}

interface EquityPoint { date: string; cumulative: number }

function buildEquitySeries(trades: OptionTrade[], dividends: { month: number; amount: number; date?: string }[]): EquityPoint[] {
  const byDate = new Map<string, number>()
  for (const t of trades) {
    if (t.status !== "closed") continue
    const pnl = realizedPnl(t)
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + pnl)
  }
  for (const d of dividends) {
    const date = d.date ?? `2026-${String(d.month).padStart(2, "0")}-01`
    byDate.set(date, (byDate.get(date) ?? 0) + d.amount)
  }
  const sortedDates = Array.from(byDate.keys()).sort()
  let cumulative = 0
  return sortedDates.map(date => {
    cumulative += byDate.get(date) ?? 0
    return { date, cumulative }
  })
}

function SeguimientoTab({ snapshot }: { snapshot: IBKRSnapshot | null }) {
  const [evolPeriod, setEvolPeriod] = useState<EvolPeriod>("ytd")
  const trades = useAllTrades()
  const [importedDivs, setImportedDivs] = useState<ImportedDividend[]>([])

  useEffect(() => {
    setImportedDivs(loadImportedDividends())
    const onStorage = () => setImportedDivs(loadImportedDividends())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const allDividends = useMemo(() => {
    const divs2026 = DIVIDEND_DATA_2026.map(d => ({ month: d.month, amount: d.amount }))
    const imported = importedDivs.map(d => ({ month: parseInt((d.date ?? "0000-01-01").slice(5, 7), 10), amount: d.amount, date: d.date }))
    return [...divs2026, ...imported]
  }, [importedDivs])

  const fullSeries = useMemo(() => buildEquitySeries(trades, allDividends), [trades, allDividends])

  const { chartData, baseline, periodChange, allTimeTotal } = useMemo(() => {
    if (fullSeries.length === 0) return { chartData: [] as EquityPoint[], baseline: 0, periodChange: 0, allTimeTotal: 0 }
    const startDate = startDateForEvolPeriod(evolPeriod)
    const before = startDate ? fullSeries.filter(p => p.date < startDate) : []
    const base = before.length > 0 ? before[before.length - 1].cumulative : 0
    const slice = startDate ? fullSeries.filter(p => p.date >= startDate) : fullSeries
    const total = fullSeries[fullSeries.length - 1].cumulative
    const last = slice.length > 0 ? slice[slice.length - 1].cumulative : base
    return { chartData: slice, baseline: base, periodChange: last - base, allTimeTotal: total }
  }, [fullSeries, evolPeriod])

  if (!snapshot) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
      Cargando datos de IBKR…
    </div>
  )

  const s = snapshot.summary
  const base = snapshot.balances.find(b => b.currency === "BASE")
  const upnl = base?.unrealizedPnl ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Valor Liquidación Neta", value: `€${s.netLiquidation.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "var(--text-primary)" },
          { label: "Exposición Bruta", value: `€${s.grossPositionValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "var(--text-primary)" },
          { label: "P&L No Realizado", value: `${upnl >= 0 ? "+" : ""}€${Math.abs(upnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: upnl >= 0 ? "var(--green)" : "var(--red)" },
          { label: "Efectivo Total", value: `€${s.totalCashValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "var(--text-primary)" },
          { label: "Margen Inicial", value: `€${s.initialMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "var(--text-primary)" },
          { label: "Apalancamiento", value: `${s.leverage}x`, color: parseFloat(s.leverage) > 2.5 ? "var(--red)" : "var(--orange)" },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: "0.875rem 1rem" }}>
            <div style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.375rem" }}>{c.label}</div>
            <div className="num" style={{ fontSize: "1.25rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Evolution chart */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Evolución de P&L acumulado
          </div>
          <div style={{ display: "flex", gap: "2px", background: "var(--bg-primary)", borderRadius: "8px", padding: "2px" }}>
            {(Object.keys(EVOL_PERIOD_LABELS) as EvolPeriod[]).map(p => (
              <button key={p} onClick={() => setEvolPeriod(p)} style={{
                padding: "0.3rem 0.75rem", borderRadius: 6, border: "none", cursor: "pointer",
                background: evolPeriod === p ? "var(--accent)" : "transparent",
                color: evolPeriod === p ? "#fff" : "var(--text-secondary)",
                fontSize: "0.75rem", fontWeight: evolPeriod === p ? 600 : 400,
              }}>
                {EVOL_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.875rem" }}>
          <div>
            <div style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>P&L acumulado al inicio</div>
            <div className="num" style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)" }}>{baseline >= 0 ? "+" : ""}${baseline.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Variación del periodo</div>
            <div className="num" style={{ fontSize: "1.0625rem", fontWeight: 700, color: periodChange >= 0 ? "var(--green)" : "var(--red)" }}>{periodChange >= 0 ? "+" : ""}${periodChange.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.5625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>P&L acumulado total</div>
            <div className="num" style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)" }}>{allTimeTotal >= 0 ? "+" : ""}${allTimeTotal.toFixed(2)}</div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            Sin operaciones cerradas o dividendos en este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={56} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.75rem" }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Acumulado"]}
              />
              <Area type="monotone" dataKey="cumulative" stroke="var(--accent)" strokeWidth={2} fill="url(#equityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Data limitation callout */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.875rem", padding: "0.75rem", background: "var(--bg-primary)", borderRadius: 8 }}>
          <Info size={14} color="var(--text-muted)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Esta curva aproxima la evolución de tu cartera a partir del P&L realizado de tus opciones (atribuido a su fecha de apertura, no de cierre) y tus dividendos. No incluye aportaciones ni retiradas de capital, por lo que no es un cálculo estricto de TWR — limitación de los datos disponibles del Flex Query de IBKR.
          </div>
        </div>
      </div>

      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
        Datos actualizados: {new Date(snapshot.lastUpdated).toLocaleString("es-ES")}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CarteraPage() {
  const [tab, setTab] = useState<Tab>("dividendos")
  const [snapshot, setSnapshot] = useState<IBKRSnapshot | null>(null)
  const [degiroPositions, setDegiroPositions] = useState<Position[]>([])

  useEffect(() => {
    fetch("/api/ibkr", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSnapshot(d))
      .catch(() => null)
  }, [])

  useEffect(() => {
    function refresh() { setDegiroPositions(buildDeGiroPositions(loadImportedStockTxns())) }
    refresh()
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  const allPositions = useMemo(() => [...(snapshot?.positions ?? []), ...degiroPositions], [snapshot, degiroPositions])

  const TABS: { key: Tab; label: string }[] = [
    { key: "cartera",    label: "Seguimiento de Cartera" },
    { key: "posiciones", label: "Posiciones" },
    { key: "mapa",       label: "Mapa de calor" },
    { key: "dividendos", label: "Dividendos" },
  ]

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Cartera</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
          Sigue tu rentabilidad y tus posiciones. Se alimenta de tus operaciones sincronizadas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "0.5rem 1rem",
            border: "none",
            borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
            background: "transparent",
            color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: tab === t.key ? 600 : 400,
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "cartera"    && <SeguimientoTab snapshot={snapshot} />}
      {tab === "posiciones" && <PositionesTab positions={allPositions} balances={snapshot?.balances ?? []} baseCurrency={snapshot?.summary.currency ?? "EUR"} />}
      {tab === "mapa"       && <HeatmapTab positions={allPositions} balances={snapshot?.balances ?? []} />}
      {tab === "dividendos" && <DividendosTab />}
    </div>
  )
}
