"use client"

import { useState, useEffect, useMemo } from "react"
import { loadMergedExecutions } from "@/lib/executions"
import type { Trade as IBKRTrade } from "@/components/portfolio/types"

// Mirror of IBKR's "Órdenes y transacciones → Operaciones": every execution
// synced from the Flex Query, so the dashboard can be reconciled 1:1 with
// the broker app.

function fmt(n: number, d = 2): string {
  return Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function loadExecutions(): Promise<IBKRTrade[]> {
  return loadMergedExecutions().then(d => d.slice().reverse())
}

export default function ExecutionsTable() {
  const [execs, setExecs] = useState<IBKRTrade[]>([])
  const [year, setYear] = useState<number | "todo">(new Date().getFullYear())
  const [ticker, setTicker] = useState<string>("")

  useEffect(() => { loadExecutions().then(setExecs) }, [])

  const years = useMemo(() => {
    const ys = new Set(execs.map(e => parseInt(e.tradeTime.slice(0, 4), 10)))
    return Array.from(ys).sort((a, b) => b - a)
  }, [execs])

  const tickers = useMemo(() => {
    const filtered = year === "todo" ? execs : execs.filter(e => e.tradeTime.startsWith(String(year)))
    return Array.from(new Set(filtered.map(e => e.symbol))).sort()
  }, [execs, year])

  const visible = useMemo(() => {
    let list = execs
    if (year !== "todo") list = list.filter(e => e.tradeTime.startsWith(String(year)))
    if (ticker) list = list.filter(e => e.symbol === ticker)
    return list
  }, [execs, year, ticker])

  const totalPnl = useMemo(() => visible.reduce((s, e) => s + (e.realizedPnl || 0), 0), [visible])
  const lastSync = execs.length > 0 ? execs[0].tradeTime.slice(0, 10) : null

  const selStyle: React.CSSProperties = {
    background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "0.3rem 0.6rem", color: "var(--text-primary)", fontSize: "0.8125rem", outline: "none",
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-primary)" }}>
          EJECUCIONES IBKR
        </span>
        <select value={year} onChange={e => { setYear(e.target.value === "todo" ? "todo" : parseInt(e.target.value, 10)); setTicker("") }} style={selStyle}>
          <option value="todo">Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={ticker} onChange={e => setTicker(e.target.value)} style={selStyle}>
          <option value="">Todos los tickers</option>
          {tickers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }} className="num">
          {visible.length} ejecuciones · P&L realizado{" "}
          <span style={{ color: totalPnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
            {totalPnl >= 0 ? "+" : "-"}€{fmt(totalPnl)}
          </span>
        </span>
      </div>

      {lastSync && (
        <div style={{ padding: "0.5rem 1rem", fontSize: "0.6875rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
          Última ejecución sincronizada: {lastSync} · Si en IBKR ves operaciones más recientes, falta sincronizar (ver Importar operaciones)
        </div>
      )}

      <div style={{ overflowX: "auto", maxHeight: 560, overflowY: "auto" }}>
        <table className="tt-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ticker</th>
              <th>Tipo</th>
              <th>Lado</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Precio</th>
              <th style={{ textAlign: "right" }}>Com.</th>
              <th style={{ textAlign: "right" }}>P&L realizado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(e => {
              const expired = e.price === 0 && e.realizedPnl !== 0
              const sideLabel = expired ? "Expirada" : e.side === "SELL" ? "Venta" : "Compra"
              const sideColor = expired ? "var(--amber)" : e.side === "SELL" ? "var(--red)" : "var(--green)"
              return (
                <tr key={e.tradeId}>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{e.tradeTime.slice(0, 10)}</td>
                  <td style={{ fontWeight: 600 }}>{e.symbol}</td>
                  <td>
                    <span style={{
                      background: e.secType === "OPT" ? "var(--purple-dim, rgba(139,92,246,0.15))" : "var(--accent-dim)",
                      color: e.secType === "OPT" ? "var(--purple, #a78bfa)" : "var(--accent)",
                      borderRadius: 4, padding: "1px 6px", fontSize: "0.6875rem", fontWeight: 600,
                    }}>
                      {e.secType}
                    </span>
                  </td>
                  <td style={{ color: sideColor, fontSize: "0.75rem", fontWeight: 600 }}>{sideLabel}</td>
                  <td className="num" style={{ textAlign: "right" }}>{e.size}</td>
                  <td className="num" style={{ textAlign: "right" }}>${fmt(e.price)}</td>
                  <td className="num" style={{ textAlign: "right", color: "var(--text-muted)" }}>{e.commission ? `$${fmt(e.commission)}` : "—"}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600, color: e.realizedPnl > 0 ? "var(--green)" : e.realizedPnl < 0 ? "var(--red)" : "var(--text-muted)" }}>
                    {e.realizedPnl !== 0 ? `${e.realizedPnl > 0 ? "+" : "-"}€${fmt(e.realizedPnl)}` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            Sin ejecuciones para este filtro
          </div>
        )}
      </div>
    </div>
  )
}
