export interface AccountSummary {
  currency: string
  netLiquidation: number
  equityWithLoanValue?: number
  grossPositionValue: number
  totalCashValue: number
  availableFunds: number
  initialMargin: number
  maintenanceMargin: number
  excessLiquidity: number
  leverage: string
  dividends: number
  unrealizedPnl: number
  buyingPower?: number
}

export interface Balance {
  currency: string
  cashBalance: number
  netLiquidationValue: number
  stockMarketValue: number
  unrealizedPnl: number
  exchangeRate: number
}

export interface Position {
  contractId: number
  symbol: string
  description: string
  assetClass: "STK" | "OPT"
  optionType?: "C" | "P"
  expiration?: string
  strike?: number
  position: number
  marketPrice: number
  marketValue: number
  currency: string
  averagePrice: number
  unrealizedPnl: number
}

export interface Trade {
  tradeId: string
  symbol: string
  companyName?: string
  secType: string
  side: "BUY" | "SELL"
  size: number
  price: number
  tradeTime: string
  commission: number
  netAmount: number
  realizedPnl: number
  // Option contract details (present on executions synced after 2026-07)
  expiry?: string
  strike?: number
  putCall?: "P" | "C"
}

export interface IBKRSnapshot {
  lastUpdated: string
  summary: AccountSummary
  balances: Balance[]
  positions: Position[]
  recentTrades: Trade[]
}
