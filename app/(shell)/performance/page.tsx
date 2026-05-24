"use client";

import { Header } from "@/components/layout/Header";
import { EquityCurve } from "@/components/performance/EquityCurve";
import { MonthlyHeatmap } from "@/components/performance/MonthlyHeatmap";
import { PerfStats } from "@/components/performance/PerfStats";

export default function PerformancePage() {
  return (
    <>
      <Header title="Performance" />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <EquityCurve />
        <MonthlyHeatmap />
        <PerfStats />
      </div>
    </>
  );
}
