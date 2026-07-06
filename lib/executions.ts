import type { Trade as IBKRTrade } from "@/components/portfolio/types"

// Single source of truth for IBKR executions: the repo-synced history
// (daily Flex Query automation) merged with executions imported by the user
// in this browser (Importar → tt-imported-execs).
//
// Imported executions carry synthetic ids (imp_<date>_<symbol>_<n>) that never
// match the real Flex tradeIDs, so cross-source dedupe uses a content
// fingerprint instead. realizedPnl is included to keep two same-day
// expirations of different contracts on the same underlying apart.
function fingerprint(e: IBKRTrade): string {
  return [
    e.tradeTime.slice(0, 10),
    e.symbol,
    e.secType,
    e.side,
    e.size.toFixed(4),
    e.price.toFixed(4),
    (e.realizedPnl || 0).toFixed(2),
  ].join("|")
}

export function mergeExecutions(base: IBKRTrade[], imported: IBKRTrade[]): IBKRTrade[] {
  const ids = new Set(base.map(e => e.tradeId))
  const prints = new Set(base.map(fingerprint))
  const merged = [...base]
  for (const e of imported) {
    if (ids.has(e.tradeId)) continue
    const fp = fingerprint(e)
    if (prints.has(fp)) continue
    ids.add(e.tradeId)
    prints.add(fp)
    merged.push(e)
  }
  return merged.sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))
}

export async function loadMergedExecutions(): Promise<IBKRTrade[]> {
  let base: IBKRTrade[] = []
  try {
    const r = await fetch("/data/executions-history.json")
    if (r.ok) {
      const d = await r.json()
      if (Array.isArray(d)) base = d
    }
  } catch { /* offline / first load */ }

  let imported: IBKRTrade[] = []
  try {
    const raw = localStorage.getItem("tt-imported-execs")
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) imported = parsed
  } catch { /* ignore corrupt localStorage */ }

  return mergeExecutions(base, imported)
}
