"use client"

import { useRef, useState } from "react"
import { Upload, TrendingUp, TrendingDown, X, BarChart2, RefreshCw } from "lucide-react"
import { parseDeGiroCSV, buildPositions, type Position } from "@/lib/degiro"
import { usePortfolio } from "@/lib/imported-portfolio"

function pct(val: number, total: number) {
  if (!total) return 0
  return (val / total) * 100
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function PositionRow({ pos, rank }: { pos: Position; rank: number }) {
  const pnlPct = pos.totalInvested > 0 ? pct(pos.realizedPnl, pos.totalInvested) : 0
  const isProfit = pos.realizedPnl >= 0

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 12 }}>{rank}</td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{pos.ticker}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{pos.isin}</div>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        {pos.shares > 0 ? (
          <span style={{ fontWeight: 600 }}>{fmt(pos.shares, pos.shares % 1 === 0 ? 0 : 2)}</span>
        ) : (
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Cerrada</span>
        )}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13 }}>
        {pos.avgCost > 0 ? `${fmt(pos.avgCost)} €` : "—"}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13 }}>
        {pos.totalInvested > 0 ? `${fmt(pos.totalInvested)} €` : "—"}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: isProfit ? "var(--green)" : pos.realizedPnl < 0 ? "var(--red)" : "var(--text-secondary)" }}>
          {pos.realizedPnl !== 0 ? `${isProfit ? "+" : ""}${fmt(pos.realizedPnl)} €` : "—"}
        </div>
        {pnlPct !== 0 && (
          <div style={{ fontSize: 11, color: isProfit ? "var(--green)" : "var(--red)" }}>
            {isProfit ? "+" : ""}{fmt(pnlPct)}%
          </div>
        )}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
          {pos.bolsa || "—"}
        </span>
      </td>
    </tr>
  )
}

export default function CarteraPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"todas" | "abiertas" | "cerradas">("todas")
  const { positions, meta, save, clear } = usePortfolio()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const rows = parseDeGiroCSV(text)
        const pos = buildPositions(rows)
        save(rows, pos, file.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al parsear el CSV")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const open = positions.filter(p => p.shares > 0.001)
  const closed = positions.filter(p => p.shares <= 0.001 && p.realizedPnl !== 0)
  const visible = filter === "abiertas" ? open : filter === "cerradas" ? closed : positions.filter(p => p.shares > 0.001 || p.realizedPnl !== 0)

  const totalInvested = open.reduce((s, p) => s + p.totalInvested, 0)
  const totalRealized = positions.reduce((s, p) => s + p.realizedPnl, 0)
  const winners = closed.filter(p => p.realizedPnl > 0).length
  const winRate = closed.length > 0 ? (winners / closed.length) * 100 : 0

  const metaDate = meta?.importedAt ? new Date(meta.importedAt).toLocaleDateString("es-ES") : null

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
            DeGiro
          </span>
          <h1 style={{ fontSize: 30, margin: "6px 0 0" }}>Cartera de acciones</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            {meta ? `${meta.rowCount} transacciones · ${meta.filename} · importado ${metaDate}` : "Importa tu CSV de transacciones de DeGiro"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {meta && (
            <button type="button" onClick={clear} title="Eliminar datos" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-sans)",
            }}
          >
            {meta ? <RefreshCw size={15} /> : <Upload size={15} />}
            {meta ? "Actualizar CSV" : "Importar CSV"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
      </header>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {!meta ? (
        /* Empty state */
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--border)", borderRadius: 16, padding: 64,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            cursor: "pointer", textAlign: "center",
          }}
        >
          <Upload size={32} style={{ color: "var(--text-secondary)" }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Sube tu CSV de DeGiro</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 380 }}>
            Exporta desde DeGiro → Actividad → Exportar → Transacciones. El archivo se procesa en tu navegador, nunca sale de tu dispositivo.
          </div>
          <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 4 }}>
            Haz clic o arrastra el archivo aquí
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Posiciones abiertas", value: open.length, unit: "", icon: BarChart2 },
              { label: "Capital invertido", value: fmt(totalInvested), unit: "€", icon: TrendingUp },
              { label: "P&L realizado", value: `${totalRealized >= 0 ? "+" : ""}${fmt(totalRealized)}`, unit: "€", icon: totalRealized >= 0 ? TrendingUp : TrendingDown, color: totalRealized >= 0 ? "var(--green)" : "var(--red)" },
              { label: "Win rate (cerradas)", value: fmt(winRate, 1), unit: "%", icon: TrendingUp, color: winRate >= 50 ? "var(--green)" : "var(--red)" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color ?? "var(--text-primary)" }}>
                  {kpi.value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>{kpi.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, alignSelf: "flex-start" }}>
            {(["todas", "abiertas", "cerradas"] as const).map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: filter === f ? 600 : 500,
                background: filter === f ? "var(--amber)" : "transparent",
                color: filter === f ? "#0b1120" : "var(--text-secondary)",
                textTransform: "capitalize",
              }}>
                {f} {f === "abiertas" ? `(${open.length})` : f === "cerradas" ? `(${closed.length})` : `(${visible.length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
                    {["#", "Activo", "Acciones", "Coste medio", "Invertido", "P&L realizado", "Bolsa"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "#" ? "left" : h === "Activo" ? "left" : "right", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.sort((a, b) => b.totalInvested - a.totalInvested).map((pos, i) => (
                    <PositionRow key={pos.isin || pos.producto} pos={pos} rank={i + 1} />
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                        No hay posiciones en esta categoría
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
