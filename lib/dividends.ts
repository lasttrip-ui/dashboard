// Dividend data per year — 2026 is hardcoded from IBKR positions.
// Historical years are populated from localStorage via the import page.

export interface DividendEntry {
  month: number  // 1-12
  company: string
  amount: number
}

export const DIVIDEND_DATA_2026: DividendEntry[] = [
  // January
  { month: 1, company: "VICI",  amount: 19.40 },
  { month: 1, company: "LYB",   amount: 27.00 },
  { month: 1, company: "MAIN",  amount: 2.33  },
  { month: 1, company: "PFLT",  amount: 1.40  },
  { month: 1, company: "AGNC",  amount: 0.43  },
  { month: 1, company: "LTC",   amount: 0.97  },
  { month: 1, company: "SUNS",  amount: 0.38  },
  { month: 1, company: "KHC",   amount: 11.63 },
  { month: 1, company: "ARCC",  amount: 11.20 },
  // February
  { month: 2, company: "MAIN",  amount: 2.33  },
  { month: 2, company: "PFLT",  amount: 1.40  },
  { month: 2, company: "AGNC",  amount: 0.43  },
  { month: 2, company: "LTC",   amount: 0.97  },
  { month: 2, company: "SUNS",  amount: 0.38  },
  { month: 2, company: "PFE",   amount: 11.75 },
  { month: 2, company: "BGS",   amount: 5.24  },
  { month: 2, company: "SEVN",  amount: 4.32  },
  { month: 2, company: "AEO",   amount: 0.71  },
  // March
  { month: 3, company: "VICI",  amount: 19.40 },
  { month: 3, company: "LYB",   amount: 27.00 },
  { month: 3, company: "ARCC",  amount: 11.20 },
  { month: 3, company: "MAIN",  amount: 2.33  },
  { month: 3, company: "PFLT",  amount: 1.40  },
  { month: 3, company: "AGNC",  amount: 0.43  },
  { month: 3, company: "LTC",   amount: 0.97  },
  { month: 3, company: "SUNS",  amount: 0.38  },
  { month: 3, company: "KHC",   amount: 11.63 },
  { month: 3, company: "AES",   amount: 9.70  },
  { month: 3, company: "KVUE",  amount: 18.20 },
  { month: 3, company: "PK",    amount: 9.70  },
  { month: 3, company: "VOC",   amount: 5.10  },
  { month: 3, company: "DGE",   amount: 15.30 },
  { month: 3, company: "AFCG",  amount: 1.44  },
  // April
  { month: 4, company: "VICI",  amount: 19.40 },
  { month: 4, company: "LYB",   amount: 27.00 },
  { month: 4, company: "PFE",   amount: 11.75 },
  { month: 4, company: "MAIN",  amount: 2.33  },
  { month: 4, company: "PFLT",  amount: 1.40  },
  { month: 4, company: "AGNC",  amount: 0.43  },
  { month: 4, company: "LTC",   amount: 0.97  },
  { month: 4, company: "SUNS",  amount: 0.38  },
  { month: 4, company: "BGS",   amount: 5.24  },
  { month: 4, company: "ARCC",  amount: 11.20 },
  { month: 4, company: "VALE",  amount: 6.40  },
  // May
  { month: 5, company: "KHC",   amount: 11.63 },
  { month: 5, company: "MAIN",  amount: 2.33  },
  { month: 5, company: "PFLT",  amount: 1.40  },
  { month: 5, company: "AGNC",  amount: 0.43  },
  { month: 5, company: "LTC",   amount: 0.97  },
  { month: 5, company: "SUNS",  amount: 0.38  },
  { month: 5, company: "SEVN",  amount: 4.32  },
  { month: 5, company: "AES",   amount: 9.70  },
  { month: 5, company: "KVUE",  amount: 18.20 },
  { month: 5, company: "PK",    amount: 9.70  },
  // June (partial)
  { month: 6, company: "VICI",  amount: 19.40 },
  { month: 6, company: "MAIN",  amount: 2.33  },
  { month: 6, company: "PFLT",  amount: 1.40  },
  { month: 6, company: "AGNC",  amount: 0.43  },
  { month: 6, company: "LTC",   amount: 0.97  },
  { month: 6, company: "PFE",   amount: 11.75 },
]

// All company names seen in 2026
export const DIVIDEND_COMPANIES = [
  "VICI", "BGS", "LYB", "PK", "ARCC", "PFE", "KVUE",
  "AES", "VOC", "MAIN", "DGE", "PFLT", "VALE", "SEVN",
  "LTC", "SUNS", "KHC", "AGNC", "AEO", "AFCG",
]

// Color per company (palette)
const PALETTE = [
  "#22c55e", "#f97316", "#3b82f6", "#a855f7", "#ec4899",
  "#06b6d4", "#84cc16", "#eab308", "#ef4444", "#8b5cf6",
  "#10b981", "#f59e0b", "#6366f1", "#14b8a6", "#fb923c",
  "#d946ef", "#0ea5e9", "#4ade80", "#facc15", "#f87171",
]

export const COMPANY_COLOR: Record<string, string> = Object.fromEntries(
  DIVIDEND_COMPANIES.map((c, i) => [c, PALETTE[i % PALETTE.length]])
)

function colorForCompany(company: string): string {
  if (COMPANY_COLOR[company]) return COMPANY_COLOR[company]
  // Deterministic color for unknown companies
  let h = 0
  for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) % PALETTE.length
  return PALETTE[h]
}

export { colorForCompany }

// ── Year-agnostic helpers ──────────────────────────────────────────────────────

export function buildMonthlyDividends(data: DividendEntry[]) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  return months.map(m => {
    const entry: Record<string, number> = { month: m }
    for (const d of data.filter(x => x.month === m)) {
      entry[d.company] = (entry[d.company] ?? 0) + d.amount
    }
    return entry
  })
}

export function buildDividendTotals(data: DividendEntry[]) {
  const totals: Record<string, number> = {}
  for (const d of data) {
    totals[d.company] = (totals[d.company] ?? 0) + d.amount
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([company, amount]) => ({ company, amount }))
}

export function buildActiveCompanies(data: DividendEntry[]): string[] {
  const seen: string[] = []
  for (const d of data) {
    if (!seen.includes(d.company)) seen.push(d.company)
  }
  return seen
}

// ── 2026 convenience exports (kept for backwards compat) ─────────────────────

export function getMonthlyDividends() {
  return buildMonthlyDividends(DIVIDEND_DATA_2026)
}

export function getDividendTotals() {
  return buildDividendTotals(DIVIDEND_DATA_2026)
}

export const TOTAL_DIVIDENDS_2026 = DIVIDEND_DATA_2026.reduce((s, d) => s + d.amount, 0)
