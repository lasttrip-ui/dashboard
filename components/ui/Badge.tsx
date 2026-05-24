import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "green" | "red" | "accent" | "yellow";
}

const variantClasses: Record<string, string> = {
  default: "bg-[var(--border)] text-[var(--text-secondary)]",
  green: "bg-[var(--green-dim)] text-[var(--green)]",
  red: "bg-[var(--red-dim)] text-[var(--red)]",
  accent: "bg-[var(--accent-dim)] text-[var(--accent)]",
  yellow: "bg-[var(--yellow-dim)] text-[var(--yellow)]",
};

export function Badge({
  children,
  className = "",
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
