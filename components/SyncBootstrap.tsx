"use client"

import { useEffect } from "react"
import { syncPull } from "@/lib/sync"

// How often to re-check the server for changes made on other devices while the
// app stays open. Pulls are cheap (one GET, last-write-wins) and no-op when
// sync is disabled.
const POLL_MS = 60_000

/**
 * Keeps imported data in sync with the server automatically, with no manual
 * action:
 *  - on app load,
 *  - whenever the tab/app regains focus or becomes visible again,
 *  - when the network reconnects,
 *  - and periodically while open.
 *
 * Pushes happen separately, right after each local change (see lib/sync.ts).
 * Renders nothing.
 */
export default function SyncBootstrap() {
  useEffect(() => {
    void syncPull()

    const pull = () => { void syncPull() }
    const onVisible = () => { if (document.visibilityState === "visible") pull() }

    window.addEventListener("focus", pull)
    window.addEventListener("online", pull)
    document.addEventListener("visibilitychange", onVisible)
    const id = setInterval(pull, POLL_MS)

    return () => {
      window.removeEventListener("focus", pull)
      window.removeEventListener("online", pull)
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(id)
    }
  }, [])
  return null
}
