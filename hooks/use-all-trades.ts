"use client"

import { useEffect, useState } from "react"
import { trades as baseTrades } from "@/lib/data"
import { loadImported, mergeImported, applyOverridesAndDeletions } from "@/lib/trade-store"
import type { OptionTrade } from "@/lib/data"

function buildAll(): OptionTrade[] {
  const imported = loadImported()
  const merged = imported.length > 0 ? mergeImported(baseTrades, imported) : baseTrades
  return applyOverridesAndDeletions(merged)
}

export function useAllTrades(): OptionTrade[] {
  const [all, setAll] = useState<OptionTrade[]>(baseTrades)

  useEffect(() => {
    setAll(buildAll())
  }, [])

  // Listen for storage changes (import page saves → other tabs update)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key || ["tt-imported-trades", "tt-trade-overrides", "tt-deleted-trade-ids"].includes(e.key)) {
        setAll(buildAll())
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return all
}
