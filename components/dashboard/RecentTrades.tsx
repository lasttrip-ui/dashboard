"use client";

import { useTrades } from "@/lib/store";
import { fmtCurrency, fmtDate, fmtNumber, fmtPct } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export function RecentTrades() {
  const { trades } = useTrades();
  const recent = trades
    .filter((t) => t.status === "closed")
    .slice(0, 5);

  return (
    <Card
      title="Recent Trades"
      action={
        <Link
          href="/journal"
          className="text-xs text-[var(--accent)] hover:underline"
        >
          View journal
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="tt-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Side</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Fill</th>
              <th className="text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td className="text-[var(--text-secondary)] text-xs">
                  {fmtDate(t.date)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.symbol}</span>
                  </div>
                </td>
                <td>
                  <Badge variant={t.side === "Long" ? "green" : "red"}>
                    {t.side}
                  </Badge>
                </td>
                <td className="text-right num text-xs text-[var(--text-secondary)]">
                  {fmtNumber(t.qty, t.qty < 10 ? 3 : 0)}
                </td>
                <td className="text-right num text-xs text-[var(--text-secondary)]">
                  {fmtCurrency(t.avgFill)}
                </td>
                <td className="text-right">
                  <div
                    className={`num font-medium text-sm ${
                      (t.pnl ?? 0) >= 0
                        ? "text-[var(--green)]"
                        : "text-[var(--red)]"
                    }`}
                  >
                    {(t.pnl ?? 0) >= 0 ? "+" : ""}
                    {fmtCurrency(t.pnl ?? 0)}
                  </div>
                  <div
                    className={`num text-xs ${
                      (t.pnlPct ?? 0) >= 0
                        ? "text-[var(--green)]"
                        : "text-[var(--red)]"
                    } opacity-70`}
                  >
                    {fmtPct(t.pnlPct ?? 0)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recent.length === 0 && (
          <div className="py-10 text-center text-[var(--text-muted)] text-sm">
            No recent trades
          </div>
        )}
      </div>
    </Card>
  );
}
