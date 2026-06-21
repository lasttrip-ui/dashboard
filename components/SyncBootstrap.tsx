"use client"

import { useEffect } from "react"
import { syncPull } from "@/lib/sync"

/**
 * Pulls the server copy of imported data once on app load and reconciles it
 * with localStorage (last-write-wins). No-op when sync is disabled or the
 * server has no store provisioned. Renders nothing.
 */
export default function SyncBootstrap() {
  useEffect(() => {
    void syncPull()
  }, [])
  return null
}
