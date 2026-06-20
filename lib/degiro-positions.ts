import type { ImportedStockTransaction } from "./import-parser"
import type { Position } from "@/components/portfolio/types"

// Best-effort ISIN → ticker map for live quotes (Yahoo Finance). Stocks not
// listed here still show up with their cost basis, just without a live price.
export const ISIN_TICKER: Record<string, string> = {
  US0378331005: "AAPL",
  US0231351067: "AMZN",
  US88160R1014: "TSLA",
  US30303M1027: "META",
  US4781601046: "JNJ",
  US49177J1025: "KVUE",
  US9497461015: "WFC",
  US7561091049: "O",
  US2473617023: "DAL",
  US02553E1064: "AEO",
  US92347M1009: "VERI",
  US45569U1016: "INDI",
  US83406F1021: "SOFI",
  US62914V1061: "NIO",
  US90114C1071: "TUYA",
  US8679811021: "SUNS",
  US00109K1051: "AFCG",
  US3596781092: "FLL",
  KYG651631007: "JOBY",
  IE0003LFZ4U7: "DOLE",
  US69269L1044: "OZON",
  US04962H5063: "ATOS",
  US04962H7044: "ATOS",
}

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
      symbol: ISIN_TICKER[isin] ?? e.product.split(/\s+/)[0],
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
