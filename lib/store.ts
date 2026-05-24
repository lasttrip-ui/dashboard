"use client";

import { useCallback, useEffect, useState } from "react";
import { TRADES, POSITIONS, type Trade, type Position } from "./mock-data";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: "dark" | "light";
  currency: "USD" | "EUR" | "GBP";
  timezone: string;
  fontSize: "sm" | "md" | "lg";
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  currency: "USD",
  timezone: "America/New_York",
  fontSize: "md",
};

// ── localStorage helpers ────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

// ── Hook: useTrades ─────────────────────────────────────────────────────────

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(() =>
    safeGet("tt_trades", TRADES)
  );

  useEffect(() => {
    safeSet("tt_trades", trades);
  }, [trades]);

  const addTrade = useCallback((t: Trade) => {
    setTrades((prev) => [t, ...prev]);
  }, []);

  const updateTrade = useCallback((id: string, patch: Partial<Trade>) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { trades, addTrade, updateTrade, deleteTrade };
}

// ── Hook: usePositions ──────────────────────────────────────────────────────

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>(() =>
    safeGet("tt_positions", POSITIONS)
  );

  useEffect(() => {
    safeSet("tt_positions", positions);
  }, [positions]);

  const closePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePosition = useCallback(
    (id: string, patch: Partial<Position>) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  return { positions, closePosition, updatePosition };
}

// ── Hook: useSettings ───────────────────────────────────────────────────────

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    safeGet("tt_settings", DEFAULT_SETTINGS)
  );

  useEffect(() => {
    safeSet("tt_settings", settings);
    // Apply theme
    document.documentElement.setAttribute("data-theme", settings.theme);
    // Apply font size
    const sizes = { sm: "13px", md: "14px", lg: "16px" };
    document.documentElement.style.setProperty(
      "--base-font-size",
      sizes[settings.fontSize]
    );
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings };
}
