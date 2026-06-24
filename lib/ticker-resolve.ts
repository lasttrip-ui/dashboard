// Best-effort mapping from broker product/ISIN strings to canonical ticker
// symbols. DeGiro and IBKR statements report the legal/display name
// ("KRAFT HEINZ CO", "ARES CAPITAL CORP"), whose first word often isn't the
// real ticker (KHC, ARCC). Positions, option premiums, and dividends each
// derive a "ticker" independently — if they disagree, Bitácora's
// per-ticker grouping splits one real holding into two disconnected
// entries (one with shares/premiums, one with stray dividends, or vice
// versa). Every site that turns a broker string into a ticker must funnel
// through this same resolver so they always agree.

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

// Company-name keyword → ticker, for cases where the broker's display name's
// first word isn't the real ticker. Checked in order; first match wins.
const NAME_TICKER: Array<[string, string]> = [
  ["KRAFT HEINZ", "KHC"],
  ["ARES CAPITAL", "ARCC"],
  ["PENNANTPARK FLOATING", "PFLT"],
  ["PARK HOTELS", "PK"],
  ["B&G FOODS", "BGS"],
  ["LYONDELLBASELL", "LYB"],
  ["PFIZER", "PFE"],
  ["KENVUE", "KVUE"],
  ["DIAGEO", "DGE"],
  ["SEVEN HILLS REALTY", "SEVN"],
  ["AMERICAN EAGLE", "AEO"],
  ["AFC GAMMA", "AFCG"],
  ["SUNRISE REALTY", "SUNS"],
]

export function resolveTicker(productName: string, isin?: string): string {
  if (isin && ISIN_TICKER[isin]) return ISIN_TICKER[isin]
  const upper = productName.toUpperCase()
  for (const [needle, ticker] of NAME_TICKER) {
    if (upper.includes(needle)) return ticker
  }
  return upper.split(/\s+/)[0]
}
