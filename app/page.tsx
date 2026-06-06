"use client"

import { useEffect, useState, useCallback } from "react"
import type { IBKRSnapshot } from "@/components/portfolio/types"
import KpiStrip from "@/components/portfolio/KpiStrip"
import PositionsPanel from "@/components/portfolio/PositionsPanel"
import TradesPanel from "@/components/portfolio/TradesPanel"
import PnlBySymbol from "@/components/portfolio/PnlBySymbol"

const REFRESH_INTERVAL = 60_000 // 60s

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function Dot({ pulse }: { pulse: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--green)",
      marginRight: "0.4rem",
      animation: pulse ? "pulse 1.2s ease-in-out infinite" : "none",
    }} />
  )
}

export default function PortfolioPage() {
  const [data, setData] = useState<IBKRSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/ibkr", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load")
      const json: IBKRSnapshot = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchData(true), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  useEffect(() => {
    const saved = localStorage.getItem("tt-theme") as "dark" | "light" | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("tt-theme", next)
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* ─── Navbar ─── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>
              🐢 Tortuga Trades
            </span>
            <span style={{ color: "var(--border)", fontSize: "1rem" }}>|</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Portfolio</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {data && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <Dot pulse={refreshing} />
                {refreshing ? "Actualizando…" : `Snapshot: ${formatTime(data.lastUpdated)}`}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.3rem 0.75rem",
                cursor: refreshing ? "not-allowed" : "pointer",
                color: "var(--text-primary)",
                fontSize: "0.8125rem",
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={toggleTheme}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-secondary)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 0.75rem" }} />
              Cargando datos de Interactive Brokers…
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: 10, padding: "1rem 1.25rem", color: "var(--red)" }}>
            Error: {error}
          </div>
        )}

        {data && !loading && (
          <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* KPI strip */}
            <KpiStrip summary={data.summary} balances={data.balances} />

            {/* P&L chart + Trades side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.25rem" }}>
              <PnlBySymbol positions={data.positions} />
              <TradesPanel trades={data.recentTrades} />
            </div>

            {/* Positions table */}
            <PositionsPanel positions={data.positions} />

            {/* Footer note */}
            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", paddingBottom: "0.5rem" }}>
              Datos en tiempo real de Interactive Brokers via Claude MCP · auto-refresh cada 60s · para actualizar manualmente dí &quot;actualiza los datos&quot;
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
