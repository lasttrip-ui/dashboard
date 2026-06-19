"use client"

import { useState, useMemo } from "react"
import { OptionTrade } from "@/lib/data"
import { Pencil, Trash2 } from "lucide-react"
import {
  filterByMonth,
  dteRemaining,
  dteProgress,
  pctPrimaCap,
  unrealizedPnl,
  realizedPnl,
  fmtDollar,
  MONTH_NAMES_ES,
  inferStrategy,
  STRATEGY_COLORS,
} from "@/lib/utils"
import { markDeleted } from "@/lib/trade-store"

type StatusFilter = "todos" | "abiertos" | "cerrados"
type StrategyFilter = "todos" | "Put" | "Call"
type SortDir = "asc" | "desc"

interface TradesTableProps {
  trades: OptionTrade[]
  viewYear: number
  viewMonth: number
  onMonthChange: (year: number, month: number) => void
  onEdit?: (trade: OptionTrade) => void
}

const navBtnStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text-secondary)",
  fontSize: "0.875rem",
  cursor: "pointer",
  padding: "0.25rem 0.625rem",
  lineHeight: 1.5,
}

export default function TradesTable({ trades, viewYear, viewMonth, onMonthChange, onEdit }: TradesTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
  const [tickerFilter, setTickerFilter] = useState<string>("todos")
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>("todos")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [tickerOpen, setTickerOpen] = useState(false)
  const [strategyOpen, setStrategyOpen] = useState(false)

  const monthTrades = filterByMonth(trades, viewYear, viewMonth)

  // Get unique tickers for dropdown
  const uniqueTickers = useMemo(() => {
    const set = new Set(monthTrades.map(t => t.ticker))
    return Array.from(set).sort()
  }, [monthTrades])

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...monthTrades]

    if (statusFilter === "abiertos") result = result.filter(t => t.status === "open")
    else if (statusFilter === "cerrados") result = result.filter(t => t.status === "closed")

    if (tickerFilter !== "todos") result = result.filter(t => t.ticker === tickerFilter)
    if (strategyFilter !== "todos") result = result.filter(t => t.type === strategyFilter)

    // Sort by % prima capturada
    result.sort((a, b) => {
      const pa = pctPrimaCap(a)
      const pb = pctPrimaCap(b)
      return sortDir === "desc" ? pb - pa : pa - pb
    })

    return result
  }, [monthTrades, statusFilter, tickerFilter, strategyFilter, sortDir])

  // Stats
  const openCount = filtered.filter(t => t.status === "open").length
  const wins = filtered.filter(t => t.status === "closed" && realizedPnl(t) > 1).length
  const losses = filtered.filter(t => t.status === "closed" && realizedPnl(t) < -1).length
  const totalPnl = filtered.reduce((sum, t) => {
    if (t.status === "closed") return sum + realizedPnl(t)
    return sum
  }, 0)

  function navigate(dir: -1 | 1) {
    let m = viewMonth + dir
    let y = viewYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    onMonthChange(y, m)
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "abiertos", label: "Abiertos" },
    { key: "cerrados", label: "Cerrados" },
  ]

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Table header controls */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
      }}>
        {/* Title + month nav */}
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
          TRADES
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle}>{"<"}</button>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, minWidth: "110px", textAlign: "center" }}>
            {MONTH_NAMES_ES[viewMonth - 1]} {viewYear}
          </span>
          <button onClick={() => navigate(1)} style={navBtnStyle}>{">"}</button>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: "2px", background: "var(--bg-primary)", borderRadius: "8px", padding: "2px" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "6px",
                border: "none",
                background: statusFilter === t.key ? "var(--bg-card)" : "transparent",
                color: statusFilter === t.key ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "0.8125rem",
                cursor: "pointer",
                fontWeight: statusFilter === t.key ? 600 : 400,
                boxShadow: statusFilter === t.key ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Strategy filter */}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <button
            onClick={e => { e.stopPropagation(); setStrategyOpen(v => !v) }}
            style={{
              padding: "0.3rem 0.75rem",
              background: strategyFilter !== "todos" ? "var(--purple-dim)" : "var(--bg-primary)",
              border: "1px solid " + (strategyFilter !== "todos" ? "var(--purple)" : "var(--border)"),
              borderRadius: "8px",
              color: strategyFilter !== "todos" ? "var(--purple)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: strategyFilter !== "todos" ? 600 : 400,
            }}
          >
            {strategyFilter === "todos" ? "Tipo ▼" : `${strategyFilter} ▼`}
          </button>
          {strategyOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                overflow: "hidden",
                minWidth: "120px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                zIndex: 100,
              }}
              onClick={e => e.stopPropagation()}
            >
              {(["todos", "Put", "Call"] as StrategyFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setStrategyFilter(s); setStrategyOpen(false) }}
                  style={tickerItemStyle(strategyFilter === s)}
                >
                  {s === "todos" ? "Todos" : s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticker filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={e => { e.stopPropagation(); setTickerOpen(v => !v) }}
            style={{
              padding: "0.3rem 0.75rem",
              background: tickerFilter !== "todos" ? "var(--accent-dim)" : "var(--bg-primary)",
              border: "1px solid " + (tickerFilter !== "todos" ? "var(--accent)" : "var(--border)"),
              borderRadius: "8px",
              color: tickerFilter !== "todos" ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: tickerFilter !== "todos" ? 600 : 400,
            }}
          >
            {tickerFilter === "todos" ? "Ticker ▼" : `${tickerFilter} ▼`}
          </button>
          {tickerOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                overflow: "hidden auto",
                maxHeight: "240px",
                minWidth: "120px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                zIndex: 100,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setTickerFilter("todos"); setTickerOpen(false) }}
                style={tickerItemStyle(tickerFilter === "todos")}
              >
                Todos
              </button>
              {uniqueTickers.map(tk => (
                <button
                  key={tk}
                  onClick={() => { setTickerFilter(tk); setTickerOpen(false) }}
                  style={tickerItemStyle(tickerFilter === tk)}
                >
                  {tk}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        <span className="num">{filtered.length} trades</span>
        {" · "}
        <span style={{ color: "var(--green)" }} className="num">{wins} win</span>
        {" · "}
        <span style={{ color: "var(--red)" }} className="num">{losses} loss</span>
        {" · "}
        <span style={{ color: totalPnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }} className="num">
          {fmtDollar(totalPnl)}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="tt-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>TICKER</th>
              <th>TIPO</th>
              <th>ACCIÓN</th>
              <th>ESTRATEGIA</th>
              <th style={{ textAlign: "right" }}>QTY</th>
              <th style={{ textAlign: "right" }}>PRECIO</th>
              <th style={{ textAlign: "right" }}>COM.</th>
              <th style={{ minWidth: "130px" }}>DTE RESTANTE</th>
              <th
                className="sortable"
                style={{ minWidth: "160px" }}
                onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              >
                % PRIMA CAP. {sortDir === "desc" ? "↓" : "↑"}
              </th>
              <th style={{ textAlign: "right" }}>NO REALIZADO</th>
              <th style={{ textAlign: "right" }}>REALIZADO</th>
              <th style={{ textAlign: "center" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                  Sin trades para este período
                </td>
              </tr>
            ) : (
              filtered.map(trade => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  onEdit={onEdit}
                  onDelete={() => {
                    if (confirm(`¿Eliminar la operación de ${trade.ticker}?`)) {
                      markDeleted(trade.id)
                      window.dispatchEvent(new StorageEvent("storage", { key: "tt-deleted-trade-ids" }))
                    }
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function tickerItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "0.5rem 1rem",
    textAlign: "left",
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--text-primary)",
    fontSize: "0.8125rem",
    cursor: "pointer",
    border: "none",
    fontWeight: active ? 600 : 400,
  }
}

function TradeRow({ trade, onEdit, onDelete }: { trade: OptionTrade; onEdit?: (t: OptionTrade) => void; onDelete?: () => void }) {
  const dte = dteRemaining(trade.expiration)
  const dteProg = dteProgress(trade)
  const pctCap = pctPrimaCap(trade)
  const unreal = unrealizedPnl(trade)
  const real = realizedPnl(trade)
  const strategy = inferStrategy(trade)

  // Expiry display
  const expShort = trade.expiration.replace("2026-", "26-")

  // Current option price display
  const currentOptPrice = trade.status === "closed"
    ? (trade.closePrice !== undefined ? trade.closePrice : 0)
    : trade.currentPrice

  const accionLabel = trade.status === "open"
    ? "Venta de apertura"
    : (trade.closePrice ?? 0) > 0 ? "Compra de cierre" : "Expirada"
  const accionColor = trade.status === "open" ? "var(--orange)" : (trade.closePrice ?? 0) > 0 ? "var(--green)" : "var(--text-muted)"

  return (
    <tr>
      {/* FECHA */}
      <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{trade.date}</td>

      {/* TICKER */}
      <td style={{ fontWeight: 700, letterSpacing: "0.02em" }}>{trade.ticker}</td>

      {/* TIPO */}
      <td>
        <span style={{
          display: "inline-block",
          padding: "0.125rem 0.5rem",
          borderRadius: "5px",
          fontSize: "0.75rem",
          fontWeight: 600,
          background: trade.type === "Put" ? "var(--purple-dim)" : "var(--accent-dim)",
          color: trade.type === "Put" ? "var(--purple)" : "var(--accent)",
        }}>
          {trade.type}
        </span>
      </td>

      {/* ACCIÓN */}
      <td style={{ color: accionColor, fontSize: "0.75rem", letterSpacing: "0.02em", fontWeight: 600, whiteSpace: "nowrap" }}>{accionLabel}</td>

      {/* ESTRATEGIA */}
      <td style={{ whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STRATEGY_COLORS[strategy] ?? "var(--text-muted)", flexShrink: 0 }} />
          {strategy}
        </span>
      </td>

      {/* QTY */}
      <td style={{ textAlign: "right", fontWeight: 500 }} className="num">{trade.qty}</td>

      {/* PRECIO */}
      <td style={{ textAlign: "right", fontWeight: 500 }} className="num">${trade.premium.toFixed(2)}</td>

      {/* COMISIÓN */}
      <td style={{ textAlign: "right", color: "var(--text-muted)" }} className="num">—</td>

      {/* DTE RESTANTE */}
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, color: dte === 0 ? "var(--text-muted)" : "var(--text-primary)" }} className="num">
              {dte}d
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{expShort}</span>
          </div>
          <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${dteProg * 100}%`,
              background: "var(--accent)",
              borderRadius: "2px",
              opacity: 0.7,
            }} />
          </div>
        </div>
      </td>

      {/* % PRIMA CAPTURADA */}
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ flex: 1, minWidth: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{
                fontWeight: 600,
                color: pctCap >= 0 ? "var(--green)" : "var(--red)",
                fontSize: "0.8125rem",
              }} className="num">
                {Math.round(pctCap)}%
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }} className="num">
                ${currentOptPrice.toFixed(2)}
              </span>
            </div>
            <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, Math.abs(pctCap)))}%`,
                background: pctCap >= 0 ? "var(--green)" : "var(--red)",
                borderRadius: "2px",
              }} />
            </div>
          </div>
        </div>
      </td>

      {/* NO REALIZADO */}
      <td style={{ textAlign: "right" }}>
        {trade.status === "open" ? (
          <span style={{
            fontWeight: 600,
            color: unreal >= 0 ? "var(--green)" : "var(--red)",
          }} className="num">
            {fmtDollar(unreal)}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </td>

      {/* REALIZADO */}
      <td style={{ textAlign: "right" }}>
        {trade.status === "closed" ? (
          <span style={{
            fontWeight: 600,
            color: real >= 0 ? "var(--green)" : "var(--red)",
          }} className="num">
            {fmtDollar(real)}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </td>

      {/* ACCIONES */}
      <td style={{ textAlign: "center" }}>
        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "center" }}>
          <button
            onClick={() => onEdit?.(trade)}
            title="Editar"
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem", display: "flex" }}
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem", display: "flex" }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </td>
    </tr>
  )
}
