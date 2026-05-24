"use client";

import { DAILY_PNL, TRADES } from "@/lib/mock-data";
import {
  calcMaxDrawdown,
  calcSharpe,
  calcStats,
  fmtCurrency,
  fmtPct,
} from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

function StatItem({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  const valueColor =
    positive === true
      ? "text-[var(--green)]"
      : positive === false
      ? "text-[var(--red)]"
      : "text-[var(--text-primary)]";
  return (
    <div className="p-4 bg-[var(--bg-primary)] rounded border border-[var(--border)]">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={`text-xl font-bold num ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

export function PerfStats() {
  const maxDd = calcMaxDrawdown(DAILY_PNL.map((d) => d.cumulative));
  const sharpe = calcSharpe(DAILY_PNL.map((d) => d.pnl));
  const stats = calcStats(TRADES);

  // P&L by asset class
  const assetClasses = ["Forex", "Crypto", "Stocks", "Futures"];
  const byClass = assetClasses.map((ac) => {
    const trades = TRADES.filter(
      (t) => t.assetClass === ac && t.status === "closed"
    );
    const pnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
    const wr = trades.length ? (wins / trades.length) * 100 : 0;
    return { name: ac, pnl, wr, count: trades.length };
  });

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 text-xs shadow-xl">
        <div className="text-[var(--text-muted)] mb-1">{label}</div>
        <span
          className={`font-semibold num ${
            v >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
          }`}
        >
          {v >= 0 ? "+" : ""}
          {fmtCurrency(v)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Key stats grid */}
      <Card title="Performance Statistics">
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatItem
            label="Max Drawdown"
            value={fmtCurrency(maxDd)}
            positive={false}
          />
          <StatItem
            label="Sharpe Ratio"
            value={sharpe.toFixed(2)}
            sub="Annualised"
            positive={sharpe > 1}
          />
          <StatItem
            label="Win Rate"
            value={fmtPct(stats.winRate, 1)}
            sub={`${stats.wins}W / ${stats.losses}L`}
            positive={stats.winRate > 50}
          />
          <StatItem
            label="Profit Factor"
            value={
              stats.profitFactor === Infinity
                ? "∞"
                : stats.profitFactor.toFixed(2)
            }
            positive={stats.profitFactor > 1}
          />
          <StatItem
            label="Avg Win"
            value={fmtCurrency(stats.avgWin)}
            positive={true}
          />
          <StatItem
            label="Avg Loss"
            value={fmtCurrency(-stats.avgLoss)}
            positive={false}
          />
          <StatItem
            label="Total Trades"
            value={String(stats.total)}
          />
          <StatItem
            label="Total P&L"
            value={fmtCurrency(stats.totalPnl)}
            positive={stats.totalPnl > 0}
          />
        </div>
      </Card>

      {/* P&L by Asset Class */}
      <Card title="P&L by Asset Class">
        <div className="px-4 pt-4 pb-2 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byClass}
              margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={60}>
                {byClass.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.pnl >= 0 ? "var(--green)" : "var(--red)"
                    }
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win rate per class */}
        <div className="px-5 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {byClass.map((c) => (
            <div
              key={c.name}
              className="p-3 rounded bg-[var(--bg-primary)] border border-[var(--border)]"
            >
              <div className="text-xs text-[var(--text-muted)] mb-1">
                {c.name}
              </div>
              <div
                className={`text-sm font-semibold num ${
                  c.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }`}
              >
                {c.pnl >= 0 ? "+" : ""}
                {fmtCurrency(c.pnl)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                WR: {c.wr.toFixed(1)}% ({c.count} trades)
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Win/Loss distribution */}
      <Card title="Win / Loss Distribution">
        <div className="p-5 space-y-4">
          {byClass.map((c) => {
            const trades = TRADES.filter(
              (t) => t.assetClass === c.name && t.status === "closed"
            );
            const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
            const total = trades.length;
            const winPct = total ? (wins / total) * 100 : 0;
            return (
              <div key={c.name}>
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                  <span>{c.name}</span>
                  <span className="num">
                    {wins}W / {total - wins}L ({winPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 rounded overflow-hidden bg-[var(--red-dim)] flex">
                  <div
                    className="h-full bg-[var(--green)] rounded-l transition-all"
                    style={{ width: `${winPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
