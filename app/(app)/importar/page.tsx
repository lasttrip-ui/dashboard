"use client"

import { useCallback, useRef, useState } from "react"
import { parseCSV, detectBroker, type Broker } from "@/lib/import-parser"
import { loadImported, saveImported, clearImported } from "@/lib/trade-store"
import type { OptionTrade } from "@/lib/data"
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Info } from "lucide-react"

// ── helpers ───────────────────────────────────────────────────────────────────

function tradePnl(t: OptionTrade) {
  if (t.status === "open") return null
  return (t.premium - (t.closePrice ?? 0)) * t.qty * 100
}

function badge(label: string, color: string, bg: string) {
  return (
    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color, background: bg, borderRadius: 4, padding: "0.125rem 0.375rem" }}>
      {label}
    </span>
  )
}

// ── broker instructions ───────────────────────────────────────────────────────

const INSTRUCTIONS: Record<Broker, { steps: string[]; note: string }> = {
  IBKR: {
    steps: [
      "En IBKR → Rendimiento e informes → Extractos",
      "Selecciona tipo: Extracto de Actividad",
      "Período: Rango de fechas (elige todo el año)",
      "Formato: CSV → Descargar",
    ],
    note: "El archivo incluirá la sección «Transacciones» con todas tus opciones.",
  },
  DeGiro: {
    steps: [
      "En DeGiro → Actividad → Transacciones",
      "Filtra por período y tipo: Opciones",
      "Exportar → CSV",
    ],
    note: "Asegúrate de exportar en formato estándar (no PDF).",
  },
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [broker, setBroker] = useState<Broker>("IBKR")
  const [parsed, setParsed] = useState<OptionTrade[] | null>(null)
  const [saved, setSaved] = useState<OptionTrade[]>(() => loadImported())
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setError(null)
    setParsed(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const detectedBroker = detectBroker(text)
      if (detectedBroker !== broker) setBroker(detectedBroker)
      const result = parseCSV(text, detectedBroker)
      if (result.length === 0) {
        setError("No se encontraron opciones en el archivo. Comprueba que es un extracto de actividad correcto y que contiene operaciones con opciones.")
      } else {
        setParsed(result)
      }
    }
    reader.readAsText(file, "utf-8")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [broker])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleSave() {
    if (!parsed) return
    const current = loadImported()
    const ids = new Set(current.map(t => t.id))
    const newOnes = parsed.filter(t => !ids.has(t.id))
    const merged = [...current, ...newOnes]
    saveImported(merged)
    setSaved(merged)
    setParsed(null)
    setFileName(null)
  }

  function handleClear() {
    clearImported()
    setSaved([])
  }

  const info = INSTRUCTIONS[broker]

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
          Importar Operaciones
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
          Sube tu extracto CSV de IBKR o DeGiro y el dashboard lo procesará automáticamente.
        </p>
      </div>

      {/* Broker selector */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>
          Broker
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["IBKR", "DeGiro"] as Broker[]).map(b => (
            <button key={b} onClick={() => { setBroker(b); setParsed(null); setError(null); setFileName(null) }} style={{
              padding: "0.4rem 1.25rem",
              borderRadius: 8,
              border: broker === b ? "none" : "1px solid var(--border)",
              background: broker === b ? "var(--accent)" : "var(--bg-hover)",
              color: broker === b ? "#fff" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: broker === b ? 700 : 400,
            }}>
              {b === "IBKR" ? "Interactive Brokers" : "DeGiro"}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="card" style={{ padding: "1rem", borderLeft: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <Info size={14} color="var(--accent)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Cómo exportar desde {broker === "IBKR" ? "Interactive Brokers" : "DeGiro"}
          </div>
        </div>
        <ol style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {info.steps.map((s, i) => (
            <li key={i} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s}</li>
          ))}
        </ol>
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {info.note}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 12,
          padding: "2.5rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--accent-dim)" : "var(--bg-card)",
          transition: "all 0.15s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Upload size={28} color={dragging ? "var(--accent)" : "var(--text-muted)"} />
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: dragging ? "var(--accent)" : "var(--text-primary)" }}>
          {fileName ? fileName : "Arrastra tu CSV aquí"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          o haz clic para seleccionar archivo
        </div>
        <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={onFileChange} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.875rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10 }}>
          <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: "0.8125rem", color: "var(--red)", lineHeight: 1.5 }}>{error}</div>
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Vista previa — {parsed.length} operaciones detectadas
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                {parsed[0].date} → {parsed[parsed.length - 1].date}
              </div>
            </div>
            <button onClick={handleSave} style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.45rem 1rem", borderRadius: 8, border: "none",
              background: "var(--accent)", color: "#fff", cursor: "pointer",
              fontSize: "0.8125rem", fontWeight: 600,
            }}>
              <CheckCircle size={14} />
              Guardar en dashboard
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr>
                  {["Fecha", "Ticker", "Tipo", "Cantidad", "Prima", "Vencimiento", "DTE", "Estado"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.375rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-hover)" }}>
                    <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{t.date}</td>
                    <td style={{ padding: "0.3rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{t.ticker}</td>
                    <td style={{ padding: "0.3rem 0.5rem" }}>
                      {t.type === "Put"
                        ? badge("PUT", "#ef4444", "rgba(239,68,68,0.12)")
                        : badge("CALL", "#22c55e", "rgba(34,197,94,0.12)")}
                    </td>
                    <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">{t.qty}</td>
                    <td style={{ padding: "0.3rem 0.5rem", color: "var(--green)" }} className="num">${t.premium.toFixed(2)}</td>
                    <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{t.expiration}</td>
                    <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">{t.dteTotalAtOpen}d</td>
                    <td style={{ padding: "0.3rem 0.5rem" }}>
                      {t.status === "open"
                        ? badge("Abierta", "var(--accent)", "var(--accent-dim)")
                        : badge("Cerrada", "var(--text-muted)", "var(--bg-hover)")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved trades summary */}
      {saved.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <CheckCircle size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {saved.length} operaciones importadas
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Activas en el dashboard · {saved[0]?.date} → {saved[saved.length - 1]?.date}
                </div>
              </div>
            </div>
            <button onClick={handleClear} style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.4rem 0.875rem", borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)", color: "var(--red)",
              cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
            }}>
              <Trash2 size={13} />
              Limpiar todo
            </button>
          </div>

          {/* Broker breakdown */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {(["IBKR", "DeGiro"] as Broker[]).map(b => {
              const count = saved.filter(t => t.id.startsWith(b.toLowerCase())).length
              if (count === 0) return null
              return (
                <div key={b} style={{ background: "var(--bg-hover)", borderRadius: 8, padding: "0.5rem 0.875rem", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{b}</div>
                  <div className="num" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{count}</div>
                </div>
              )
            })}
            <div style={{ background: "var(--bg-hover)", borderRadius: 8, padding: "0.5rem 0.875rem", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Abiertas</div>
              <div className="num" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)" }}>
                {saved.filter(t => t.status === "open").length}
              </div>
            </div>
            <div style={{ background: "var(--bg-hover)", borderRadius: 8, padding: "0.5rem 0.875rem", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cerradas</div>
              <div className="num" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                {saved.filter(t => t.status === "closed").length}
              </div>
            </div>
          </div>

          {/* Trades mini-table */}
          <div style={{ overflowX: "auto", marginTop: "0.875rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr>
                  {["Fecha", "Ticker", "Tipo", "Prima", "Vencimiento", "Estado"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {saved.slice(-30).reverse().map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-hover)" }}>
                    <td style={{ padding: "0.25rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{t.date}</td>
                    <td style={{ padding: "0.25rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{t.ticker}</td>
                    <td style={{ padding: "0.25rem 0.5rem" }}>
                      {t.type === "Put"
                        ? badge("PUT", "#ef4444", "rgba(239,68,68,0.12)")
                        : badge("CALL", "#22c55e", "rgba(34,197,94,0.12)")}
                    </td>
                    <td style={{ padding: "0.25rem 0.5rem", color: "var(--green)" }} className="num">${t.premium.toFixed(2)}</td>
                    <td style={{ padding: "0.25rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{t.expiration}</td>
                    <td style={{ padding: "0.25rem 0.5rem" }}>
                      {t.status === "open"
                        ? badge("Abierta", "var(--accent)", "var(--accent-dim)")
                        : badge("Cerrada", "var(--text-muted)", "var(--bg-hover)")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {saved.length > 30 && (
              <div style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Mostrando las últimas 30 de {saved.length} operaciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
