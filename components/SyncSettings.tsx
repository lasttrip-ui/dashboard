"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from "lucide-react"
import { getPassphrase, setPassphrase, syncPull, type PullStatus } from "@/lib/sync"

type Msg = { kind: "ok" | "warn" | "err"; text: string } | null

function describe(status: PullStatus): Msg {
  switch (status) {
    case "applied": return { kind: "ok", text: "Datos del servidor cargados en este dispositivo." }
    case "pushed": return { kind: "ok", text: "Datos de este dispositivo subidos al servidor." }
    case "uptodate": return { kind: "ok", text: "Ya estaba todo sincronizado." }
    case "unconfigured": return { kind: "warn", text: "El servidor aún no tiene almacén de sincronización configurado (falta el paso de Vercel KV). Los datos siguen guardándose en este navegador." }
    case "error": return { kind: "err", text: "No se pudo conectar con el servidor de sincronización." }
    case "disabled": return null
  }
}

export default function SyncSettings() {
  const [pass, setPass] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  useEffect(() => {
    setEnabled(!!getPassphrase())
  }, [])

  async function activate() {
    if (!pass.trim()) return
    setBusy(true)
    setMsg(null)
    setPassphrase(pass.trim())
    setEnabled(true)
    const status = await syncPull()
    setMsg(describe(status))
    setBusy(false)
    setPass("")
  }

  async function syncNow() {
    setBusy(true)
    setMsg(null)
    const status = await syncPull()
    setMsg(describe(status))
    setBusy(false)
  }

  function deactivate() {
    setPassphrase(null)
    setEnabled(false)
    setMsg({ kind: "warn", text: "Sincronización desactivada en este dispositivo. Tus datos locales se conservan." })
  }

  const msgColor = msg?.kind === "ok" ? "var(--green)" : msg?.kind === "err" ? "var(--red)" : "var(--accent)"

  return (
    <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {enabled ? <Cloud size={16} color="var(--green)" /> : <CloudOff size={16} color="var(--text-muted)" />}
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sincronización entre dispositivos
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>
            {enabled
              ? "Activada — tus datos importados se guardan en el servidor y se ven en cualquier dispositivo con la misma clave."
              : "Por defecto los datos importados solo viven en este navegador. Pon una clave para sincronizarlos entre dispositivos."}
          </div>
        </div>
      </div>

      {!enabled ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Clave de sincronización (elige una larga)"
            onKeyDown={e => { if (e.key === "Enter") void activate() }}
            style={{
              flex: 1, minWidth: 220, padding: "0.45rem 0.75rem", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-hover)",
              color: "var(--text-primary)", fontSize: "0.8125rem",
            }}
          />
          <button onClick={() => void activate()} disabled={busy || !pass.trim()} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.45rem 1rem", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "#fff",
            cursor: busy || !pass.trim() ? "default" : "pointer",
            opacity: busy || !pass.trim() ? 0.6 : 1,
            fontSize: "0.8125rem", fontWeight: 600,
          }}>
            <Cloud size={14} /> Activar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => void syncNow()} disabled={busy} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.45rem 1rem", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-hover)", color: "var(--text-primary)",
            cursor: busy ? "default" : "pointer", fontSize: "0.8125rem", fontWeight: 600,
          }}>
            <RefreshCw size={14} className={busy ? "spin" : undefined} /> Sincronizar ahora
          </button>
          <button onClick={deactivate} disabled={busy} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.45rem 1rem", borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)",
            color: "var(--red)", cursor: busy ? "default" : "pointer",
            fontSize: "0.8125rem", fontWeight: 600,
          }}>
            <CloudOff size={14} /> Desactivar
          </button>
        </div>
      )}

      {msg && (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", fontSize: "0.75rem", color: msgColor }}>
          {msg.kind === "ok" ? <Check size={13} style={{ marginTop: 1, flexShrink: 0 }} /> : <AlertCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />}
          <span style={{ lineHeight: 1.5 }}>{msg.text}</span>
        </div>
      )}

      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
        Usa la misma clave en todos tus dispositivos. Quien tenga la clave puede ver tus datos, así que elige una larga y privada.
      </div>
    </div>
  )
}
