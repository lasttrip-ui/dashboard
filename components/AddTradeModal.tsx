"use client"

import { useState } from "react"
import type { OptionTrade } from "@/lib/data"
import { loadImported, saveImported } from "@/lib/trade-store"
import { TODAY } from "@/lib/utils"

interface AddTradeModalProps {
  onClose: () => void
  onSaved: () => void
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.625rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontSize: "0.8125rem",
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "0.25rem",
  display: "block",
}

export default function AddTradeModal({ onClose, onSaved }: AddTradeModalProps) {
  const [date, setDate] = useState(TODAY)
  const [ticker, setTicker] = useState("")
  const [type, setType] = useState<"Put" | "Call">("Put")
  const [qty, setQty] = useState("1")
  const [premium, setPremium] = useState("")
  const [expiration, setExpiration] = useState("")
  const [status, setStatus] = useState<"open" | "closed">("open")
  const [currentPrice, setCurrentPrice] = useState("")
  const [closePrice, setClosePrice] = useState("")
  const [error, setError] = useState("")

  function handleSave() {
    if (!ticker.trim() || !premium || !expiration) {
      setError("Completa ticker, prima y vencimiento.")
      return
    }
    const dteTotalAtOpen = Math.max(0, Math.round((new Date(expiration).getTime() - new Date(date).getTime()) / 86_400_000))
    const trade: OptionTrade = {
      id: `manual_${Date.now()}`,
      date,
      ticker: ticker.trim().toUpperCase(),
      type,
      action: "SELL",
      qty: parseInt(qty) || 1,
      premium: parseFloat(premium) || 0,
      expiration,
      dteTotalAtOpen,
      currentPrice: status === "open" ? (parseFloat(currentPrice) || 0) : 0,
      status,
      ...(status === "closed" ? { closePrice: parseFloat(closePrice) || 0 } : {}),
    }
    const existing = loadImported()
    saveImported([...existing, trade])
    // useAllTrades only listens for cross-tab storage events; dispatch one manually so this tab updates too
    window.dispatchEvent(new StorageEvent("storage", { key: "tt-imported-trades" }))
    onSaved()
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: "420px", maxWidth: "92vw", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Nueva operación</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.125rem" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Fecha apertura</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ticker</label>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="AAPL" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as "Put" | "Call")} style={inputStyle}>
              <option value="Put">Put</option>
              <option value="Call">Call</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Cantidad</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prima ($)</label>
            <input type="number" step="0.01" value={premium} onChange={e => setPremium(e.target.value)} placeholder="0.00" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Vencimiento</label>
            <input type="date" value={expiration} onChange={e => setExpiration(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value as "open" | "closed")} style={inputStyle}>
              <option value="open">Abierta</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
          {status === "open" ? (
            <div>
              <label style={labelStyle}>Precio actual ($)</label>
              <input type="number" step="0.01" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Precio de cierre ($)</label>
              <input type="number" step="0.01" value={closePrice} onChange={e => setClosePrice(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
          )}
        </div>

        {error && <div style={{ fontSize: "0.75rem", color: "var(--red)" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.625rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8125rem" }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
