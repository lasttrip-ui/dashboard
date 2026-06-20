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
 * history: nets quantity per ISIN and uses the weighted-average buy price as
 * cost basis. Closed-out ISINs (net qty ~0) are omitted. Live market price is
 * filled in later by useLiveQuotes when the ticker is recognized.
 */
export function buildDeGiroPositions(txns: ImportedStockTransaction[]): Position[] {
  interface Acc {
    product: string
    netQty: number
    buyQty: number
    buyCost: number
    currency: string
    lastDate: string
  }
  const map = new Map<string, Acc>()

  for (const t of txns) {
    const e = map.get(t.isin) ?? { product: t.product, netQty: 0, buyQty: 0, buyCost: 0, currency: t.currency, lastDate: t.date }
    e.netQty += t.qty
    if (t.qty > 0) {
      e.buyQty += t.qty
      e.buyCost += t.qty * t.price
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
    if (Math.abs(e.netQty) < 0.0001) continue
    const averagePrice = e.buyQty > 0 ? e.buyCost / e.buyQty : 0
    positions.push({
      contractId: hashContractId(isin),
      symbol: ISIN_TICKER[isin] ?? e.product.split(/\s+/)[0],
      description: e.product,
      assetClass: "STK",
      position: e.netQty,
      marketPrice: averagePrice,
      marketValue: averagePrice * e.netQty,
      currency: e.currency,
      averagePrice,
      unrealizedPnl: 0,
    })
  }

  return positions.sort((a, b) => b.marketValue - a.marketValue)
}
