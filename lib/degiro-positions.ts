import type { ImportedStockTransaction } from "./import-parser"
import type { Position } from "@/components/portfolio/types"
import { resolveTicker, ISIN_TICKER } from "./ticker-resolve"

export { ISIN_TICKER }

function hashContractId(isin: string): number {
  let h = 0
  for (let i = 0; i < isin.length; i++) h = (h * 31 + isin.charCodeAt(i)) | 0
  return -Math.abs(h) - 1 // negative range, avoids colliding with real IBKR contractIds
}

/**
 * Builds approximate current stock positions from a full DeGiro transaction
 * history, replaying it chronologically with a running weighted-average cost:
 * real buys raise shares and cost, real sells reduce both at the current
 * average (realizing P&L), and corporate actions (splits, spin-offs, mergers)
 * only rescale the share count while leaving the cost basis untouched — this
 * is what makes a 4-for-1 split divide the average cost by 4 instead of
 * treating the post-split share batch as a fresh purchase at the new price.
 * Closed-out ISINs (net qty ~0) are omitted. Live market price is filled in
 * later by useLiveQuotes when the ticker is recognized.
 */
export function buildDeGiroPositions(txns: ImportedStockTransaction[]): Position[] {
  interface Acc {
    product: string
    shares: number
    totalCost: number
    currency: string
    lastDate: string
  }
  const map = new Map<string, Acc>()

  const ordered = [...txns].sort((a, b) => a.date.localeCompare(b.date))
  for (const t of ordered) {
    const e = map.get(t.isin) ?? { product: t.product, shares: 0, totalCost: 0, currency: t.currency, lastDate: t.date }

    if (t.isCorporateAction) {
      e.shares += t.qty
    } else if (t.qty > 0) {
      e.shares += t.qty
      e.totalCost += t.qty * t.price
    } else {
      const avg = e.shares > 0 ? e.totalCost / e.shares : 0
      const sellQty = Math.min(Math.abs(t.qty), e.shares)
      e.shares -= sellQty
      e.totalCost -= avg * sellQty
      if (e.shares < 0.0001) {
        e.shares = 0
        e.totalCost = 0
      }
    }

    if (t.date >= e.lastDate) {
      e.lastDate = t.date
      e.product = t.product
      e.currency = t.currency
    }
    map.set(t.isin, e)
  }

  const positions: Position[] = []
  for (const [isin, e] of Array.from(map.entries())) {
    if (Math.abs(e.shares) < 0.0001) continue
    const averagePrice = e.shares > 0 ? e.totalCost / e.shares : 0
    positions.push({
      contractId: hashContractId(isin),
      symbol: resolveTicker(e.product, isin),
      description: e.product,
      assetClass: "STK",
      position: e.shares,
      marketPrice: averagePrice,
      marketValue: averagePrice * e.shares,
      currency: e.currency,
      averagePrice,
      unrealizedPnl: 0,
    })
  }

  return positions.sort((a, b) => b.marketValue - a.marketValue)
}
