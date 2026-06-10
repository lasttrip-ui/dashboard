"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts"
import {
  DIVIDEND_DATA_2026, DIVIDEND_COMPANIES, COMPANY_COLOR,
  getMonthlyDividends, getDividendTotals, TOTAL_DIVIDENDS_2026,
} from "@/lib/dividends"
import type { IBKRSnapshot, Position } from "@/components/portfolio/types"
import { useLiveQuotes } from "@/hooks/use-live-quotes"

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

type Tab = "cartera" | "posiciones" | "dividendos"

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

// ── Dividends sub-tab ────────────────────────────────────────────────────────

function DividendosTab() {
  const monthlyData = useMemo(() => getMonthlyDividends(), [])
  const totals = useMemo(() => getDividendTotals(), [])
  const totalYear = TOTAL_DIVIDENDS_2026
  const monthsWithData = DIVIDEND_DATA_2026.map(d => d.month).filter((v, i, a) => a.indexOf(v) === i).length
  const topPayer = totals[0]?.company ?? "—"

  // Active companies per month (those with at least 1 entry)
  const activeCos = useMemo(() => {
    const set = new Set(DIVIDEND_DATA_2026.map(d => d.company))
    return DIVIDEND_COMPANIES.filter(c => set.has(c))
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Ingresos Pasivos (Año)", value: `$${totalYear.toFixed(2)}`, sub: undefined },
          { label: "Promedio Mensual", value: `$${(totalYear / monthsWithData).toFixed(2)}`, sub: `${monthsWithData} meses con dividendos` },
          { label: "Promedio Diario", value: `$${(totalYear / 365).toFixed(2)}`, sub: undefined },
          { label: "Empresas", value: `${activeCos.length}`, sub: `${topPayer} es tu mayor pagador` },
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
          <div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ingresos</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>◀</span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>2026</span>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>▶</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Mensual</button>
            <button style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "none", borderRadius: 6, padding: "0.25rem 0.75rem", fontSize: "0.75rem", cursor: "pointer" }}>Acumulado</button>
          </div>
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
            {activeCos.map(co => (
              <Bar key={co} dataKey={co} stackId="a" fill={COMPANY_COLOR[co]} radius={co === activeCos[activeCos.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem" }}>
          {activeCos.map(co => (
            <div key={co} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COMPANY_COLOR[co] }} />
              {co}
            </div>
          ))}
        </div>
      </div>

      {/* Analysis by company */}
      <div className="card">
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
          Análisis por Empresa
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tt-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Total 2026</th>
                <th>% del Total</th>
                <th style={{ minWidth: 160 }}>Distribución</th>
              </tr>
            </thead>
            <tbody>
              {totals.map(({ company, amount }) => {
                const pct = (amount / totalYear) * 100
                return (
                  <tr key={company}>
                    <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COMPANY_COLOR[company] }} />
                      {company}
                    </td>
                    <td className="num">${amount.toFixed(2)}</td>
                    <td className="num" style={{ color: "var(--text-secondary)" }}>{pct.toFixed(1)}%</td>
                    <td>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: COMPANY_COLOR[company], borderRadius: 3 }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
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
      {tab === "dividendos" && <DividendosTab />}
    </div>
  )
}
