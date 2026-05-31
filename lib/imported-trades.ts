"use client"

import { useCallback } from "react"
import { useLocalStorage } from "./store"
import type { OptionTrade } from "./data"
import type { IBFlexResult } from "./ibflex"

const TRADES_KEY = "lol-imported-trades"
const META_KEY = "lol-import-meta"

export interface ImportMeta {
  source: "ibflex"
  accountId: string
  fetchedAt: string
  count: number
}

export function useImportedTrades() {
  const [importedTrades, setImportedTrades] = useLocalStorage<OptionTrade[]>(TRADES_KEY, [])
  const [meta, setMeta] = useLocalStorage<ImportMeta | null>(META_KEY, null)

  const saveResult = useCallback(
    (result: IBFlexResult) => {
      setImportedTrades(result.trades)
      setMeta({
        source: "ibflex",
        accountId: result.accountId,
        fetchedAt: result.fetchedAt,
        count: result.trades.length,
      })
    },
    [setImportedTrades, setMeta]
  )

  const clear = useCallback(() => {
    setImportedTrades([])
    setMeta(null)
  }, [setImportedTrades, setMeta])

  return { importedTrades, meta, saveResult, clear }
}
