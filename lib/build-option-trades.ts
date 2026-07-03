import type { OptionTrade } from "./data"
import { TODAY } from "./utils"

// ── Execution record shape (public/data/executions-history.json) ─────────────
// The daily Flex updater (scripts/update-ibkr-snapshot.js) writes these. Option
// executions carry the full contract detail (right/strike/expiry/openClose) so
// Operaciones/Bitácora can be rebuilt from the real trade history instead of a
// hand-written seed. Older records (pre-enrichment) lack the contract fields and
// are skipped by the builder — the hardcoded seed still covers those periods.
export interface ExecutionRecord {
  tradeId: string
  symbol: string          // underlying ticker
  secType: string         // "OPT" | "STK"
  side: "BUY" | "SELL"
  size: number
  price: number
  tradeTime: string       // ISO
  commission: number
  netAmount: number
  realizedPnl: number
  right?: "P" | "C"       // Put / Call
  strike?: number
  expiry?: string         // YYYY-MM-DD
  openClose?: "O" | "C" | ""
}

interface OpenLot {
  qty: number
  premium: number
  date: string
  tradeId: string
}

function isoDate(t: string): string {
  return (t || "").slice(0, 10)
}

function dteBetween(open: string, exp: string): number {
  const diff = new Date(exp).getTime() - new Date(open).getTime()
  return Math.max(0, Math.round(diff / 86_400_000))
}

/**
 * Rebuilds SELL-to-open option trades (premium-collection strategy) from the
 * real IBKR execution history, pairing each short-option open with its
 * buy-to-close by contract, FIFO. Positions still open at expiry are marked
 * closed at 0 (expired worthless); positions open with a future expiry stay
 * open (live price filled in later). Executions without contract detail
 * (older, pre-enrichment records) are ignored.
 */
export function buildOptionTradesFromExecutions(execs: ExecutionRecord[]): OptionTrade[] {
  // Group enriched option executions by contract
  const groups = new Map<string, ExecutionRecord[]>()
  for (const e of execs) {
    if (e.secType !== "OPT") continue
    if (!e.right || !e.expiry) continue // skip un-enriched rows
    const key = `${e.symbol}|${e.expiry}|${e.right}|${e.strike ?? ""}`
    const g = groups.get(key) ?? []
    g.push(e)
    groups.set(key, g)
  }

  const out: OptionTrade[] = []

  for (const [key, rawList] of Array.from(groups.entries())) {
    const [symbol, expiry, right] = key.split("|")
    const type: "Put" | "Call" = right === "P" ? "Put" : "Call"
    const list = [...rawList].sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))

    const openLots: OpenLot[] = []
    // Each closed OptionTrade is emitted as lots get closed; open lots flushed at end.
    for (const e of list) {
      if (e.side === "SELL") {
        // Sell-to-open a short option lot
        openLots.push({ qty: e.size, premium: e.price, date: isoDate(e.tradeTime), tradeId: e.tradeId })
      } else {
        // Buy-to-close: consume oldest open short lots FIFO
        let remaining = e.size
        while (remaining > 0 && openLots.length > 0) {
          const lot = openLots[0]
          const closedQty = Math.min(remaining, lot.qty)
          out.push({
            id: `ib_${lot.tradeId}`,
            date: lot.date,
            ticker: symbol,
            type,
            action: "SELL",
            qty: closedQty,
            premium: lot.premium,
            expiration: expiry,
            dteTotalAtOpen: dteBetween(lot.date, expiry),
            currentPrice: 0,
            closePrice: e.price,
            status: "closed",
          })
          lot.qty -= closedQty
          remaining -= closedQty
          if (lot.qty <= 0.0001) openLots.shift()
        }
        // A buy beyond open short lots would be a long-option open — not modeled
        // by the SELL-only Operaciones view, so any excess is ignored.
      }
    }

    // Flush lots still open after all executions
    for (const lot of openLots) {
      const expired = expiry < TODAY
      out.push({
        id: `ib_${lot.tradeId}`,
        date: lot.date,
        ticker: symbol,
        type,
        action: "SELL",
        qty: lot.qty,
        premium: lot.premium,
        expiration: expiry,
        dteTotalAtOpen: dteBetween(lot.date, expiry),
        currentPrice: 0,
        closePrice: expired ? 0 : undefined,
        status: expired ? "closed" : "open",
      })
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}
