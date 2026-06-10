import type { OptionTrade } from "./data"

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
}

export function clearImported(): void {
  localStorage.removeItem(KEY)
}

export function mergeImported(base: OptionTrade[], imported: OptionTrade[]): OptionTrade[] {
  const ids = new Set(base.map(t => t.id))
  const unique = imported.filter(t => !ids.has(t.id))
  return [...base, ...unique].sort((a, b) => a.date.localeCompare(b.date))
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
}

export function clearImportedExecs(): void {
  localStorage.removeItem(EXEC_KEY)
}
