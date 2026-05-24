import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:opacity-90 border border-transparent",
  secondary:
    "bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent",
  danger:
    "bg-[var(--red-dim)] text-[var(--red)] hover:opacity-90 border border-[var(--red-dim)]",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
