import type { Trade as IBKRTrade } from "@/components/portfolio/types"

// Single source of truth for IBKR executions: the repo-synced history
// (daily Flex Query automation) merged with executions imported by the user
// in this browser (Importar → tt-imported-execs), deduped by tradeId.
export async function loadMergedExecutions(): Promise<IBKRTrade[]> {
  let base: IBKRTrade[] = []
  try {
    const r = await fetch("/data/executions-history.json")
    if (r.ok) {
      const d = await r.json()
      if (Array.isArray(d)) base = d
    }
  } catch { /* offline / first load */ }

  try {
    const raw = localStorage.getItem("tt-imported-execs")
    const imported: IBKRTrade[] = raw ? JSON.parse(raw) : []
    if (Array.isArray(imported) && imported.length > 0) {
      const ids = new Set(base.map(e => e.tradeId))
      base = [...base, ...imported.filter(e => !ids.has(e.tradeId))]
    }
  } catch { /* ignore corrupt localStorage */ }

  return base.sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))
}
