// Option premiums and trade P&L across the app are denominated in USD (US
// option contracts). The account base currency is EUR, so these figures are
// displayed converted at a fixed approximate rate — exact intraday FX rates
// aren't tracked and the data spans several years, so a single rate keeps the
// whole app internally consistent.
export const USD_TO_EUR = 0.92

export function usdToEur(n: number): number {
  return n * USD_TO_EUR
}
