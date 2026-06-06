"use client"

import { useEffect, useState } from "react"
import { trades as baseTrades } from "@/lib/data"
import { loadImported, mergeImported } from "@/lib/trade-store"
import type { OptionTrade } from "@/lib/data"

export function useAllTrades(): OptionTrade[] {
  const [all, setAll] = useState<OptionTrade[]>(baseTrades)

  useEffect(() => {
    const imported = loadImported()
    if (imported.length > 0) {
      setAll(mergeImported(baseTrades, imported))
    }
  }, [])

  // Listen for storage changes (import page saves → other tabs update)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "tt-imported-trades") {
        const imported = loadImported()
        setAll(mergeImported(baseTrades, imported))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return all
}
