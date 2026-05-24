import { OptionTrade } from "./data"

// Today's fixed date for demo purposes
export const TODAY = "2026-05-24"

// ── Number formatting ──────────────────────────────────────────────────────

/** Format number in Spanish style: period as thousands sep, comma as decimal */
export function fmtNumber(n: number, decimals = 2): string {
  const [intPart, decPart] = Math.abs(n).toFixed(decimals).split(".")
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return decPart !== undefined ? `${intFormatted},${decPart}` : intFormatted
}

/** Format as dollar amount with sign */
export function fmtDollar(n: number, decimals = 2): string {
  const sign = n >= 0 ? "+" : "-"
  return `${sign}$${fmtNumber(Math.abs(n), decimals)}`
}

/** Format as dollar amount without sign */
export function fmtDollarAbs(n: number, decimals = 2): string {
  return `$${fmtNumber(Math.abs(n), decimals)}`
}

// ── Date utilities ──────────────────────────────────────────────────────────

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function dateDiffDays(a: string, b: string): number {
  const da = parseDate(a)
  const db = parseDate(b)
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

/** Days remaining to expiration from today */
export function dteRemaining(expiration: string): number {
  return Math.max(0, dateDiffDays(TODAY, expiration))
}

/** DTE progress bar fill (elapsed / total) */
export function dteProgress(trade: OptionTrade): number {
  const remaining = dteRemaining(trade.expiration)
  if (trade.dteTotalAtOpen === 0) return 1
  return Math.min(1, Math.max(0, (trade.dteTotalAtOpen - remaining) / trade.dteTotalAtOpen))
}

/** % Prima Capturada = (premium - currentPrice) / premium × 100 */
export function pctPrimaCap(trade: OptionTrade): number {
  if (trade.status === "closed" && trade.closePrice !== undefined) {
    return ((trade.premium - trade.closePrice) / trade.premium) * 100
  }
  return ((trade.premium - trade.currentPrice) / trade.premium) * 100
}

/** Unrealized P&L for open position */
export function unrealizedPnl(trade: OptionTrade): number {
  if (trade.status !== "open") return 0
  return (trade.premium - trade.currentPrice) * trade.qty * 100
}

/** Realized P&L for closed position */
export function realizedPnl(trade: OptionTrade): number {
  if (trade.status !== "closed" || trade.closePrice === undefined) return 0
  return (trade.premium - trade.closePrice) * trade.qty * 100
}

/** Total P&L for a trade (realized if closed, unrealized if open) */
export function tradePnl(trade: OptionTrade): number {
  if (trade.status === "closed") return realizedPnl(trade)
  return unrealizedPnl(trade)
}

// ── Aggregate calculations ──────────────────────────────────────────────────

export type TradeOutcome = "W" | "BE" | "L"

export function tradeOutcome(trade: OptionTrade): TradeOutcome {
  if (trade.status !== "closed") return "BE"
  const pnl = realizedPnl(trade)
  if (pnl > 1) return "W"
  if (pnl < -1) return "L"
  return "BE"
}

export interface PeriodStats {
  totalPnl: number
  tradeCount: number
  wins: number
  breakevens: number
  losses: number
  winRate: number
  totalGains: number
  totalLosses: number
  profitFactor: number
  openCredit: number
}

export function calcStats(tradesToAnalyze: OptionTrade[]): PeriodStats {
  let totalPnl = 0
  let wins = 0
  let breakevens = 0
  let losses = 0
  let totalGains = 0
  let totalLosses = 0
  let openCredit = 0

  for (const t of tradesToAnalyze) {
    const pnl = tradePnl(t)
    totalPnl += pnl

    if (t.status === "closed") {
      const outcome = tradeOutcome(t)
      if (outcome === "W") { wins++; totalGains += pnl }
      else if (outcome === "L") { losses++; totalLosses += Math.abs(pnl) }
      else breakevens++
    }

    if (t.status === "open") {
      openCredit += t.currentPrice * t.qty * 100
    }
  }

  const closedCount = tradesToAnalyze.filter(t => t.status === "closed").length
  const winRate = closedCount > 0 ? (wins / closedCount) * 100 : 0
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 999 : 1

  return {
    totalPnl,
    tradeCount: tradesToAnalyze.length,
    wins,
    breakevens,
    losses,
    winRate,
    totalGains,
    totalLosses,
    profitFactor,
    openCredit,
  }
}

// ── Calendar utilities ────────────────────────────────────────────────────

export interface DayData {
  date: string
  pnl: number
  tradeCount: number
}

export function getDayData(tradesToAnalyze: OptionTrade[], year: number, month: number): Map<string, DayData> {
  const map = new Map<string, DayData>()
  for (const t of tradesToAnalyze) {
    const [ty, tm] = t.date.split("-").map(Number)
    if (ty === year && tm === month) {
      const existing = map.get(t.date)
      const pnl = tradePnl(t)
      if (existing) {
        existing.pnl += pnl
        existing.tradeCount++
      } else {
        map.set(t.date, { date: t.date, pnl, tradeCount: 1 })
      }
    }
  }
  return map
}

export function getWeeksInMonth(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Find first Monday on or before the 1st
  const startDow = firstDay.getDay() // 0=Sun, 1=Mon...
  const offset = startDow === 0 ? -6 : 1 - startDow
  const start = new Date(firstDay)
  start.setDate(start.getDate() + offset)

  const weeks: Date[][] = []
  const current = new Date(start)

  while (current <= lastDay || weeks.length === 0) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
    if (current > lastDay && weeks.length >= 4) break
  }

  return weeks
}

export function dateToString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// ── Ticker stats ──────────────────────────────────────────────────────────

export interface TickerStat {
  ticker: string
  pnl: number
  tradeCount: number
}

export function getTickerStats(tradesToAnalyze: OptionTrade[]): TickerStat[] {
  const map = new Map<string, TickerStat>()
  for (const t of tradesToAnalyze) {
    const pnl = tradePnl(t)
    const existing = map.get(t.ticker)
    if (existing) {
      existing.pnl += pnl
      existing.tradeCount++
    } else {
      map.set(t.ticker, { ticker: t.ticker, pnl, tradeCount: 1 })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.pnl - a.pnl)
}

// ── Filter helpers ────────────────────────────────────────────────────────

export type PeriodKey = "mes" | "anio" | "todo"

export function filterByPeriod(allTrades: OptionTrade[], period: PeriodKey): OptionTrade[] {
  if (period === "todo") return allTrades
  const [ty, tm] = TODAY.split("-").map(Number)
  if (period === "mes") {
    return allTrades.filter(t => {
      const [ry, rm] = t.date.split("-").map(Number)
      return ry === ty && rm === tm
    })
  }
  // anio
  return allTrades.filter(t => t.date.startsWith(String(ty)))
}

export function filterByMonth(allTrades: OptionTrade[], year: number, month: number): OptionTrade[] {
  const ym = `${year}-${String(month).padStart(2, "0")}`
  return allTrades.filter(t => t.date.startsWith(ym))
}

export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
