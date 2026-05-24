"use client";

import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";

export interface Filters {
  symbol: string;
  side: string;
  assetClass: string;
  dateFrom: string;
  dateTo: string;
}

interface JournalFiltersProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

export function JournalFilters({
  filters,
  onChange,
  onReset,
}: JournalFiltersProps) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
      {/* Symbol search */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-secondary)] font-medium">
          Symbol
        </label>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="e.g. BTC/USD"
            value={filters.symbol}
            onChange={set("symbol")}
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded pl-8 pr-3 py-1.5 w-36 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* Side */}
      <Select
        label="Side"
        value={filters.side}
        onChange={set("side")}
        options={[
          { value: "", label: "All Sides" },
          { value: "Long", label: "Long" },
          { value: "Short", label: "Short" },
        ]}
      />

      {/* Asset class */}
      <Select
        label="Asset Class"
        value={filters.assetClass}
        onChange={set("assetClass")}
        options={[
          { value: "", label: "All Classes" },
          { value: "Forex", label: "Forex" },
          { value: "Crypto", label: "Crypto" },
          { value: "Stocks", label: "Stocks" },
          { value: "Futures", label: "Futures" },
        ]}
      />

      {/* Date from */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-secondary)] font-medium">
          From
        </label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={set("dateFrom")}
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-secondary)] font-medium">
          To
        </label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={set("dateTo")}
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      <Button variant="ghost" size="sm" onClick={onReset}>
        <X size={13} />
        Reset
      </Button>
    </div>
  );
}
