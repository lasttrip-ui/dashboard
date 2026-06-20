"use client"

import { useCallback, useRef, useState } from "react"
import { parseCSV, detectBroker, parseIBKRExecutions, parseIBKRDividends, parseDeGiroDividends, parseDeGiroStockTransactions, type Broker, type ImportedExecution, type ImportedDividend, type ImportedStockTransaction } from "@/lib/import-parser"
import { loadImported, saveImported, clearImported, loadImportedExecs, saveImportedExecs, clearImportedExecs, loadImportedDividends, saveImportedDividends, clearImportedDividends, mergeImportedDividends, loadImportedStockTxns, saveImportedStockTxns, clearImportedStockTxns, mergeImportedStockTxns } from "@/lib/trade-store"
import type { OptionTrade } from "@/lib/data"
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Info } from "lucide-react"
import { buildDeGiroPositions } from "@/lib/degiro-positions"

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
      "Opciones: DeGiro → Actividad → Transacciones → filtra por Opciones → Exportar CSV",
      "Dividendos: DeGiro → Actividad → Cuenta → Exportar CSV (extracto de cuenta)",
    ],
    note: "Puedes subir ambos archivos por separado: el de Transacciones añade tus operaciones con opciones, y el de cuenta añade los dividendos cobrados a Cartera → Dividendos.",
  },
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [broker, setBroker] = useState<Broker>("IBKR")
  const [parsed, setParsed] = useState<OptionTrade[] | null>(null)
  const [parsedExecs, setParsedExecs] = useState<ImportedExecution[]>([])
  const [parsedDivs, setParsedDivs] = useState<ImportedDividend[]>([])
  const [parsedStockTxns, setParsedStockTxns] = useState<ImportedStockTransaction[]>([])
  const [saved, setSaved] = useState<OptionTrade[]>(() => loadImported())
  const [savedExecs, setSavedExecs] = useState<ImportedExecution[]>(() => loadImportedExecs())
  const [savedDivs, setSavedDivs] = useState<ImportedDividend[]>(() => loadImportedDividends())
  const [savedStockTxns, setSavedStockTxns] = useState<ImportedStockTransaction[]>(() => loadImportedStockTxns())
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setError(null)
    setParsed(null)
    setParsedExecs([])
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const detectedBroker = detectBroker(text)
      if (detectedBroker !== broker) setBroker(detectedBroker)
      const result = parseCSV(text, detectedBroker)
      const execs = detectedBroker === "IBKR" ? parseIBKRExecutions(text) : []
      const divs = detectedBroker === "IBKR" ? parseIBKRDividends(text) : parseDeGiroDividends(text)
      const stockTxns = detectedBroker === "DeGiro" ? parseDeGiroStockTransactions(text) : []
      if (result.length === 0 && execs.length === 0 && divs.length === 0 && stockTxns.length === 0) {
        setError("No se encontraron movimientos en el archivo. Comprueba que es un extracto de actividad de IBKR (con la sección «Operaciones»), un export de transacciones de DeGiro, o un extracto de cuenta de DeGiro con dividendos.")
      } else {
        if (result.length > 0) setParsed(result)
        if (execs.length > 0) setParsedExecs(execs)
        if (divs.length > 0) setParsedDivs(divs)
        if (stockTxns.length > 0) setParsedStockTxns(stockTxns)
      }
    }
    reader.readAsText(file, "utf-8")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broker])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleSave() {
    if (parsed) {
      const current = loadImported()
      const ids = new Set(current.map(t => t.id))
      const newOnes = parsed.filter(t => !ids.has(t.id))
      const merged = [...current, ...newOnes]
      saveImported(merged)
      setSaved(merged)
    }
    if (parsedExecs.length > 0) {
      const current = loadImportedExecs()
      const ids = new Set(current.map(e => e.tradeId))
      const newOnes = parsedExecs.filter(e => !ids.has(e.tradeId))
      const merged = [...current, ...newOnes].sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))
      saveImportedExecs(merged)
      setSavedExecs(merged)
    }
    if (parsedDivs.length > 0) {
      const current = loadImportedDividends()
      const merged = mergeImportedDividends(current, parsedDivs)
      saveImportedDividends(merged)
      setSavedDivs(merged)
    }
    if (parsedStockTxns.length > 0) {
      const current = loadImportedStockTxns()
      const merged = mergeImportedStockTxns(current, parsedStockTxns)
      saveImportedStockTxns(merged)
      setSavedStockTxns(merged)
    }
    setParsed(null)
    setParsedExecs([])
    setParsedDivs([])
    setParsedStockTxns([])
    setFileName(null)
  }

  function handleClear() {
    clearImported()
    clearImportedExecs()
    clearImportedDividends()
    clearImportedStockTxns()
    setSaved([])
    setSavedExecs([])
    setSavedDivs([])
    setSavedStockTxns([])
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
      {(parsed || parsedExecs.length > 0 || parsedDivs.length > 0 || parsedStockTxns.length > 0) && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Vista previa
                {parsed && ` — ${parsed.length} opciones`}
                {parsedExecs.length > 0 && ` — ${parsedExecs.length} movimientos`}
                {parsedDivs.length > 0 && ` — ${parsedDivs.length} dividendos`}
                {parsedStockTxns.length > 0 && ` — ${parsedStockTxns.length} transacciones de acciones`}
              </div>
              {parsedExecs.length > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {parsedExecs[0].tradeTime.slice(0, 10)} → {parsedExecs[parsedExecs.length - 1].tradeTime.slice(0, 10)}
                </div>
              )}
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

          {/* Executions preview */}
          {parsedExecs.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: parsed ? "1rem" : 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    {["Fecha", "Símbolo", "Tipo", "Lado", "Cant.", "Precio", "P&L Realizado"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.375rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedExecs.slice(0, 50).map((e, i) => (
                    <tr key={e.tradeId} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-hover)" }}>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{e.tradeTime.slice(0, 10)}</td>
                      <td style={{ padding: "0.3rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{e.symbol}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{e.secType}</td>
                      <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: e.side === "SELL" ? "var(--red)" : "var(--green)" }}>{e.side}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">{e.size}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">${e.price.toFixed(2)}</td>
                      <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: e.realizedPnl > 0 ? "var(--green)" : e.realizedPnl < 0 ? "var(--red)" : "var(--text-muted)" }} className="num">
                        {e.realizedPnl !== 0 ? `${e.realizedPnl >= 0 ? "+" : ""}$${e.realizedPnl.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedExecs.length > 50 && (
                <div style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Mostrando los primeros 50 de {parsedExecs.length} movimientos
                </div>
              )}
            </div>
          )}

          {/* Dividends preview */}
          {parsedDivs.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: parsed ? "1rem" : 0 }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Dividendos detectados
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    {["Fecha", "Empresa", "CCY", "Importe", "Descripción"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.375rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedDivs.slice(0, 30).map((d, i) => (
                    <tr key={`${d.date}_${d.company}_${i}`} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-hover)" }}>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.date}</td>
                      <td style={{ padding: "0.3rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{d.company}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{d.currency}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--green)", fontWeight: 600 }} className="num">${d.amount.toFixed(2)}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.6875rem", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedDivs.length > 30 && (
                <div style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Mostrando los primeros 30 de {parsedDivs.length} dividendos
                </div>
              )}
            </div>
          )}

          {/* Stock positions preview (computed from transactions) */}
          {parsedStockTxns.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: parsed ? "1rem" : 0 }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Posiciones resultantes en acciones (cantidad neta a fecha de hoy)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    {["Símbolo", "Empresa", "Cant.", "Coste medio", "CCY"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.375rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildDeGiroPositions(parsedStockTxns).map((p, i) => (
                    <tr key={p.contractId} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-hover)" }}>
                      <td style={{ padding: "0.3rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.symbol}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{p.description}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">{p.position}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-secondary)" }} className="num">{p.averagePrice.toFixed(2)}</td>
                      <td style={{ padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>{p.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: "0.5rem", fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Coste medio aproximado a partir del histórico de compras. El precio de mercado se actualizará con cotización en vivo cuando esté disponible.
              </div>
            </div>
          )}

          {parsed && <div style={{ overflowX: "auto" }}>
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
          </div>}
        </div>
      )}

      {/* Saved dividends summary */}
      {savedDivs.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <CheckCircle size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {savedDivs.length} dividendos importados
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {savedDivs[0]?.date.slice(0, 4)} → {savedDivs[savedDivs.length - 1]?.date.slice(0, 4)} · Visibles en Cartera → Dividendos
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved stock positions summary */}
      {savedStockTxns.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <CheckCircle size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {buildDeGiroPositions(savedStockTxns).length} posiciones de acciones DeGiro activas
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  De {savedStockTxns.length} transacciones importadas · Visibles en Cartera → Posiciones y Mapa de calor
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved executions summary */}
      {savedExecs.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <CheckCircle size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {savedExecs.length} movimientos históricos importados
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Visibles en el calendario · {savedExecs[0]?.tradeTime.slice(0, 10)} → {savedExecs[savedExecs.length - 1]?.tradeTime.slice(0, 10)}
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
