"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { JournalFilters, Filters } from "@/components/journal/JournalFilters";
import { TradesTable } from "@/components/journal/TradesTable";
import { Card } from "@/components/ui/Card";
import { useTrades } from "@/lib/store";
import { calcStats, fmtCurrency, fmtPct } from "@/lib/utils";

const DEFAULT_FILTERS: Filters = {
  symbol: "",
  side: "",
  assetClass: "",
  dateFrom: "",
  dateTo: "",
};

function StatBox({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-lg font-bold num ${
          positive === true
            ? "text-[var(--green)]"
            : positive === false
            ? "text-[var(--red)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function JournalPage() {
  const { trades } = useTrades();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => t.status === "closed")
      .filter((t) => {
        if (
          filters.symbol &&
          !t.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
        )
          return false;
        if (filters.side && t.side !== filters.side) return false;
        if (filters.assetClass && t.assetClass !== filters.assetClass)
          return false;
        if (filters.dateFrom && t.date < filters.dateFrom) return false;
        if (filters.dateTo && t.date > filters.dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trades, filters]);

  const stats = calcStats(filtered);

  return (
    <>
      <Header title="Trade Journal" />
      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Summary stats */}
        <Card>
          <div className="flex flex-wrap gap-8 px-6 py-5">
            <StatBox label="Total Trades" value={String(stats.total)} />
            <StatBox
              label="Win Rate"
              value={fmtPct(stats.winRate, 1)}
              positive={stats.winRate >= 50}
            />
            <StatBox
              label="Avg Win"
              value={fmtCurrency(stats.avgWin)}
              positive={true}
            />
            <StatBox
              label="Avg Loss"
              value={fmtCurrency(-stats.avgLoss)}
              positive={false}
            />
            <StatBox
              label="Profit Factor"
              value={
                stats.profitFactor === Infinity
                  ? "∞"
                  : stats.profitFactor.toFixed(2)
              }
              positive={stats.profitFactor >= 1}
            />
            <StatBox
              label="Total P&L"
              value={fmtCurrency(stats.totalPnl)}
              positive={stats.totalPnl >= 0}
            />
          </div>
        </Card>

        {/* Filters */}
        <JournalFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        {/* Table */}
        <Card>
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Trade History
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <TradesTable trades={filtered} />
        </Card>
      </div>
    </>
  );
}
