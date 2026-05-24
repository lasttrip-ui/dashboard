"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DAILY_PNL } from "@/lib/mock-data";
import { fmtDateShort, fmtCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export function PnlChart() {
  // Last 30 days
  const data = DAILY_PNL.slice(-30).map((d) => ({
    date: fmtDateShort(d.date),
    cumulative: d.cumulative,
    pnl: d.pnl,
  }));

  const isPositive = data[data.length - 1]?.cumulative >= 0;
  const strokeColor = isPositive ? "var(--green)" : "var(--red)";
  const fillId = isPositive ? "greenGrad" : "redGrad";
  const fillColor = isPositive ? "var(--green)" : "var(--red)";

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { pnl: number } }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const cum = payload[0].value;
    const daily = payload[0].payload.pnl;
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 text-xs shadow-xl">
        <div className="text-[var(--text-muted)] mb-1">{label}</div>
        <div className="flex gap-4">
          <div>
            <span className="text-[var(--text-secondary)]">Cumulative: </span>
            <span
              className={`font-semibold num ${
                cum >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {cum >= 0 ? "+" : ""}
              {fmtCurrency(cum)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Daily: </span>
            <span
              className={`font-semibold num ${
                daily >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {daily >= 0 ? "+" : ""}
              {fmtCurrency(daily)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card title="Cumulative P&L — Last 30 Days">
      <div className="px-4 pt-4 pb-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--red)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{ r: 4, fill: fillColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
