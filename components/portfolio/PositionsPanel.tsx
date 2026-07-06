"use client"

import { useState, useMemo } from "react"
import { toEur } from "@/lib/currency"
import type { Position } from "./types"

interface Props {
  positions: Position[]
}

type Tab = "STK" | "OPT"
type SortKey = "symbol" | "pnl" | "value" | "pnlPct"

function fmt(n: number, d = 2): string {
  return Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })
}

function pnlColor(n: number): string {
  return n > 0 ? "var(--green)" : n < 0 ? "var(--red)" : "var(--text-secondary)"
}

function pnlSign(n: number): string {
  return n >= 0 ? "+" : "-"
}

function currencySymbol(ccy: string): string {
  if (ccy === "EUR") return "€"
  if (ccy === "GBP") return "£"
  if (ccy === "HKD") return "HK$"
  return "$"
}

function PnlBadge({ value, currency }: { value: number; currency: string }) {
  const ccy = currencySymbol(currency)
  const color = pnlColor(value)
  return (
    <span className="num" style={{ color, fontWeight: 500 }}>
      {pnlSign(value)}{ccy}{fmt(Math.abs(value))}
    </span>
  )
}

function StocksTable({ positions, sortKey, sortDir, onSort }: {
  positions: Position[]
  sortKey: SortKey
  sortDir: 1 | -1
  onSort: (k: SortKey) => void
}) {
  function th(label: string, key: SortKey) {
    const active = sortKey === key
    return (
      <th className="sortable" onClick={() => onSort(key)}>
        {label} {active ? (sortDir === 1 ? "↑" : "↓") : ""}
      </th>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tt-table">
        <thead>
          <tr>
            {th("Symbol", "symbol")}
            <th>Side</th>
            <th>Qty</th>
            <th>Avg Price</th>
            <th>Last</th>
            <th>CCY</th>
            {th("Market Value", "value")}
            {th("Unreal P&L", "pnl")}
            {th("% P&L", "pnlPct")}
          </tr>
        </thead>
        <tbody>
          {positions.map(p => {
            const side = p.position > 0 ? "Long" : "Short"
            const pnlPct = p.averagePrice !== 0 ? ((p.marketPrice - p.averagePrice) / p.averagePrice) * 100 * Math.sign(p.position) : 0
            const ccy = currencySymbol(p.currency)
            return (
              <tr key={p.contractId}>
                <td style={{ fontWeight: 600 }}>{p.symbol}</td>
                <td style={{ color: side === "Long" ? "var(--green)" : "var(--red)", fontSize: "0.75rem" }}>{side}</td>
                <td className="num">{Math.abs(p.position).toLocaleString("es-ES", { maximumFractionDigits: 4 })}</td>
                <td className="num">{ccy}{fmt(p.averagePrice)}</td>
                <td className="num">{ccy}{fmt(p.marketPrice)}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{p.currency}</td>
                <td className="num">{ccy}{fmt(Math.abs(p.marketValue))}</td>
                <td><PnlBadge value={p.unrealizedPnl} currency={p.currency} /></td>
                <td className="num" style={{ color: pnlColor(pnlPct) }}>
                  {pnlSign(pnlPct)}{fmt(Math.abs(pnlPct), 1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OptionsTable({ positions, sortKey, sortDir, onSort }: {
  positions: Position[]
  sortKey: SortKey
  sortDir: 1 | -1
  onSort: (k: SortKey) => void
}) {
  function th(label: string, key: SortKey) {
    const active = sortKey === key
    return (
      <th className="sortable" onClick={() => onSort(key)}>
        {label} {active ? (sortDir === 1 ? "↑" : "↓") : ""}
      </th>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tt-table">
        <thead>
          <tr>
            {th("Symbol", "symbol")}
            <th>Type</th>
            <th>Strike</th>
            <th>Expiry</th>
            <th>Pos</th>
            <th>Avg</th>
            <th>Last</th>
            <th>CCY</th>
            {th("Mkt Value", "value")}
            {th("Unreal P&L", "pnl")}
          </tr>
        </thead>
        <tbody>
          {positions.map(p => {
            const isShort = p.position < 0
            const typeColor = p.optionType === "C" ? "var(--accent)" : "var(--orange)"
            const expStr = p.expiration ? p.expiration.slice(2, 10).replace(/-/g, "/") : ""
            const ccy = currencySymbol(p.currency)
            return (
              <tr key={p.contractId}>
                <td style={{ fontWeight: 600 }}>{p.symbol}</td>
                <td>
                  <span style={{
                    background: p.optionType === "C" ? "var(--accent-dim)" : "var(--purple-dim)",
                    color: typeColor,
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                  }}>
                    {p.optionType === "C" ? "CALL" : "PUT"}
                  </span>
                </td>
                <td className="num" style={{ color: "var(--text-secondary)" }}>{p.strike}</td>
                <td className="num" style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{expStr}</td>
                <td className="num" style={{ color: isShort ? "var(--red)" : "var(--green)", fontWeight: 500 }}>
                  {isShort ? "-" : "+"}{Math.abs(p.position)}
                </td>
                <td className="num">{ccy}{fmt(p.averagePrice)}</td>
                <td className="num">{ccy}{fmt(p.marketPrice)}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{p.currency}</td>
                <td className="num">{ccy}{fmt(Math.abs(p.marketValue))}</td>
                <td><PnlBadge value={p.unrealizedPnl} currency={p.currency} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PositionsPanel({ positions }: Props) {
  const [tab, setTab] = useState<Tab>("STK")
  const [sortKey, setSortKey] = useState<SortKey>("pnl")
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [filter, setFilter] = useState("")

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(-1) }
  }

  const stocks = useMemo(() => positions.filter(p => p.assetClass === "STK"), [positions])
  const options = useMemo(() => positions.filter(p => p.assetClass === "OPT"), [positions])

  const visible = useMemo(() => {
    const list = tab === "STK" ? stocks : options
    const q = filter.trim().toUpperCase()
    const filtered = q ? list.filter(p => p.symbol.includes(q) || p.description.toUpperCase().includes(q)) : list

    return filtered.slice().sort((a, b) => {
      let av = 0, bv = 0
      if (sortKey === "symbol") return sortDir * a.symbol.localeCompare(b.symbol)
      if (sortKey === "pnl") { av = a.unrealizedPnl; bv = b.unrealizedPnl }
      if (sortKey === "value") { av = Math.abs(a.marketValue); bv = Math.abs(b.marketValue) }
      if (sortKey === "pnlPct") {
        av = a.averagePrice !== 0 ? (a.unrealizedPnl / Math.abs(a.averagePrice * a.position)) * 100 : 0
        bv = b.averagePrice !== 0 ? (b.unrealizedPnl / Math.abs(b.averagePrice * b.position)) * 100 : 0
      }
      return sortDir * (av - bv)
    })
  }, [tab, stocks, options, filter, sortKey, sortDir])

  // Tab totals in EUR so multi-currency positions (USD, HKD…) are all counted
  const stkPnl = useMemo(() => stocks.reduce((s, p) => s + toEur(p.unrealizedPnl, p.currency), 0), [stocks])
  const optPnl = useMemo(() => options.reduce((s, p) => s + toEur(p.unrealizedPnl, p.currency), 0), [options])

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Positions
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 400 }}>
              {stocks.length} stocks · {options.length} options
            </span>
          </h2>
          <input
            type="text"
            placeholder="Filter ticker…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.3rem 0.6rem",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              outline: "none",
              width: 140,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["STK", "OPT"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.375rem 0.875rem",
                border: "none",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: tab === t ? 600 : 400,
                background: tab === t ? "var(--bg-primary)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {t === "STK" ? `Stocks (${stocks.length})` : `Options (${options.length})`}
              <span className="num" style={{
                marginLeft: "0.5rem",
                fontSize: "0.6875rem",
                color: (t === "STK" ? stkPnl : optPnl) >= 0 ? "var(--green)" : "var(--red)",
              }}>
                {(t === "STK" ? stkPnl : optPnl) >= 0 ? "+" : "-"}€{Math.abs(t === "STK" ? stkPnl : optPnl).toLocaleString("es-ES", { maximumFractionDigits: 0 })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 480, overflowY: "auto" }}>
        {tab === "STK" ? (
          <StocksTable positions={visible} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        ) : (
          <OptionsTable positions={visible} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        )}
        {visible.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            No positions found
          </div>
        )}
      </div>
    </div>
  )
}
