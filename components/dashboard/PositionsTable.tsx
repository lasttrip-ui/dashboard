"use client";

import { usePositions } from "@/lib/store";
import { fmtCurrency, fmtPct, fmtNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export function PositionsTable() {
  const { positions } = usePositions();
  const preview = positions.slice(0, 5);

  return (
    <Card
      title="Open Positions"
      action={
        <Link
          href="/positions"
          className="text-xs text-[var(--accent)] hover:underline"
        >
          View all ({positions.length})
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="tt-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Avg Cost</th>
              <th className="text-right">Last</th>
              <th className="text-right">P&L</th>
              <th className="text-right">P&L %</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.symbol}</span>
                    <Badge
                      variant={
                        p.assetClass === "Forex"
                          ? "accent"
                          : p.assetClass === "Crypto"
                          ? "yellow"
                          : p.assetClass === "Stocks"
                          ? "green"
                          : "red"
                      }
                    >
                      {p.assetClass}
                    </Badge>
                  </div>
                </td>
                <td>
                  <Badge variant={p.side === "Long" ? "green" : "red"}>
                    {p.side}
                  </Badge>
                </td>
                <td className="text-right num">{fmtNumber(p.qty, p.qty < 10 ? 4 : 0)}</td>
                <td className="text-right num">{fmtCurrency(p.avgCost)}</td>
                <td className="text-right num">{fmtCurrency(p.lastPrice)}</td>
                <td
                  className={`text-right num font-medium ${
                    p.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}
                >
                  {p.pnl >= 0 ? "+" : ""}
                  {fmtCurrency(p.pnl)}
                </td>
                <td
                  className={`text-right num ${
                    p.pnlPct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}
                >
                  {fmtPct(p.pnlPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {preview.length === 0 && (
          <div className="py-10 text-center text-[var(--text-muted)] text-sm">
            No open positions
          </div>
        )}
      </div>
    </Card>
  );
}
