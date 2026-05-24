"use client";

import { DAILY_PNL } from "@/lib/mock-data";
import { fmtCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthData {
  year: number;
  month: number;
  pnl: number;
}

function buildMonthlyData(): MonthData[] {
  const map = new Map<string, number>();
  for (const d of DAILY_PNL) {
    const dt = new Date(d.date);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    map.set(key, (map.get(key) ?? 0) + d.pnl);
  }
  return Array.from(map.entries()).map(([k, pnl]) => {
    const [yr, mo] = k.split("-").map(Number);
    return { year: yr, month: mo, pnl };
  }).sort((a, b) => a.year - b.year || a.month - b.month);
}

function cellBg(pnl: number): string {
  if (pnl === 0) return "bg-[var(--border)]";
  if (pnl > 3000) return "bg-[var(--green)] opacity-90";
  if (pnl > 1500) return "bg-[var(--green)] opacity-60";
  if (pnl > 0) return "bg-[var(--green)] opacity-30";
  if (pnl < -3000) return "bg-[var(--red)] opacity-90";
  if (pnl < -1500) return "bg-[var(--red)] opacity-60";
  return "bg-[var(--red)] opacity-30";
}

function textColor(pnl: number): string {
  if (pnl > 1000) return "text-[#000]";
  if (pnl > 0) return "text-[var(--green)]";
  if (pnl < -1000) return "text-[#000]";
  if (pnl < 0) return "text-[var(--red)]";
  return "text-[var(--text-muted)]";
}

export function MonthlyHeatmap() {
  const data = buildMonthlyData();
  const years = Array.from(new Set(data.map((d) => d.year)));

  return (
    <Card title="Monthly P&L Heatmap">
      <div className="p-5 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left text-[var(--text-muted)] pb-2 pr-3 font-medium w-12">
                Year
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="text-center text-[var(--text-muted)] pb-2 px-1 font-medium w-16"
                >
                  {m}
                </th>
              ))}
              <th className="text-right text-[var(--text-muted)] pb-2 pl-3 font-medium w-20">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const yearData = data.filter((d) => d.year === year);
              const yearTotal = yearData.reduce((s, d) => s + d.pnl, 0);
              return (
                <tr key={year}>
                  <td className="text-[var(--text-secondary)] font-medium pr-3 py-1">
                    {year}
                  </td>
                  {MONTHS.map((_, mi) => {
                    const cell = yearData.find((d) => d.month === mi);
                    if (!cell) {
                      return (
                        <td key={mi} className="px-1 py-1">
                          <div className="rounded h-8 bg-[var(--bg-hover)]" />
                        </td>
                      );
                    }
                    return (
                      <td key={mi} className="px-1 py-1">
                        <div
                          className={`relative rounded h-8 flex items-center justify-center ${cellBg(
                            cell.pnl
                          )}`}
                          title={`${MONTHS[mi]} ${year}: ${fmtCurrency(cell.pnl)}`}
                        >
                          <span
                            className={`num font-semibold ${textColor(cell.pnl)}`}
                          >
                            {cell.pnl >= 0 ? "+" : ""}
                            {(cell.pnl / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="pl-3 py-1 text-right">
                    <span
                      className={`num font-semibold text-xs ${
                        yearTotal >= 0
                          ? "text-[var(--green)]"
                          : "text-[var(--red)]"
                      }`}
                    >
                      {yearTotal >= 0 ? "+" : ""}
                      {fmtCurrency(yearTotal)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
