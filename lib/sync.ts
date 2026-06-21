// Cross-device sync for everything the user imports.
//
// All imported data (option trades, dividends, stock transactions, raw
// executions, per-trade edits/deletions) is written to localStorage under
// "tt-*" keys, which is per-browser and therefore invisible on other devices.
// This module mirrors those keys to a small server-side store reached through
// the /api/sync route (a Vercel KV / Upstash Redis instance), so the same data
// shows up wherever the dashboard is opened.
//
// Access is scoped by a passphrase the user sets once per device: the data is
// stored under a SHA-256 hash of the passphrase, so only someone who knows it
// can read or write that account's data.
//
// When no passphrase is set — or the server has no store provisioned (the
// static GitHub Pages build has no /api at all) — every function degrades to a
// no-op and the app keeps working purely from localStorage. This layer is
// strictly additive and never breaks offline use.

// The localStorage keys mirrored to the server. Keep in sync with trade-store.ts.
const SYNCED_KEYS = [
  "tt-imported-trades",
  "tt-trade-overrides",
  "tt-deleted-trade-ids",
  "tt-imported-execs",
  "tt-imported-divs",
  "tt-imported-stock-txns",
] as const

const PASS_KEY = "tt-sync-pass"
const UPDATED_KEY = "tt-sync-updated-at"

export function getPassphrase(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PASS_KEY)
}

export function setPassphrase(p: string | null): void {
  if (typeof window === "undefined") return
  if (p && p.trim()) localStorage.setItem(PASS_KEY, p.trim())
  else localStorage.removeItem(PASS_KEY)
}

export function isSyncEnabled(): boolean {
  return !!getPassphrase()
}

/** SHA-256 of the passphrase → the per-account storage key. */
async function accountKey(pass: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tt-sync:" + pass))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

interface Payload {
  keys: Record<string, string | null>
  updatedAt: number
}

function snapshot(): Record<string, string | null> {
  const keys: Record<string, string | null> = {}
  for (const k of SYNCED_KEYS) keys[k] = localStorage.getItem(k)
  return keys
}

function restore(keys: Record<string, string | null>): void {
  for (const k of SYNCED_KEYS) {
    const v = keys[k]
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Called after any local mutation. Bumps the local clock immediately (so a
 * concurrent pull treats this device as the newest) and schedules a debounced
 * push to the server. No-op when sync is disabled.
 */
export function scheduleSyncPush(): void {
  if (typeof window === "undefined" || !isSyncEnabled()) return
  localStorage.setItem(UPDATED_KEY, String(Date.now()))
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => { void pushNow() }, 800)
}

async function pushNow(): Promise<void> {
  const pass = getPassphrase()
  if (!pass) return
  try {
    const key = await accountKey(pass)
    const updatedAt = Number(localStorage.getItem(UPDATED_KEY)) || Date.now()
    const payload: Payload = { keys: snapshot(), updatedAt }
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data: payload }),
    })
  } catch {
    /* offline → will resync on the next save or page visit */
  }
}

export type PullStatus = "disabled" | "unconfigured" | "error" | "applied" | "uptodate" | "pushed"

/**
 * Pulls the server copy and reconciles with local data by last-write-wins:
 * if the server is newer it overwrites local (and notifies listeners); if local
 * is newer (or the server is empty) it pushes local up.
 */
export async function syncPull(): Promise<PullStatus> {
  if (typeof window === "undefined") return "disabled"
  const pass = getPassphrase()
  if (!pass) return "disabled"
  try {
    const key = await accountKey(pass)
    const res = await fetch(`/api/sync?key=${key}`, { cache: "no-store" })
    if (res.status === 501) return "unconfigured"
    if (!res.ok) return "error"
    const body = await res.json()
    const remote = body?.data as Payload | null
    const localUpdated = Number(localStorage.getItem(UPDATED_KEY)) || 0

    if (!remote) {
      // Nothing stored server-side yet → seed it from whatever is local.
      if (localUpdated === 0) localStorage.setItem(UPDATED_KEY, String(Date.now()))
      await pushNow()
      return "pushed"
    }
    if (remote.updatedAt > localUpdated) {
      restore(remote.keys)
      localStorage.setItem(UPDATED_KEY, String(remote.updatedAt))
      // Same-document setItem doesn't fire "storage"; dispatch manually so the
      // pages that listen for it re-read their data.
      window.dispatchEvent(new StorageEvent("storage"))
      return "applied"
    }
    if (localUpdated > remote.updatedAt) {
      await pushNow()
      return "pushed"
    }
    return "uptodate"
  } catch {
    return "error"
  }
}
