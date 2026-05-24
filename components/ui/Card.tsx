import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = "", title, action }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          {title && (
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
              {title}
            </h2>
          )}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
