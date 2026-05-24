import React from "react";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, subValue, trend, icon }: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-[var(--green)]"
      : trend === "down"
      ? "text-[var(--red)]"
      : "text-[var(--text-secondary)]";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
          {title}
        </span>
        {icon && (
          <span className="text-[var(--text-muted)] opacity-60">{icon}</span>
        )}
        {!icon && trend === "up" && (
          <TrendingUp size={14} className="text-[var(--green)] opacity-70" />
        )}
        {!icon && trend === "down" && (
          <TrendingDown size={14} className="text-[var(--red)] opacity-70" />
        )}
      </div>
      <div className={`text-2xl font-bold num ${trendColor}`}>{value}</div>
      {subValue && (
        <div className={`text-xs mt-1 num ${trendColor} opacity-80`}>
          {subValue}
        </div>
      )}
    </Card>
  );
}
