import type { Trade } from "./mock-data";

// ── Number formatting ───────────────────────────────────────────────────────

export function fmtCurrency(
  value: number,
  currency = "USD",
  compact = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtPct(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtPnl(value: number, currency = "USD"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${fmtCurrency(value, currency)}`;
}

// ── Date helpers ────────────────────────────────────────────────────────────

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── CSS helpers ─────────────────────────────────────────────────────────────

export function pnlColor(value: number): string {
  if (value > 0) return "text-green-DEFAULT" ;
  if (value < 0) return "text-red-DEFAULT";
  return "text-text-secondary";
}

export function pnlClass(value: number): string {
  if (value > 0) return "pnl-positive";
  if (value < 0) return "pnl-negative";
  return "";
}

// ── Trade stats ─────────────────────────────────────────────────────────────

export interface TradeStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalPnl: number;
}

export function calcStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.status === "closed" && t.pnl != null);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);

  const totalWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const avgWin = wins.length ? totalWin / wins.length : 0;
  const avgLoss = losses.length ? totalLoss / losses.length : 0;
  const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0;

  return {
    total: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgWin,
    avgLoss,
    profitFactor,
    totalPnl: closed.reduce((s, t) => s + (t.pnl ?? 0), 0),
  };
}

// ── Performance calcs ───────────────────────────────────────────────────────

export function calcMaxDrawdown(cumPnl: number[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const v of cumPnl) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

export function calcSharpe(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  const avg = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) /
    (dailyReturns.length - 1);
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return 0;
  return (avg / stddev) * Math.sqrt(252);
}

// ── Colour for asset class badges ───────────────────────────────────────────

export function assetClassColor(ac: string): string {
  switch (ac) {
    case "Forex":
      return "bg-accent-dim text-accent";
    case "Crypto":
      return "bg-yellow-dim text-yellow";
    case "Stocks":
      return "bg-green-dim text-green";
    case "Futures":
      return "bg-red-dim text-red";
    default:
      return "bg-border text-text-secondary";
  }
}

export function sideColor(side: string): string {
  return side === "Long"
    ? "bg-green-dim text-green"
    : "bg-red-dim text-red";
}
