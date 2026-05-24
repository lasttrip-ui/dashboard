import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs text-[var(--text-secondary)] font-medium">
          {label}
        </label>
      )}
      <select
        className={`bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
