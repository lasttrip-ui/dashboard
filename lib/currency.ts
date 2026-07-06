// Option premiums and trade P&L across the app are denominated in USD (US
// option contracts). The account base currency is EUR, so these figures are
// displayed converted at a fixed approximate rate — exact intraday FX rates
// aren't tracked and the data spans several years, so a single rate keeps the
// whole app internally consistent.
export const USD_TO_EUR = 0.92

export function usdToEur(n: number): number {
  return n * USD_TO_EUR
}

// Approximate fixed rates to EUR for the other currencies that appear in
// IBKR/DeGiro statements. Same rationale as USD_TO_EUR: a stable rate keeps
// historical aggregates internally consistent without a live FX feed.
const TO_EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: USD_TO_EUR,
  GBP: 1.17,
  GBX: 0.0117, // pence sterling
  HKD: 0.118,  // pegged ~7.8/USD
  CHF: 1.05,
  CAD: 0.67,
  JPY: 0.0061,
}

/** Convert an amount in any supported currency to EUR (unknown → treated as USD). */
export function toEur(amount: number, currency: string): number {
  const rate = TO_EUR_RATES[currency?.toUpperCase?.() ?? "USD"]
  return amount * (rate ?? USD_TO_EUR)
}
