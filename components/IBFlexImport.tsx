"use client"

import { useState, useRef } from "react"
import { Upload, RefreshCw, Settings, X, CheckCircle, AlertCircle, Loader, Info } from "lucide-react"
import { useLocalStorage } from "@/lib/store"
import { fetchIBFlexQuery, parseUploadedXml, type IBFlexConfig } from "@/lib/ibflex"
import type { IBFlexResult } from "@/lib/ibflex"

interface Props {
  onImport: (result: IBFlexResult) => void
}

type Status = "idle" | "loading" | "success" | "error"

export default function IBFlexImport({ onImport }: Props) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useLocalStorage<IBFlexConfig>("tt-ib-flex-config", { token: "", queryId: "" })
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const [tab, setTab] = useState<"upload" | "api">("upload")
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() { setStatus("idle"); setErrorMsg(""); setWarnings([]) }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    reset()
    setStatus("loading")
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const xml = ev.target?.result as string
        const result = parseUploadedXml(xml)
        setWarnings(result.warnings)
        if (result.trades.length === 0 && result.warnings.length > 0) {
          setErrorMsg(result.warnings[0])
          setStatus("error")
        } else {
          onImport(result)
          setStatus("success")
          setTimeout(() => setOpen(false), 1200)
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error al parsear el XML")
        setStatus("error")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  async function handleFetch() {
    if (!config.token || !config.queryId) return
    reset()
    setStatus("loading")
    try {
      const result = await fetchIBFlexQuery(config)
      setWarnings(result.warnings)
      onImport(result)
      setStatus("success")
      setTimeout(() => setOpen(false), 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("Failed to fetch") || msg.toLowerCase().includes("cors") || msg.includes("NetworkError")) {
        setTab("upload")
        setErrorMsg("No se pudo conectar con IB — usa la pestaña 'Subir XML'")
      } else {
        setErrorMsg(msg)
      }
      setStatus("error")
    }
  }

  return (
    <>
      {/* Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => { reset(); setOpen(true) }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
          }}
        >
          <Settings size={14} />
          Conectar con IB (Flex Query)
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, margin: 16 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Interactive Brokers · Flex Query</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-primary)", borderRadius: 10, marginBottom: 20 }}>
              {([["upload", "Subir XML"], ["api", "API directa"]] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => { setTab(key); reset() }} style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: tab === key ? 600 : 500,
                  background: tab === key ? "var(--amber)" : "transparent",
                  color: tab === key ? "#0b1120" : "var(--text-secondary)",
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {tab === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Cómo descargar el XML de IB:</strong>
                  <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Entra en <strong>Client Portal → Reports → Flex Queries</strong></li>
                    <li>Crea o ejecuta una Flex Query con <strong>Trades</strong> (assetCategory=OPT)</li>
                    <li>Descarga el resultado como <strong>XML</strong></li>
                    <li>Súbelo aquí</li>
                  </ol>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed var(--border)", borderRadius: 12, padding: "32px 20px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    cursor: "pointer", textAlign: "center", transition: "border-color 0.2s",
                  }}
                >
                  {status === "loading" ? (
                    <Loader size={28} style={{ color: "var(--amber)" }} className="spin" />
                  ) : status === "success" ? (
                    <CheckCircle size={28} style={{ color: "var(--green)" }} />
                  ) : (
                    <Upload size={28} style={{ color: "var(--text-secondary)" }} />
                  )}
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {status === "loading" ? "Procesando…" : status === "success" ? "¡Importado!" : "Haz clic para seleccionar el XML"}
                  </div>
                  {status === "idle" && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Archivo .xml descargado de IB Flex Query</div>}
                </div>
                <input ref={fileRef} type="file" accept=".xml,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
              </div>
            )}

            {/* API tab */}
            {tab === "api" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "var(--amber)", display: "flex", gap: 8 }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  La petición se hace a través del servidor de la app (evita el bloqueo CORS de IB). Puede tardar hasta ~1 min mientras IB genera el extracto.
                </div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  Token
                  <input type="password" value={config.token} onChange={e => setConfig({ ...config, token: e.target.value })} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "monospace", fontSize: 13, boxSizing: "border-box" }} />
                </label>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  Query ID
                  <input type="text" value={config.queryId} onChange={e => setConfig({ ...config, queryId: e.target.value })} placeholder="123456"
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "monospace", fontSize: 13, boxSizing: "border-box" }} />
                </label>
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={!config.token || !config.queryId || status === "loading"}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-sans)",
                    opacity: (!config.token || !config.queryId || status === "loading") ? 0.5 : 1,
                  }}
                >
                  {status === "loading" ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
                  Importar ahora
                </button>
              </div>
            )}

            {/* Errors & warnings */}
            {status === "error" && errorMsg && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", color: "var(--red)", fontSize: 13, padding: "10px 12px", background: "rgba(248,113,113,0.08)", borderRadius: 8 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {errorMsg}
              </div>
            )}
            {warnings.length > 0 && status !== "error" && (
              <div style={{ marginTop: 14, fontSize: 12, color: "var(--amber)", padding: "10px 12px", background: "rgba(251,191,36,0.08)", borderRadius: 8 }}>
                {warnings.map((w, i) => <div key={i}>{w}</div>)}
              </div>
            )}
            {status === "success" && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", color: "var(--green)", fontSize: 13 }}>
                <CheckCircle size={16} /> Trades importados correctamente
              </div>
            )}

            <p style={{ marginTop: 16, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Tu token y datos se guardan solo en el localStorage de este navegador.
            </p>
          </div>
        </div>
      )}

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
