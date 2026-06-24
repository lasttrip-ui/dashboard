// Seed history for Cartera de LastTrip — real IBKR option trades only.
// All trades are SELL entries (premium collection / theta decay strategy)

export interface OptionTrade {
  id: string
  date: string
  ticker: string
  type: "Put" | "Call"
  action: "SELL"
  qty: number
  premium: number
  expiration: string
  dteTotalAtOpen: number
  currentPrice: number
  closePrice?: number
  status: "open" | "closed"
  strategy?: string
}

export const trades: OptionTrade[] = [
  // ── 2024 – Operaciones reales IBKR ────────────────────────────────────────
  // Primeras opciones: covered calls sobre posiciones en cartera
  { id: "h24_01", date: "2024-05-02", ticker: "EVA",  type: "Call", action: "SELL", qty: 1, premium: 0.10, expiration: "2024-07-19", dteTotalAtOpen: 78,  currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "h24_02", date: "2024-06-05", ticker: "EVA",  type: "Call", action: "SELL", qty: 2, premium: 0.20, expiration: "2024-12-20", dteTotalAtOpen: 198, currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_03", date: "2024-06-10", ticker: "EVA",  type: "Call", action: "SELL", qty: 1, premium: 0.20, expiration: "2025-01-17", dteTotalAtOpen: 221, currentPrice: 0, closePrice: 0.11, status: "closed" },
  { id: "h24_04", date: "2024-07-05", ticker: "WBX",  type: "Call", action: "SELL", qty: 1, premium: 0.05, expiration: "2024-12-20", dteTotalAtOpen: 168, currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_05", date: "2024-07-11", ticker: "TUYA", type: "Call", action: "SELL", qty: 1, premium: 0.17, expiration: "2024-12-20", dteTotalAtOpen: 162, currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_06", date: "2024-10-02", ticker: "OPEN", type: "Put",  action: "SELL", qty: 1, premium: 0.39, expiration: "2027-01-15", dteTotalAtOpen: 836, currentPrice: 0.32, status: "open" },
  { id: "h24_07", date: "2024-10-25", ticker: "TUYA", type: "Call", action: "SELL", qty: 1, premium: 0.20, expiration: "2025-03-21", dteTotalAtOpen: 147, currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_08", date: "2024-10-29", ticker: "ACHR", type: "Put",  action: "SELL", qty: 1, premium: 0.22, expiration: "2024-12-20", dteTotalAtOpen: 52,  currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_09", date: "2024-11-04", ticker: "GSAT", type: "Put",  action: "SELL", qty: 1, premium: 0.15, expiration: "2024-12-20", dteTotalAtOpen: 46,  currentPrice: 0, closePrice: 0,    status: "closed" },
  // ZETA – gran pérdida por put corta (el mercado cayó rápido)
  { id: "h24_10", date: "2024-11-06", ticker: "ZETA", type: "Put",  action: "SELL", qty: 1, premium: 1.13, expiration: "2024-11-15", dteTotalAtOpen: 9,   currentPrice: 0, closePrice: 7.42, status: "closed" },
  // Roll-down tras la pérdida
  { id: "h24_11", date: "2024-11-14", ticker: "ZETA", type: "Put",  action: "SELL", qty: 1, premium: 1.37, expiration: "2024-12-20", dteTotalAtOpen: 36,  currentPrice: 0, closePrice: 1.35, status: "closed" },
  { id: "h24_12", date: "2024-11-14", ticker: "ZETA", type: "Put",  action: "SELL", qty: 1, premium: 7.95, expiration: "2024-12-20", dteTotalAtOpen: 36,  currentPrice: 0, closePrice: 7.95, status: "closed" },
  { id: "h24_13", date: "2024-11-20", ticker: "ZETA", type: "Put",  action: "SELL", qty: 1, premium: 1.26, expiration: "2024-12-20", dteTotalAtOpen: 30,  currentPrice: 0, closePrice: 1.26, status: "closed" },
  { id: "h24_14", date: "2024-12-02", ticker: "ACHR", type: "Put",  action: "SELL", qty: 1, premium: 0.52, expiration: "2024-12-13", dteTotalAtOpen: 11,  currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_15", date: "2024-12-05", ticker: "ACHR", type: "Put",  action: "SELL", qty: 1, premium: 0.27, expiration: "2024-12-13", dteTotalAtOpen: 8,   currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_16", date: "2024-12-18", ticker: "SOUN", type: "Put",  action: "SELL", qty: 1, premium: 0.13, expiration: "2024-12-20", dteTotalAtOpen: 2,   currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_17", date: "2024-12-20", ticker: "ZETA", type: "Call", action: "SELL", qty: 1, premium: 5.93, expiration: "2027-01-15", dteTotalAtOpen: 757, currentPrice: 3.20, status: "open" },
  { id: "h24_18", date: "2024-12-23", ticker: "ZETA", type: "Call", action: "SELL", qty: 1, premium: 3.10, expiration: "2025-06-20", dteTotalAtOpen: 179, currentPrice: 0, closePrice: 0.30, status: "closed" },
  { id: "h24_19", date: "2024-12-23", ticker: "ACHR", type: "Put",  action: "SELL", qty: 1, premium: 0.32, expiration: "2025-01-17", dteTotalAtOpen: 25,  currentPrice: 0, closePrice: 0.15, status: "closed" },
  { id: "h24_20", date: "2024-12-23", ticker: "PFE",  type: "Call", action: "SELL", qty: 1, premium: 0.41, expiration: "2025-01-17", dteTotalAtOpen: 25,  currentPrice: 0, closePrice: 0.31, status: "closed" },
  { id: "h24_21", date: "2024-12-23", ticker: "TUYA", type: "Call", action: "SELL", qty: 1, premium: 0.11, expiration: "2025-03-21", dteTotalAtOpen: 88,  currentPrice: 0, closePrice: 0,    status: "closed" },
  { id: "h24_22", date: "2024-12-24", ticker: "VERI", type: "Put",  action: "SELL", qty: 1, premium: 0.99, expiration: "2025-08-15", dteTotalAtOpen: 234, currentPrice: 0, closePrice: 0.50, status: "closed" },
  { id: "h24_23", date: "2024-12-24", ticker: "ACHR", type: "Put",  action: "SELL", qty: 1, premium: 2.59, expiration: "2027-01-15", dteTotalAtOpen: 752, currentPrice: 2.10, status: "open" },
  { id: "h24_24", date: "2024-12-27", ticker: "WBX",  type: "Call", action: "SELL", qty: 1, premium: 0.10, expiration: "2025-06-20", dteTotalAtOpen: 175, currentPrice: 0, closePrice: 0,    status: "closed" },
  // (Trades de enero-mayo 2026 sin datos reales todavía — importa tu extracto
  // IBKR de ese periodo vía IB Flex Query en /importar para rellenar el hueco.)
  // June 2026 — trades reales de IBKR
  { id: "r001", date: "2026-06-01", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 9.25,  expiration: "2026-06-06", dteTotalAtOpen: 5,  currentPrice: 0, closePrice: 8.42,  status: "closed" },
  { id: "r002", date: "2026-06-02", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 8.70,  expiration: "2026-06-06", dteTotalAtOpen: 4,  currentPrice: 0, closePrice: 8.07,  status: "closed" },
  { id: "r003", date: "2026-06-04", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 37.75, expiration: "2026-06-06", dteTotalAtOpen: 2,  currentPrice: 0, closePrice: 37.57, status: "closed" },
  { id: "r004", date: "2026-06-04", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 7.48,  expiration: "2026-06-06", dteTotalAtOpen: 2,  currentPrice: 0, closePrice: 7.15,  status: "closed" },
  { id: "r005", date: "2026-06-04", ticker: "SPX",  type: "Call", action: "SELL", qty: 1, premium: 6.55,  expiration: "2026-06-06", dteTotalAtOpen: 2,  currentPrice: 0, closePrice: 5.37,  status: "closed" },
  { id: "r006", date: "2026-06-04", ticker: "SPX",  type: "Call", action: "SELL", qty: 1, premium: 1.87,  expiration: "2026-06-06", dteTotalAtOpen: 2,  currentPrice: 0, closePrice: 1.10,  status: "closed" },
  { id: "r007", date: "2026-06-04", ticker: "CELH", type: "Put",  action: "SELL", qty: 1, premium: 0.63,  expiration: "2026-06-20", dteTotalAtOpen: 16, currentPrice: 0, closePrice: 0.42,  status: "closed" },
  { id: "r008", date: "2026-06-04", ticker: "NU",   type: "Put",  action: "SELL", qty: 1, premium: 1.02,  expiration: "2026-06-20", dteTotalAtOpen: 16, currentPrice: 0, closePrice: 1.77,  status: "closed" },
  { id: "r009", date: "2026-06-04", ticker: "PLTR", type: "Put",  action: "SELL", qty: 1, premium: 5.34,  expiration: "2026-06-12", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 9.07,  status: "closed" },
  { id: "r010", date: "2026-06-04", ticker: "ASPI", type: "Call", action: "SELL", qty: 1, premium: 0.66,  expiration: "2026-06-12", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 0.85,  status: "closed" },
  { id: "r011", date: "2026-06-05", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 23.22, expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 22.39, status: "closed" },
  { id: "r012", date: "2026-06-05", ticker: "SPX",  type: "Put",  action: "SELL", qty: 1, premium: 24.00, expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 22.77, status: "closed" },
  { id: "r013", date: "2026-06-05", ticker: "SPX",  type: "Call", action: "SELL", qty: 1, premium: 24.00, expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 22.21, status: "closed" },
  { id: "r014", date: "2026-06-05", ticker: "ASTS", type: "Put",  action: "SELL", qty: 1, premium: 15.25, expiration: "2026-08-21", dteTotalAtOpen: 77, currentPrice: 0, closePrice: 2.32,  status: "closed" },
  { id: "r015", date: "2026-06-05", ticker: "ZIM",  type: "Put",  action: "SELL", qty: 1, premium: 1.25,  expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 0.20,  status: "closed" },
  { id: "r016", date: "2026-06-05", ticker: "SOFI", type: "Put",  action: "SELL", qty: 1, premium: 0.22,  expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 0.02,  status: "closed" },
  { id: "r017", date: "2026-06-05", ticker: "EOSE", type: "Put",  action: "SELL", qty: 1, premium: 1.06,  expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 1.62,  status: "closed" },
  { id: "r018", date: "2026-06-05", ticker: "ISRG", type: "Call", action: "SELL", qty: 1, premium: 5.71,  expiration: "2026-06-13", dteTotalAtOpen: 8,  currentPrice: 0, closePrice: 5.88,  status: "closed" },
  { id: "r019", date: "2026-06-05", ticker: "ZETA", type: "Put",  action: "SELL", qty: 1, premium: 2.48,  expiration: "2026-06-20", dteTotalAtOpen: 15, currentPrice: 0, closePrice: 3.79,  status: "closed" },
  { id: "r020", date: "2026-06-05", ticker: "ASTS", type: "Put",  action: "SELL", qty: 1, premium: 22.02, expiration: "2026-09-18", dteTotalAtOpen: 105,currentPrice: 0, closePrice: 35.75, status: "closed" },
]

// Real monthly Portfolio NAV (EUR) — datos reales de extractos IBKR 2021-2026
export const navHistoryData = [
  { date: "2021-12", nav: 100    },
  { date: "2022-12", nav: 70     },
  { date: "2023-12", nav: 731    },
  { date: "2024-03", nav: 2920   },
  { date: "2024-06", nav: 5100   },
  { date: "2024-09", nav: 7900   },
  { date: "2024-12", nav: 10860  },
  { date: "2025-01", nav: 11463  },
  { date: "2025-02", nav: 12732  },
  { date: "2025-03", nav: 16155  },
  { date: "2025-04", nav: 17028  },
  { date: "2025-05", nav: 17729  },
  { date: "2025-06", nav: 18653  },
  { date: "2025-07", nav: 21699  },
  { date: "2025-08", nav: 25190  },
  { date: "2025-09", nav: 25705  },
  { date: "2025-10", nav: 26805  },
  { date: "2025-11", nav: 28408  },
  { date: "2025-12", nav: 30679  },
  { date: "2026-06", nav: 36236  },
]
