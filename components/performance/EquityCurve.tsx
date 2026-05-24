"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { DAILY_PNL } from "@/lib/mock-data";
import { fmtDateShort, fmtCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export function EquityCurve() {
  const data = DAILY_PNL.map((d) => ({
    date: fmtDateShort(d.date),
    cumulative: d.cumulative,
    daily: d.pnl,
  }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { daily: number } }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const cum = payload[0].value;
    const daily = payload[0].payload.daily;
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 text-xs shadow-xl">
        <div className="text-[var(--text-muted)] mb-1">{label}</div>
        <div className="space-y-1">
          <div>
            <span className="text-[var(--text-secondary)]">Equity: </span>
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
            <span className="text-[var(--text-secondary)]">Daily P&L: </span>
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
    <Card title="Equity Curve — 90 Days">
      <div className="px-4 pt-4 pb-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient id="ecGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop
                  offset="95%"
                  stopColor="var(--accent)"
                  stopOpacity={0}
                />
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
              interval={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              width={52}
            />
            <ReferenceLine
              y={0}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#ecGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
