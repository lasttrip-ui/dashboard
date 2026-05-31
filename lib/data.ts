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
}

export const trades: OptionTrade[] = []

export const cumulativePnlData: { date: string; pnl: number }[] = []
