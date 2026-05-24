"use client";

import { Trade } from "@/lib/mock-data";
import { fmtCurrency, fmtDate, fmtNumber, fmtPct } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Clock } from "lucide-react";

interface TradesTableProps {
  trades: Trade[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--text-muted)] text-sm">
        No trades match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="tt-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Class</th>
            <th>Side</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Avg Fill</th>
            <th className="text-right">Close</th>
            <th className="text-right">P&L $</th>
            <th className="text-right">P&L %</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td className="text-[var(--text-secondary)] text-xs">
                {fmtDate(t.date)}
              </td>
              <td className="font-medium">{t.symbol}</td>
              <td>
                <Badge
                  variant={
                    t.assetClass === "Forex"
                      ? "accent"
                      : t.assetClass === "Crypto"
                      ? "yellow"
                      : t.assetClass === "Stocks"
                      ? "green"
                      : "red"
                  }
                >
                  {t.assetClass}
                </Badge>
              </td>
              <td>
                <Badge variant={t.side === "Long" ? "green" : "red"}>
                  {t.side}
                </Badge>
              </td>
              <td className="text-right num text-xs text-[var(--text-secondary)]">
                {fmtNumber(t.qty, t.qty < 10 ? 3 : 0)}
              </td>
              <td className="text-right num">{fmtCurrency(t.avgFill)}</td>
              <td className="text-right num">
                {t.closePrice != null ? fmtCurrency(t.closePrice) : "—"}
              </td>
              <td
                className={`text-right num font-medium ${
                  (t.pnl ?? 0) >= 0
                    ? "text-[var(--green)]"
                    : "text-[var(--red)]"
                }`}
              >
                {(t.pnl ?? 0) >= 0 ? "+" : ""}
                {fmtCurrency(t.pnl ?? 0)}
              </td>
              <td
                className={`text-right num text-xs ${
                  (t.pnlPct ?? 0) >= 0
                    ? "text-[var(--green)]"
                    : "text-[var(--red)]"
                }`}
              >
                {fmtPct(t.pnlPct ?? 0)}
              </td>
              <td>
                {t.duration ? (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={11} />
                    {t.duration}
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
