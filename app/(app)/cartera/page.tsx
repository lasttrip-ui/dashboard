"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap,
} from "recharts"
import {
  DIVIDEND_DATA_2026,
  TOTAL_DIVIDENDS_2026,
  buildMonthlyDividends,
  buildDividendTotals,
  buildActiveCompanies,
  colorForCompany,
} from "@/lib/dividends"
import { loadImportedDividends } from "@/lib/trade-store"
import type { ImportedDividend } from "@/lib/import-parser"
import type { DividendEntry } from "@/lib/dividends"
import type { IBKRSnapshot, Position } from "@/components/portfolio/types"
import { useLiveQuotes } from "@/hooks/use-live-quotes"

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

type Tab = "cartera" | "posiciones" | "mapa" | "dividendos"

// ── Positions sub-tab ────────────────────────────────────────────────────────

function PositionesTab({ positions }: { positions: Position[] }) {
  const stocks = positions.filter(p => p.assetClass === "STK")
  const options = positions.filter(p => p.assetClass === "OPT")
  const [view, setView] = useState<"STK" | "OPT">("STK")
  const { live, lastUpdate } = useLiveQuotes(positions)

  function fmt(n: number, d = 2) {
    return Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
  }

  const list = view === "STK" ? stocks : options

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {(["STK", "OPT"] as const).map(t => (
          <button key={t} onClick={() => setView(t)} style={{
            padding: "0.3rem 0.875rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: view === t ? "var(--accent)" : "var(--bg-hover)",
            color: view === t ? "#fff" : "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: view === t ? 600 : 400,
          }}>
            {t === "STK" ? `Acciones (${stocks.length})` : `Opciones (${options.length})`}
          </button>
        ))}
        {lastUpdate && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
            Cotizaciones en vivo · {new Date(lastUpdate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="tt-table">
          <thead>
            <tr>
              <th>Símbolo</th>
              <th>Pos</th>
              <th>Precio Medio</th>
              <th>Último</th>
              <th>CCY</th>
              <th>Valor</th>
              <th>P&L No Real.</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => {
              const ccy = p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : p.currency === "HKD" ? "HK$" : "$"
              const lq = live.get(p.contractId)
              const price = lq?.price ?? p.marketPrice
              const value = lq?.marketValue ?? p.marketValue
              const upnl = lq?.unrealizedPnl ?? p.unrealizedPnl
              return (
                <tr key={p.contractId}>
                  <td style={{ fontWeight: 600 }}>{p.symbol}</td>
                  <td className="num" style={{ color: p.position > 0 ? "var(--green)" : "var(--red)" }}>
                    {p.position > 0 ? "+" : ""}{p.position}
                  </td>
                  <td className="num">{ccy}{fmt(p.averagePrice)}</td>
                  <td className="num" style={lq ? { color: "var(--text-primary)", fontWeight: 600 } : undefined}>
                    {ccy}{fmt(price)}
                    {lq && <span style={{ color: "var(--green)", fontSize: "0.5625rem", marginLeft: 3, verticalAlign: "super" }}>●</span>}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{p.currency}</td>
                  <td className="num">{ccy}{fmt(Math.abs(value))}</td>
                  <td className="num" style={{ color: upnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 500 }}>
                    {upnl >= 0 ? "+" : "-"}{ccy}{fmt(Math.abs(upnl))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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

function HeatmapTab({ positions }: { positions: Position[] }) {
  const data = useMemo(() => {
    return positions
      .filter(p => p.marketValue !== 0)
      .map(p => {
        const cost = p.marketValue - p.unrealizedPnl
        const pct = cost !== 0 ? (p.unrealizedPnl / Math.abs(cost)) * 100 : 0
        return { name: p.symbol, size: Math.abs(p.marketValue), pct }
      })
  }, [positions])

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

function importedDivsToEntries(divs: ImportedDividend[], year: number): DividendEntry[] {
  return divs
    .filter(d => d.date.startsWith(String(year)))
    .map(d => ({
      month: parseInt(d.date.slice(5, 7), 10),
      company: d.company,
      amount: d.amount,
    }))
}

function DividendosTab() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [importedDivs, setImportedDivs] = useState<ImportedDividend[]>([])

  useEffect(() => {
    setImportedDivs(loadImportedDividends())
    const onStorage = () => setImportedDivs(loadImportedDividends())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const yearData = useMemo<DividendEntry[]>(() => {
    if (year === CURRENT_YEAR) return DIVIDEND_DATA_2026
    return importedDivsToEntries(importedDivs, year)
  }, [year, importedDivs])

  const monthlyData = useMemo(() => buildMonthlyDividends(yearData), [yearData])
  const totals = useMemo(() => buildDividendTotals(yearData), [yearData])
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
            { label: `Ingresos ${year}`, value: `$${totalYear.toFixed(2)}`, sub: undefined },
            { label: "Promedio Mensual", value: `$${monthsWithData > 0 ? (totalYear / monthsWithData).toFixed(2) : "0.00"}`, sub: `${monthsWithData} meses con dividendos` },
            { label: "Promedio Diario", value: `$${(totalYear / 365).toFixed(2)}`, sub: undefined },
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
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
            Ingresos mensuales {year}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ left: 0, right: 8, top: 4, bottom: 8 }}>
              <XAxis dataKey="month" tickFormatter={i => MONTHS_SHORT[i - 1]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.75rem" }}
                formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
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
                  <th>% del Total</th>
                  <th style={{ minWidth: 160 }}>Distribución</th>
                </tr>
              </thead>
              <tbody>
                {totals.map(({ company, amount }) => {
                  const pct = totalYear > 0 ? (amount / totalYear) * 100 : 0
                  const color = colorForCompany(company)
                  return (
                    <tr key={company}>
                      <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        {company}
                      </td>
                      <td className="num">${amount.toFixed(2)}</td>
                      <td className="num" style={{ color: "var(--text-secondary)" }}>{pct.toFixed(1)}%</td>
                      <td>
                        <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                        </div>
                      </td>
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

function SeguimientoTab({ snapshot }: { snapshot: IBKRSnapshot | null }) {
  if (!snapshot) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
      Cargando datos de IBKR…
    </div>
  )

  const s = snapshot.summary
  const base = snapshot.balances.find(b => b.currency === "BASE")
  const usd = snapshot.balances.find(b => b.currency === "USD")
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

  useEffect(() => {
    fetch("/api/ibkr", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSnapshot(d))
      .catch(() => null)
  }, [])

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
      {tab === "posiciones" && <PositionesTab positions={snapshot?.positions ?? []} />}
      {tab === "mapa"       && <HeatmapTab positions={snapshot?.positions ?? []} />}
      {tab === "dividendos" && <DividendosTab />}
    </div>
  )
}
