"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePositions } from "@/lib/store";
import { fmtCurrency, fmtNumber, fmtPct } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function PositionsPage() {
  const { positions, closePosition } = usePositions();
  const [closing, setClosing] = useState<string | null>(null);

  const totalOpenPnl = positions.reduce((s, p) => s + p.pnl, 0);

  function handleClose(id: string) {
    if (closing === id) {
      closePosition(id);
      setClosing(null);
    } else {
      setClosing(id);
    }
  }

  return (
    <>
      <Header title="Open Positions" />
      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Open Positions
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {positions.length}
            </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Total Open P&L
            </div>
            <div
              className={`text-2xl font-bold num ${
                totalOpenPnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {totalOpenPnl >= 0 ? "+" : ""}
              {fmtCurrency(totalOpenPnl)}
            </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Winners
            </div>
            <div className="text-2xl font-bold text-[var(--green)]">
              {positions.filter((p) => p.pnl > 0).length}
            </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Losers
            </div>
            <div className="text-2xl font-bold text-[var(--red)]">
              {positions.filter((p) => p.pnl < 0).length}
            </div>
          </div>
        </div>

        {/* Positions table */}
        <Card title="All Open Positions">
          {positions.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[var(--text-muted)]">
              <CheckCircle size={32} className="opacity-30" />
              <p className="text-sm">No open positions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Class</th>
                    <th>Side</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Cost</th>
                    <th className="text-right">Last Price</th>
                    <th className="text-right">P&L $</th>
                    <th className="text-right">P&L %</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.symbol}</td>
                      <td>
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
                      </td>
                      <td>
                        <Badge variant={p.side === "Long" ? "green" : "red"}>
                          {p.side}
                        </Badge>
                      </td>
                      <td className="text-right num">
                        {fmtNumber(p.qty, p.qty < 10 ? 4 : 0)}
                      </td>
                      <td className="text-right num">{fmtCurrency(p.avgCost)}</td>
                      <td className="text-right num">{fmtCurrency(p.lastPrice)}</td>
                      <td
                        className={`text-right num font-medium ${
                          p.pnl >= 0
                            ? "text-[var(--green)]"
                            : "text-[var(--red)]"
                        }`}
                      >
                        {p.pnl >= 0 ? "+" : ""}
                        {fmtCurrency(p.pnl)}
                      </td>
                      <td
                        className={`text-right num ${
                          p.pnlPct >= 0
                            ? "text-[var(--green)]"
                            : "text-[var(--red)]"
                        }`}
                      >
                        {fmtPct(p.pnlPct)}
                      </td>
                      <td className="text-center">
                        {closing === p.id ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleClose(p.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setClosing(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleClose(p.id)}
                          >
                            <AlertCircle size={12} />
                            Close
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
