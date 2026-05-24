"use client";

import { Header } from "@/components/layout/Header";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { ACCOUNT } from "@/lib/mock-data";
import { fmtCurrency, fmtPct } from "@/lib/utils";
import { Activity, DollarSign, TrendingUp, Target } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Net Liquidation"
            value={fmtCurrency(ACCOUNT.netLiquidation)}
            trend="neutral"
            icon={<DollarSign size={14} />}
          />
          <KpiCard
            title="Daily P&L"
            value={`+${fmtCurrency(ACCOUNT.dailyPnl)}`}
            subValue={`+${fmtPct(ACCOUNT.dailyPnlPct)}`}
            trend="up"
            icon={<TrendingUp size={14} />}
          />
          <KpiCard
            title="Open P&L"
            value={fmtCurrency(ACCOUNT.openPnl)}
            subValue={fmtPct(ACCOUNT.openPnlPct)}
            trend={ACCOUNT.openPnl >= 0 ? "up" : "down"}
            icon={<Activity size={14} />}
          />
          <KpiCard
            title="Win Rate"
            value={`${ACCOUNT.winRate.toFixed(1)}%`}
            subValue="Last 55 trades"
            trend="up"
            icon={<Target size={14} />}
          />
        </div>

        {/* Charts row */}
        <PnlChart />

        {/* Tables row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PositionsTable />
          <RecentTrades />
        </div>
      </div>
    </>
  );
}
