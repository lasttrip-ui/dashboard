"use client";

import { useEffect, useState } from "react";
import { fmtCurrency } from "@/lib/utils";
import { ACCOUNT } from "@/lib/mock-data";
import { useSettings } from "@/lib/store";
import { Clock } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("en-US", {
        timeZone: settings.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "--:--:--";

  const dateStr = now
    ? now.toLocaleDateString("en-US", {
        timeZone: settings.timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
      <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-wide">
        {title}
      </h1>

      <div className="flex items-center gap-6">
        {/* Balance */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-[var(--text-muted)]">
            Net Liquidation
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)] num">
            {fmtCurrency(ACCOUNT.netLiquidation, settings.currency)}
          </span>
        </div>

        {/* Daily P&L */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-[var(--text-muted)]">Daily P&L</span>
          <span
            className={`text-sm font-semibold num ${
              ACCOUNT.dailyPnl >= 0
                ? "text-[var(--green)]"
                : "text-[var(--red)]"
            }`}
          >
            {ACCOUNT.dailyPnl >= 0 ? "+" : ""}
            {fmtCurrency(ACCOUNT.dailyPnl, settings.currency)}
          </span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Clock size={14} className="text-[var(--text-muted)]" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono num leading-none">{timeStr}</span>
            <span className="text-xs text-[var(--text-muted)] leading-none mt-0.5">
              {dateStr}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
