"use client"

import { useEffect, useState } from "react"
import { trades as baseTrades } from "@/lib/data"
import { loadImported, mergeImported, applyOverridesAndDeletions } from "@/lib/trade-store"
import { buildOptionTradesFromExecutions, type ExecutionRecord } from "@/lib/build-option-trades"
import type { OptionTrade } from "@/lib/data"

// Combines the real IBKR trade history (rebuilt from executions) with the
// hardcoded seed. Real trades take over for any calendar year they cover; the
// seed only survives for years IBKR data doesn't reach (e.g. 2024). Until the
// Flex updater enriches executions with contract detail, `real` is empty and
// this collapses to the original seed-only behavior.
function combine(real: OptionTrade[]): OptionTrade[] {
  const realYears = new Set(real.map(t => t.date.slice(0, 4)))
  const keptSeed = baseTrades.filter(t => !realYears.has(t.date.slice(0, 4)))
  return [...keptSeed, ...real]
}

function buildAll(real: OptionTrade[]): OptionTrade[] {
  const combined = combine(real)
  const imported = loadImported()
  const merged = imported.length > 0 ? mergeImported(combined, imported) : combined
  return applyOverridesAndDeletions(merged)
}

export function useAllTrades(): OptionTrade[] {
  const [all, setAll] = useState<OptionTrade[]>(baseTrades)
  const [real, setReal] = useState<OptionTrade[]>([])

  // Load real IBKR execution history and rebuild option trades from it
  useEffect(() => {
    let cancelled = false
    fetch("/data/executions-history.json")
      .then(r => (r.ok ? r.json() : []))
      .then((d: ExecutionRecord[]) => {
        if (cancelled || !Array.isArray(d)) return
        setReal(buildOptionTradesFromExecutions(d))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setAll(buildAll(real))
  }, [real])

  // Listen for storage changes (import page saves → other tabs update)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key || ["tt-imported-trades", "tt-trade-overrides", "tt-deleted-trade-ids"].includes(e.key)) {
        setAll(buildAll(real))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [real])

  return all
}
