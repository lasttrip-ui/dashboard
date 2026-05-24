export type OptionType = "Put" | "Call"
export type TradeStatus = "open" | "closed"

export interface OptionTrade {
  id: string
  date: string
  ticker: string
  type: OptionType
  action: "SELL"
  qty: number
  premium: number
  expiration: string
  dteTotalAtOpen: number
  strike: number
  currentPrice: number
  closePrice?: number
  status: TradeStatus
}

export const TRADES: OptionTrade[] = [
  // January 2026 trades (all closed)
  { id: "t001", date: "2026-01-05", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.85, expiration: "2026-01-17", dteTotalAtOpen: 12, strike: 575, currentPrice: 0, closePrice: 0.15, status: "closed" },
  { id: "t002", date: "2026-01-05", ticker: "QQQ", type: "Put", action: "SELL", qty: 3, premium: 2.10, expiration: "2026-01-17", dteTotalAtOpen: 12, strike: 495, currentPrice: 0, closePrice: 0.20, status: "closed" },
  { id: "t003", date: "2026-01-06", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 3.50, expiration: "2026-01-17", dteTotalAtOpen: 11, strike: 620, currentPrice: 0, closePrice: 0.30, status: "closed" },
  { id: "t004", date: "2026-01-07", ticker: "SPY", type: "Call", action: "SELL", qty: 4, premium: 1.45, expiration: "2026-01-24", dteTotalAtOpen: 17, strike: 592, currentPrice: 0, closePrice: 0.10, status: "closed" },
  { id: "t005", date: "2026-01-07", ticker: "PYPL", type: "Put", action: "SELL", qty: 5, premium: 1.20, expiration: "2026-01-17", dteTotalAtOpen: 10, strike: 75, currentPrice: 0, closePrice: 0.08, status: "closed" },
  { id: "t006", date: "2026-01-08", ticker: "QQQ", type: "Call", action: "SELL", qty: 2, premium: 2.80, expiration: "2026-01-24", dteTotalAtOpen: 16, strike: 512, currentPrice: 0, closePrice: 2.95, status: "closed" },
  { id: "t007", date: "2026-01-09", ticker: "HOOD", type: "Put", action: "SELL", qty: 10, premium: 0.45, expiration: "2026-01-17", dteTotalAtOpen: 8, strike: 38, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t008", date: "2026-01-10", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 2.20, expiration: "2026-01-31", dteTotalAtOpen: 21, strike: 570, currentPrice: 0, closePrice: 0.18, status: "closed" },
  { id: "t009", date: "2026-01-12", ticker: "META", type: "Put", action: "SELL", qty: 2, premium: 4.80, expiration: "2026-01-31", dteTotalAtOpen: 19, strike: 580, currentPrice: 0, closePrice: 0.35, status: "closed" },
  { id: "t010", date: "2026-01-13", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 1.65, expiration: "2026-01-24", dteTotalAtOpen: 11, strike: 488, currentPrice: 0, closePrice: 0.12, status: "closed" },
  { id: "t011", date: "2026-01-14", ticker: "ZETA", type: "Put", action: "SELL", qty: 8, premium: 0.85, expiration: "2026-01-24", dteTotalAtOpen: 10, strike: 22, currentPrice: 0, closePrice: 0.06, status: "closed" },
  { id: "t012", date: "2026-01-15", ticker: "SPY", type: "Call", action: "SELL", qty: 3, premium: 1.90, expiration: "2026-01-31", dteTotalAtOpen: 16, strike: 595, currentPrice: 0, closePrice: 0.15, status: "closed" },
  { id: "t013", date: "2026-01-16", ticker: "ASTS", type: "Put", action: "SELL", qty: 5, premium: 1.10, expiration: "2026-01-31", dteTotalAtOpen: 15, strike: 28, currentPrice: 0, closePrice: 1.35, status: "closed" },
  { id: "t014", date: "2026-01-19", ticker: "QQQ", type: "Put", action: "SELL", qty: 3, premium: 2.40, expiration: "2026-01-31", dteTotalAtOpen: 12, strike: 485, currentPrice: 0, closePrice: 0.20, status: "closed" },
  { id: "t015", date: "2026-01-20", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.75, expiration: "2026-02-07", dteTotalAtOpen: 18, strike: 572, currentPrice: 0, closePrice: 0.14, status: "closed" },
  { id: "t016", date: "2026-01-21", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 5.20, expiration: "2026-01-31", dteTotalAtOpen: 10, strike: 625, currentPrice: 0, closePrice: 0.40, status: "closed" },
  { id: "t017", date: "2026-01-22", ticker: "IGV", type: "Put", action: "SELL", qty: 3, premium: 2.15, expiration: "2026-02-07", dteTotalAtOpen: 16, strike: 88, currentPrice: 0, closePrice: 0.18, status: "closed" },
  { id: "t018", date: "2026-01-23", ticker: "PYPL", type: "Call", action: "SELL", qty: 4, premium: 1.30, expiration: "2026-01-31", dteTotalAtOpen: 8, strike: 84, currentPrice: 0, closePrice: 0.09, status: "closed" },
  { id: "t019", date: "2026-01-26", ticker: "SPY", type: "Put", action: "SELL", qty: 6, premium: 1.55, expiration: "2026-02-07", dteTotalAtOpen: 12, strike: 574, currentPrice: 0, closePrice: 0.11, status: "closed" },
  { id: "t020", date: "2026-01-27", ticker: "QQQ", type: "Call", action: "SELL", qty: 3, premium: 2.65, expiration: "2026-02-07", dteTotalAtOpen: 11, strike: 514, currentPrice: 0, closePrice: 0.22, status: "closed" },
  { id: "t021", date: "2026-01-28", ticker: "HOOD", type: "Call", action: "SELL", qty: 10, premium: 0.62, expiration: "2026-01-31", dteTotalAtOpen: 3, strike: 44, currentPrice: 0, closePrice: 0.04, status: "closed" },
  { id: "t022", date: "2026-01-29", ticker: "BULL", type: "Put", action: "SELL", qty: 5, premium: 0.95, expiration: "2026-02-07", dteTotalAtOpen: 9, strike: 18, currentPrice: 0, closePrice: 0.07, status: "closed" },
  { id: "t023", date: "2026-01-30", ticker: "SPY", type: "Put", action: "SELL", qty: 4, premium: 2.05, expiration: "2026-02-14", dteTotalAtOpen: 15, strike: 569, currentPrice: 0, closePrice: 0.16, status: "closed" },

  // February 2026 trades (all closed)
  { id: "t024", date: "2026-02-03", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.95, expiration: "2026-02-14", dteTotalAtOpen: 11, strike: 567, currentPrice: 0, closePrice: 0.14, status: "closed" },
  { id: "t025", date: "2026-02-03", ticker: "META", type: "Put", action: "SELL", qty: 2, premium: 6.40, expiration: "2026-02-21", dteTotalAtOpen: 18, strike: 575, currentPrice: 0, closePrice: 0.45, status: "closed" },
  { id: "t026", date: "2026-02-04", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.20, expiration: "2026-02-14", dteTotalAtOpen: 10, strike: 486, currentPrice: 0, closePrice: 0.18, status: "closed" },
  { id: "t027", date: "2026-02-05", ticker: "ASTS", type: "Call", action: "SELL", qty: 5, premium: 1.45, expiration: "2026-02-21", dteTotalAtOpen: 16, strike: 36, currentPrice: 0, closePrice: 0.12, status: "closed" },
  { id: "t028", date: "2026-02-06", ticker: "ZETA", type: "Put", action: "SELL", qty: 8, premium: 0.75, expiration: "2026-02-14", dteTotalAtOpen: 8, strike: 20, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t029", date: "2026-02-09", ticker: "SPY", type: "Call", action: "SELL", qty: 5, premium: 2.10, expiration: "2026-02-21", dteTotalAtOpen: 12, strike: 596, currentPrice: 0, closePrice: 0.17, status: "closed" },
  { id: "t030", date: "2026-02-10", ticker: "PYPL", type: "Put", action: "SELL", qty: 6, premium: 1.15, expiration: "2026-02-21", dteTotalAtOpen: 11, strike: 72, currentPrice: 0, closePrice: 0.08, status: "closed" },
  { id: "t031", date: "2026-02-11", ticker: "QQQ", type: "Put", action: "SELL", qty: 3, premium: 2.85, expiration: "2026-02-28", dteTotalAtOpen: 17, strike: 482, currentPrice: 0, closePrice: 2.90, status: "closed" },
  { id: "t032", date: "2026-02-12", ticker: "IGV", type: "Call", action: "SELL", qty: 4, premium: 1.80, expiration: "2026-02-21", dteTotalAtOpen: 9, strike: 94, currentPrice: 0, closePrice: 0.13, status: "closed" },
  { id: "t033", date: "2026-02-13", ticker: "SPY", type: "Put", action: "SELL", qty: 6, premium: 1.70, expiration: "2026-02-28", dteTotalAtOpen: 15, strike: 565, currentPrice: 0, closePrice: 0.13, status: "closed" },
  { id: "t034", date: "2026-02-17", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 7.20, expiration: "2026-02-28", dteTotalAtOpen: 11, strike: 635, currentPrice: 0, closePrice: 0.55, status: "closed" },
  { id: "t035", date: "2026-02-18", ticker: "HOOD", type: "Put", action: "SELL", qty: 10, premium: 0.52, expiration: "2026-02-28", dteTotalAtOpen: 10, strike: 36, currentPrice: 0, closePrice: 0.04, status: "closed" },
  { id: "t036", date: "2026-02-19", ticker: "OSCR", type: "Put", action: "SELL", qty: 5, premium: 0.88, expiration: "2026-02-28", dteTotalAtOpen: 9, strike: 15, currentPrice: 0, closePrice: 0.07, status: "closed" },
  { id: "t037", date: "2026-02-20", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 2.35, expiration: "2026-03-07", dteTotalAtOpen: 15, strike: 561, currentPrice: 0, closePrice: 0.19, status: "closed" },
  { id: "t038", date: "2026-02-23", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 1.95, expiration: "2026-03-07", dteTotalAtOpen: 12, strike: 478, currentPrice: 0, closePrice: 0.15, status: "closed" },
  { id: "t039", date: "2026-02-24", ticker: "BULL", type: "Put", action: "SELL", qty: 8, premium: 0.70, expiration: "2026-02-28", dteTotalAtOpen: 4, strike: 16, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t040", date: "2026-02-25", ticker: "ASPI", type: "Put", action: "SELL", qty: 6, premium: 0.55, expiration: "2026-03-07", dteTotalAtOpen: 10, strike: 8, currentPrice: 0, closePrice: 0.04, status: "closed" },
  { id: "t041", date: "2026-02-26", ticker: "SPY", type: "Call", action: "SELL", qty: 4, premium: 1.85, expiration: "2026-03-07", dteTotalAtOpen: 9, strike: 598, currentPrice: 0, closePrice: 1.92, status: "closed" },
  { id: "t042", date: "2026-02-27", ticker: "ETHA", type: "Put", action: "SELL", qty: 10, premium: 0.38, expiration: "2026-03-07", dteTotalAtOpen: 8, strike: 22, currentPrice: 0, closePrice: 0.03, status: "closed" },

  // March 2026 trades (all closed)
  { id: "t043", date: "2026-03-02", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 2.45, expiration: "2026-03-14", dteTotalAtOpen: 12, strike: 555, currentPrice: 0, closePrice: 0.20, status: "closed" },
  { id: "t044", date: "2026-03-02", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.60, expiration: "2026-03-14", dteTotalAtOpen: 12, strike: 472, currentPrice: 0, closePrice: 0.22, status: "closed" },
  { id: "t045", date: "2026-03-03", ticker: "META", type: "Put", action: "SELL", qty: 2, premium: 8.50, expiration: "2026-03-21", dteTotalAtOpen: 18, strike: 565, currentPrice: 0, closePrice: 0.65, status: "closed" },
  { id: "t046", date: "2026-03-04", ticker: "ASTS", type: "Put", action: "SELL", qty: 5, premium: 1.30, expiration: "2026-03-21", dteTotalAtOpen: 17, strike: 25, currentPrice: 0, closePrice: 0.10, status: "closed" },
  { id: "t047", date: "2026-03-05", ticker: "OMDA", type: "Put", action: "SELL", qty: 10, premium: 0.42, expiration: "2026-03-14", dteTotalAtOpen: 9, strike: 5, currentPrice: 0, closePrice: 0.03, status: "closed" },
  { id: "t048", date: "2026-03-06", ticker: "SPY", type: "Call", action: "SELL", qty: 5, premium: 1.95, expiration: "2026-03-21", dteTotalAtOpen: 15, strike: 598, currentPrice: 0, closePrice: 0.15, status: "closed" },
  { id: "t049", date: "2026-03-09", ticker: "QQQ", type: "Call", action: "SELL", qty: 3, premium: 2.70, expiration: "2026-03-21", dteTotalAtOpen: 12, strike: 508, currentPrice: 0, closePrice: 2.85, status: "closed" },
  { id: "t050", date: "2026-03-10", ticker: "PYPL", type: "Put", action: "SELL", qty: 6, premium: 1.05, expiration: "2026-03-21", dteTotalAtOpen: 11, strike: 68, currentPrice: 0, closePrice: 0.07, status: "closed" },
  { id: "t051", date: "2026-03-11", ticker: "IGV", type: "Put", action: "SELL", qty: 4, premium: 2.25, expiration: "2026-03-28", dteTotalAtOpen: 17, strike: 82, currentPrice: 0, closePrice: 0.18, status: "closed" },
  { id: "t052", date: "2026-03-12", ticker: "HOOD", type: "Put", action: "SELL", qty: 8, premium: 0.68, expiration: "2026-03-21", dteTotalAtOpen: 9, strike: 34, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t053", date: "2026-03-13", ticker: "ZETA", type: "Put", action: "SELL", qty: 10, premium: 0.58, expiration: "2026-03-21", dteTotalAtOpen: 8, strike: 18, currentPrice: 0, closePrice: 0.04, status: "closed" },
  { id: "t054", date: "2026-03-16", ticker: "SPY", type: "Put", action: "SELL", qty: 6, premium: 2.15, expiration: "2026-03-28", dteTotalAtOpen: 12, strike: 553, currentPrice: 0, closePrice: 0.17, status: "closed" },
  { id: "t055", date: "2026-03-17", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 9.20, expiration: "2026-03-28", dteTotalAtOpen: 11, strike: 642, currentPrice: 0, closePrice: 0.70, status: "closed" },
  { id: "t056", date: "2026-03-18", ticker: "BULL", type: "Put", action: "SELL", qty: 8, premium: 0.62, expiration: "2026-03-28", dteTotalAtOpen: 10, strike: 14, currentPrice: 0, closePrice: 0.04, status: "closed" },
  { id: "t057", date: "2026-03-19", ticker: "ASTS", type: "Call", action: "SELL", qty: 5, premium: 1.55, expiration: "2026-03-28", dteTotalAtOpen: 9, strike: 38, currentPrice: 0, closePrice: 0.12, status: "closed" },
  { id: "t058", date: "2026-03-20", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.40, expiration: "2026-04-17", dteTotalAtOpen: 28, strike: 469, currentPrice: 0, closePrice: 0.20, status: "closed" },
  { id: "t059", date: "2026-03-23", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.80, expiration: "2026-04-17", dteTotalAtOpen: 25, strike: 550, currentPrice: 0, closePrice: 0.14, status: "closed" },
  { id: "t060", date: "2026-03-24", ticker: "OSCR", type: "Put", action: "SELL", qty: 6, premium: 0.72, expiration: "2026-03-28", dteTotalAtOpen: 4, strike: 13, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t061", date: "2026-03-25", ticker: "ETHA", type: "Put", action: "SELL", qty: 10, premium: 0.28, expiration: "2026-03-28", dteTotalAtOpen: 3, strike: 20, currentPrice: 0, closePrice: 0.02, status: "closed" },
  { id: "t062", date: "2026-03-26", ticker: "ASPI", type: "Put", action: "SELL", qty: 8, premium: 0.48, expiration: "2026-04-04", dteTotalAtOpen: 9, strike: 7, currentPrice: 0, closePrice: 0.03, status: "closed" },
  { id: "t063", date: "2026-03-27", ticker: "PYPL", type: "Call", action: "SELL", qty: 4, premium: 1.40, expiration: "2026-04-04", dteTotalAtOpen: 8, strike: 88, currentPrice: 0, closePrice: 0.10, status: "closed" },
  { id: "t064", date: "2026-03-28", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 2.25, expiration: "2026-04-17", dteTotalAtOpen: 20, strike: 548, currentPrice: 0, closePrice: 0.18, status: "closed" },
  { id: "t065", date: "2026-03-31", ticker: "QQQ", type: "Put", action: "SELL", qty: 3, premium: 2.55, expiration: "2026-04-17", dteTotalAtOpen: 17, strike: 466, currentPrice: 0, closePrice: 0.22, status: "closed" },

  // April 2026 trades (mix of open/closed)
  { id: "t066", date: "2026-04-01", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.65, expiration: "2026-04-17", dteTotalAtOpen: 16, strike: 545, currentPrice: 0.07, status: "open" },
  { id: "t067", date: "2026-04-01", ticker: "META", type: "Put", action: "SELL", qty: 2, premium: 7.80, expiration: "2026-04-30", dteTotalAtOpen: 29, strike: 560, currentPrice: 0.45, status: "open" },
  { id: "t068", date: "2026-04-02", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.30, expiration: "2026-04-17", dteTotalAtOpen: 15, strike: 463, currentPrice: 0.09, status: "open" },
  { id: "t069", date: "2026-04-02", ticker: "ASTS", type: "Put", action: "SELL", qty: 5, premium: 1.15, expiration: "2026-04-24", dteTotalAtOpen: 22, strike: 22, currentPrice: 0.35, status: "open" },
  { id: "t070", date: "2026-04-03", ticker: "HOOD", type: "Put", action: "SELL", qty: 8, premium: 0.55, expiration: "2026-04-17", dteTotalAtOpen: 14, strike: 32, currentPrice: 0.04, status: "open" },
  { id: "t071", date: "2026-04-03", ticker: "ZETA", type: "Put", action: "SELL", qty: 10, premium: 0.48, expiration: "2026-04-17", dteTotalAtOpen: 14, strike: 16, currentPrice: 0.03, status: "open" },
  { id: "t072", date: "2026-04-04", ticker: "SPY", type: "Call", action: "SELL", qty: 4, premium: 1.75, expiration: "2026-04-24", dteTotalAtOpen: 20, strike: 592, currentPrice: 0.08, status: "open" },
  { id: "t073", date: "2026-04-04", ticker: "IGV", type: "Put", action: "SELL", qty: 3, premium: 2.05, expiration: "2026-04-30", dteTotalAtOpen: 26, strike: 78, currentPrice: 0.12, status: "open" },
  { id: "t074", date: "2026-04-07", ticker: "QQQ", type: "Call", action: "SELL", qty: 3, premium: 2.90, expiration: "2026-04-30", dteTotalAtOpen: 23, strike: 510, currentPrice: 0.18, status: "open" },
  { id: "t075", date: "2026-04-07", ticker: "PYPL", type: "Put", action: "SELL", qty: 6, premium: 0.98, expiration: "2026-04-24", dteTotalAtOpen: 17, strike: 65, currentPrice: 0.06, status: "open" },
  { id: "t076", date: "2026-04-08", ticker: "OMDA", type: "Put", action: "SELL", qty: 10, premium: 0.35, expiration: "2026-04-17", dteTotalAtOpen: 9, strike: 4, currentPrice: 0.02, status: "open" },
  { id: "t077", date: "2026-04-08", ticker: "BULL", type: "Put", action: "SELL", qty: 8, premium: 0.58, expiration: "2026-04-24", dteTotalAtOpen: 16, strike: 12, currentPrice: 0.04, status: "open" },
  { id: "t078", date: "2026-04-09", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 2.45, expiration: "2026-04-30", dteTotalAtOpen: 21, strike: 540, currentPrice: 0.14, status: "open" },
  { id: "t079", date: "2026-04-09", ticker: "ASPI", type: "Put", action: "SELL", qty: 8, premium: 0.42, expiration: "2026-04-24", dteTotalAtOpen: 15, strike: 6, currentPrice: 0.03, status: "open" },
  { id: "t080", date: "2026-04-09", ticker: "ETHA", type: "Put", action: "SELL", qty: 10, premium: 0.32, expiration: "2026-04-17", dteTotalAtOpen: 8, strike: 18, currentPrice: 0.02, status: "open" },
  { id: "t081", date: "2026-04-09", ticker: "OSCR", type: "Put", action: "SELL", qty: 6, premium: 0.65, expiration: "2026-05-01", dteTotalAtOpen: 22, strike: 11, currentPrice: 0.05, status: "open" },
  { id: "t082", date: "2026-04-09", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 11.65, expiration: "2026-05-08", dteTotalAtOpen: 29, strike: 660, currentPrice: 0.85, status: "open" },
  // A couple closed April trades
  { id: "t083", date: "2026-04-01", ticker: "ZETA", type: "Call", action: "SELL", qty: 8, premium: 0.62, expiration: "2026-04-04", dteTotalAtOpen: 3, strike: 28, currentPrice: 0, closePrice: 0.05, status: "closed" },
  { id: "t084", date: "2026-04-02", ticker: "HOOD", type: "Call", action: "SELL", qty: 10, premium: 0.45, expiration: "2026-04-04", dteTotalAtOpen: 2, strike: 42, currentPrice: 0, closePrice: 0.03, status: "closed" },
  { id: "t085", date: "2026-04-03", ticker: "BULL", type: "Call", action: "SELL", qty: 6, premium: 0.72, expiration: "2026-04-11", dteTotalAtOpen: 8, strike: 22, currentPrice: 0, closePrice: 0.06, status: "closed" },
  { id: "t086", date: "2026-04-07", ticker: "OMDA", type: "Call", action: "SELL", qty: 10, premium: 0.28, expiration: "2026-04-11", dteTotalAtOpen: 4, strike: 6, currentPrice: 0, closePrice: 0.02, status: "closed" },
  { id: "t087", date: "2026-04-08", ticker: "ASPI", type: "Call", action: "SELL", qty: 8, premium: 0.38, expiration: "2026-04-11", dteTotalAtOpen: 3, strike: 10, currentPrice: 0, closePrice: 0.03, status: "closed" },

  // May 2026 trades (open, to future expirations)
  { id: "t088", date: "2026-05-05", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.85, expiration: "2026-05-15", dteTotalAtOpen: 10, strike: 548, currentPrice: 0.55, status: "open" },
  { id: "t089", date: "2026-05-05", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.10, expiration: "2026-05-15", dteTotalAtOpen: 10, strike: 462, currentPrice: 0.68, status: "open" },
  { id: "t090", date: "2026-05-06", ticker: "META", type: "Put", action: "SELL", qty: 2, premium: 8.20, expiration: "2026-06-20", dteTotalAtOpen: 45, strike: 555, currentPrice: 5.40, status: "open" },
  { id: "t091", date: "2026-05-07", ticker: "ASTS", type: "Put", action: "SELL", qty: 5, premium: 1.05, expiration: "2026-05-15", dteTotalAtOpen: 8, strike: 20, currentPrice: 0.38, status: "open" },
  { id: "t092", date: "2026-05-08", ticker: "HOOD", type: "Put", action: "SELL", qty: 10, premium: 0.48, expiration: "2026-05-15", dteTotalAtOpen: 7, strike: 30, currentPrice: 0.15, status: "open" },
  { id: "t093", date: "2026-05-08", ticker: "IGV", type: "Put", action: "SELL", qty: 3, premium: 1.95, expiration: "2026-06-20", dteTotalAtOpen: 43, strike: 75, currentPrice: 1.20, status: "open" },
  { id: "t094", date: "2026-05-12", ticker: "SPY", type: "Call", action: "SELL", qty: 4, premium: 2.05, expiration: "2026-06-20", dteTotalAtOpen: 39, strike: 595, currentPrice: 1.35, status: "open" },
  { id: "t095", date: "2026-05-12", ticker: "PYPL", type: "Put", action: "SELL", qty: 6, premium: 0.88, expiration: "2026-05-15", dteTotalAtOpen: 3, strike: 62, currentPrice: 0.28, status: "open" },
  { id: "t096", date: "2026-05-13", ticker: "ZETA", type: "Put", action: "SELL", qty: 8, premium: 0.52, expiration: "2026-06-20", dteTotalAtOpen: 38, strike: 14, currentPrice: 0.35, status: "open" },
  { id: "t097", date: "2026-05-14", ticker: "QQQ", type: "Put", action: "SELL", qty: 4, premium: 2.25, expiration: "2026-06-20", dteTotalAtOpen: 37, strike: 458, currentPrice: 1.48, status: "open" },
  { id: "t098", date: "2026-05-15", ticker: "BULL", type: "Put", action: "SELL", qty: 8, premium: 0.55, expiration: "2026-06-20", dteTotalAtOpen: 36, strike: 10, currentPrice: 0.38, status: "open" },
  { id: "t099", date: "2026-05-19", ticker: "META", type: "Call", action: "SELL", qty: 2, premium: 10.50, expiration: "2026-06-20", dteTotalAtOpen: 32, strike: 655, currentPrice: 7.20, status: "open" },
  { id: "t100", date: "2026-05-19", ticker: "SPY", type: "Put", action: "SELL", qty: 5, premium: 1.65, expiration: "2026-06-20", dteTotalAtOpen: 32, strike: 545, currentPrice: 1.08, status: "open" },
  { id: "t101", date: "2026-05-20", ticker: "OSCR", type: "Put", action: "SELL", qty: 6, premium: 0.58, expiration: "2026-06-20", dteTotalAtOpen: 31, strike: 9, currentPrice: 0.40, status: "open" },
  { id: "t102", date: "2026-05-21", ticker: "ASPI", type: "Put", action: "SELL", qty: 8, premium: 0.38, expiration: "2026-06-20", dteTotalAtOpen: 30, strike: 5, currentPrice: 0.26, status: "open" },
  { id: "t103", date: "2026-05-22", ticker: "ETHA", type: "Put", action: "SELL", qty: 10, premium: 0.28, expiration: "2026-06-20", dteTotalAtOpen: 29, strike: 16, currentPrice: 0.19, status: "open" },
  { id: "t104", date: "2026-05-22", ticker: "OMDA", type: "Put", action: "SELL", qty: 10, premium: 0.32, expiration: "2026-06-20", dteTotalAtOpen: 29, strike: 3, currentPrice: 0.22, status: "open" },
  { id: "t105", date: "2026-05-23", ticker: "QQQ", type: "Call", action: "SELL", qty: 3, premium: 3.20, expiration: "2026-06-20", dteTotalAtOpen: 28, strike: 512, currentPrice: 2.18, status: "open" },
]

// Stats summary for display
export const SUMMARY_STATS = {
  totalTrades: 749,
  totalPnL: 10237.67,
  wins: 244,
  breakEven: 402,
  losses: 103,
  winRate: 70.3,
  profitFactor: 1.57,
  totalGains: 28260,
  totalLosses: 18022,
}

export const APRIL_STATS = {
  trades: 57,
  pnl: 1282.20,
  gains: 2862,
  losses: 1580,
  profitFactor: 1.81,
}

// Monthly cumulative P&L data for the chart
export const MONTHLY_PNL_DATA = [
  { month: "2026-01", pnl: 2145.30, cumulative: 2145.30 },
  { month: "2026-02", pnl: 2318.55, cumulative: 4463.85 },
  { month: "2026-03", pnl: 3391.62, cumulative: 7855.47 },
  { month: "2026-04", pnl: 1282.20, cumulative: 9137.67 },
  { month: "2026-05", pnl: 1100.00, cumulative: 10237.67 },
]

// April 2026 calendar data (day-level P&L)
export const APRIL_CALENDAR: Record<number, { pnl: number; trades: number }> = {
  1: { pnl: 285.40, trades: 6 },
  2: { pnl: 312.80, trades: 5 },
  3: { pnl: 198.60, trades: 4 },
  4: { pnl: 156.20, trades: 8 },
  7: { pnl: 221.50, trades: 4 },
  8: { pnl: -45.30, trades: 3 },
  9: { pnl: 153.00, trades: 17 },
}

// Tickers for April with P&L
export const APRIL_TICKERS = [
  { ticker: "QQQ", pnl: 318.40, trades: 9 },
  { ticker: "SPY", pnl: 298.60, trades: 8 },
  { ticker: "META", pnl: 245.80, trades: 3 },
  { ticker: "ASTS", pnl: 115.00, trades: 5 },
  { ticker: "BULL", pnl: 98.60, trades: 7 },
  { ticker: "HOOD", pnl: 87.50, trades: 6 },
  { ticker: "ZETA", pnl: 76.80, trades: 8 },
  { ticker: "OMDA", pnl: 65.40, trades: 5 },
  { ticker: "IGV", pnl: 56.90, trades: 3 },
  { ticker: "PYPL", pnl: 48.30, trades: 2 },
  { ticker: "OSCR", pnl: 43.20, trades: 3 },
  { ticker: "ASPI", pnl: -67.40, trades: 5 },
  { ticker: "ETHA", pnl: -30.20, trades: 2 },
  { ticker: "OMDA", pnl: 26.00, trades: 2 },
]
