"use client"

import { useEffect, useMemo, useState } from "react"
import type { Position } from "@/components/portfolio/types"

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
}

/** Map an IBKR position to a Yahoo Finance symbol (null if not quotable). */
export function yahooSymbol(p: Position): string | null {
  if (p.assetClass === "STK") {
    if (p.currency === "HKD") return `${p.symbol.padStart(4, "0")}.HK`
    if (p.currency === "GBP") return `${p.symbol}.L`
    if (p.currency === "USD") return p.symbol
    return null
  }
  if (p.assetClass === "OPT" && p.currency === "USD") {
    // "ACHR Jan15'27 7 PUT" → OCC: ACHR270115P00007000
    const m = p.description.match(/^([A-Z.]+)\s+([A-Za-z]{3})(\d{1,2})'(\d{2})\s+([\d.]+)\s+(CALL|PUT)/)
    if (!m) return null
    const [, und, mon, day, yy, strike, cp] = m
    const mm = MONTHS[mon]
    if (!mm) return null
    const strikeInt = Math.round(parseFloat(strike) * 1000).toString().padStart(8, "0")
    return `${und}${yy}${mm}${day.padStart(2, "0")}${cp === "CALL" ? "C" : "P"}${strikeInt}`
  }
  return null
}

export interface LiveQuote {
  price: number
  marketValue: number
  unrealizedPnl: number
}

/**
 * Fetches live market prices for positions every `intervalMs` and returns
 * a map contractId → recalculated price / market value / unrealized P&L.
 */
export function useLiveQuotes(positions: Position[], intervalMs = 60_000) {
  const [quotes, setQuotes] = useState<Record<string, number>>({})
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const symbolMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of positions) {
      const s = yahooSymbol(p)
      if (s) map.set(p.contractId, s)
    }
    return map
  }, [positions])

  useEffect(() => {
    if (symbolMap.size === 0) return
    let cancelled = false
    const symbols = Array.from(new Set(symbolMap.values())).join(",")

    async function refresh() {
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.quotes) {
          setQuotes(data.quotes)
          setLastUpdate(data.ts)
        }
      } catch { /* network error → keep last quotes */ }
    }

    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => { cancelled = true; clearInterval(id) }
  }, [symbolMap, intervalMs])

  const live = useMemo(() => {
    const map = new Map<number, LiveQuote>()
    for (const p of positions) {
      const sym = symbolMap.get(p.contractId)
      if (!sym) continue
      let price = quotes[sym]
      if (price === undefined) continue
      // Yahoo returns LSE prices in pence
      if (sym.endsWith(".L")) price = price / 100
      const mult = p.assetClass === "OPT" ? 100 : 1
      map.set(p.contractId, {
        price,
        marketValue: price * p.position * mult,
        unrealizedPnl: (price - p.averagePrice) * p.position * mult,
      })
    }
    return map
  }, [positions, quotes, symbolMap])

  return { live, lastUpdate }
}
