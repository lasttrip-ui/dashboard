import type { OptionTrade } from "./data"
import { scheduleSyncPush } from "./sync"

const KEY = "tt-imported-trades"

export function loadImported(): OptionTrade[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OptionTrade[]) : []
  } catch {
    return []
  }
}

export function saveImported(trades: OptionTrade[]): void {
  localStorage.setItem(KEY, JSON.stringify(trades))
  scheduleSyncPush()
}

export function clearImported(): void {
  localStorage.removeItem(KEY)
  scheduleSyncPush()
}

export function mergeImported(base: OptionTrade[], imported: OptionTrade[]): OptionTrade[] {
  const ids = new Set(base.map(t => t.id))
  const unique = imported.filter(t => !ids.has(t.id))
  return [...base, ...unique].sort((a, b) => a.date.localeCompare(b.date))
}

// ── Per-trade edits/deletions (works on top of base + imported trades) ───────

const OVERRIDES_KEY = "tt-trade-overrides"
const DELETED_KEY = "tt-deleted-trade-ids"

export function loadOverrides(): Record<string, Partial<OptionTrade>> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveOverride(id: string, patch: Partial<OptionTrade>): void {
  const all = loadOverrides()
  all[id] = { ...all[id], ...patch }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))
  scheduleSyncPush()
}

export function loadDeletedIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function markDeleted(id: string): void {
  const ids = new Set(loadDeletedIds())
  ids.add(id)
  localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(ids)))
  scheduleSyncPush()
}

export function applyOverridesAndDeletions(trades: OptionTrade[]): OptionTrade[] {
  const overrides = loadOverrides()
  const deleted = new Set(loadDeletedIds())
  return trades
    .filter(t => !deleted.has(t.id))
    .map(t => overrides[t.id] ? { ...t, ...overrides[t.id] } : t)
}

// ── Imported raw executions (stocks + options, any year) ─────────────────────

import type { ImportedExecution } from "./import-parser"

const EXEC_KEY = "tt-imported-execs"

export function loadImportedExecs(): ImportedExecution[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EXEC_KEY)
    return raw ? (JSON.parse(raw) as ImportedExecution[]) : []
  } catch {
    return []
  }
}

export function saveImportedExecs(execs: ImportedExecution[]): void {
  localStorage.setItem(EXEC_KEY, JSON.stringify(execs))
  scheduleSyncPush()
}

export function clearImportedExecs(): void {
  localStorage.removeItem(EXEC_KEY)
  scheduleSyncPush()
}

// ── Imported dividends ────────────────────────────────────────────────────────

import type { ImportedDividend } from "./import-parser"

const DIV_KEY = "tt-imported-divs"

export function loadImportedDividends(): ImportedDividend[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DIV_KEY)
    return raw ? (JSON.parse(raw) as ImportedDividend[]) : []
  } catch {
    return []
  }
}

export function saveImportedDividends(divs: ImportedDividend[]): void {
  localStorage.setItem(DIV_KEY, JSON.stringify(divs))
  scheduleSyncPush()
}

export function clearImportedDividends(): void {
  localStorage.removeItem(DIV_KEY)
  scheduleSyncPush()
}

export function mergeImportedDividends(base: ImportedDividend[], incoming: ImportedDividend[]): ImportedDividend[] {
  // Deduplicate by date+company+amount combination
  const keys = new Set(base.map(d => `${d.date}_${d.company}_${d.amount}`))
  const unique = incoming.filter(d => !keys.has(`${d.date}_${d.company}_${d.amount}`))
  return [...base, ...unique].sort((a, b) => a.date.localeCompare(b.date))
}

// ── Imported stock transactions (DeGiro buys/sells, used to build positions) ─

import type { ImportedStockTransaction } from "./import-parser"

const STOCK_TXN_KEY = "tt-imported-stock-txns"

export function loadImportedStockTxns(): ImportedStockTransaction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STOCK_TXN_KEY)
    return raw ? (JSON.parse(raw) as ImportedStockTransaction[]) : []
  } catch {
    return []
  }
}

export function saveImportedStockTxns(txns: ImportedStockTransaction[]): void {
  localStorage.setItem(STOCK_TXN_KEY, JSON.stringify(txns))
  scheduleSyncPush()
}

export function clearImportedStockTxns(): void {
  localStorage.removeItem(STOCK_TXN_KEY)
  scheduleSyncPush()
}
