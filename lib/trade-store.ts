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
