"use client"

import { useState, useRef } from "react"
import { RefreshCw, Settings, Upload, X, CheckCircle, AlertCircle, Loader } from "lucide-react"
import { useLocalStorage } from "@/lib/store"
import { fetchIBFlexQuery, parseUploadedXml, type IBFlexConfig } from "@/lib/ibflex"
import type { ImportMeta } from "@/lib/imported-trades"
import type { IBFlexResult } from "@/lib/ibflex"

interface Props {
  meta: ImportMeta | null
  onImport: (result: IBFlexResult) => void
  onClear: () => void
}

type Status = "idle" | "loading" | "success" | "error"

export default function IBFlexImport({ meta, onImport, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useLocalStorage<IBFlexConfig>("lol-ib-config", { token: "", queryId: "" })
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [corsWarning, setCorsWarning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFetch() {
    if (!config.token || !config.queryId) return
    setStatus("loading")
    setErrorMsg("")
    setCorsWarning(false)
    try {
      const result = await fetchIBFlexQuery(config)
      onImport(result)
      setStatus("success")
      setOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("Failed to fetch") || msg.includes("CORS") || msg.includes("NetworkError")) {
        setCorsWarning(true)
        setErrorMsg("CORS bloqueado por el navegador. Usa la opción de subir XML.")
      } else {
        setErrorMsg(msg)
      }
      setStatus("error")
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const xml = ev.target?.result as string
        const result = parseUploadedXml(xml)
        onImport(result)
        setStatus("success")
        setOpen(false)
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Error al parsear el XML")
        setStatus("error")
      }
    }
    reader.readAsText(file)
  }

  const metaDate = meta?.fetchedAt ? new Date(meta.fetchedAt).toLocaleString("es-ES") : null

  return (
    <>
      {/* Trigger button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {meta && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {meta.count} ops · {meta.accountId} · {metaDate}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)",
            background: meta ? "var(--amber-dim)" : "var(--bg-card)",
            color: meta ? "var(--amber)" : "var(--text-secondary)",
            cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
          }}
        >
          {meta ? <RefreshCw size={14} /> : <Settings size={14} />}
          {meta ? "Actualizar IB" : "Conectar IB"}
        </button>
        {meta && (
          <button
            type="button"
            onClick={onClear}
            title="Volver a datos demo"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, margin: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Interactive Brokers · Flex Query</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              Crea una Flex Query en IB con <strong>Trades</strong> (assetCategory=OPT) y pega tu token y Query ID.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>
                Token
                <input
                  type="password"
                  value={config.token}
                  onChange={e => setConfig({ ...config, token: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  style={{
                    display: "block", width: "100%", marginTop: 6,
                    padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg-primary)", color: "var(--text-primary)",
                    fontFamily: "monospace", fontSize: 13, boxSizing: "border-box",
                  }}
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 500 }}>
                Query ID
                <input
                  type="text"
                  value={config.queryId}
                  onChange={e => setConfig({ ...config, queryId: e.target.value })}
                  placeholder="123456"
                  style={{
                    display: "block", width: "100%", marginTop: 6,
                    padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg-primary)", color: "var(--text-primary)",
                    fontFamily: "monospace", fontSize: 13, boxSizing: "border-box",
                  }}
                />
              </label>
            </div>

            {corsWarning && (
              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--amber)", lineHeight: 1.5 }}>
                  IB bloquea solicitudes directas desde el navegador (CORS). Descarga el XML desde IB y súbelo:
                </p>
              </div>
            )}

            {status === "error" && !corsWarning && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", color: "var(--red)", fontSize: 13 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {errorMsg}
              </div>
            )}

            {status === "success" && (
              <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", color: "var(--green)", fontSize: 13 }}>
                <CheckCircle size={16} /> Trades importados correctamente
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                type="button"
                onClick={handleFetch}
                disabled={!config.token || !config.queryId || status === "loading"}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 14,
                  fontFamily: "var(--font-sans)", opacity: (!config.token || !config.queryId) ? 0.5 : 1,
                }}
              >
                {status === "loading" ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
                Importar ahora
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
                }}
              >
                <Upload size={14} /> Subir XML
              </button>
              <input ref={fileRef} type="file" accept=".xml,.csv" style={{ display: "none" }} onChange={handleFileUpload} />
            </div>

            <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Tu token se guarda solo en localStorage de este navegador. Nunca sale a ningún servidor externo (salvo la petición directa a IB).
            </p>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
