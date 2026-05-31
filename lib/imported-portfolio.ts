"use client"

import { useCallback } from "react"
import { useLocalStorage } from "./store"
import type { Position, DeGiroRow } from "./degiro"

const ROWS_KEY = "lol-degiro-rows"
const POS_KEY = "lol-degiro-positions"

export interface PortfolioMeta {
  filename: string
  importedAt: string
  rowCount: number
}

const META_KEY = "lol-degiro-meta"

export function usePortfolio() {
  const [rows, setRows] = useLocalStorage<DeGiroRow[]>(ROWS_KEY, [])
  const [positions, setPositions] = useLocalStorage<Position[]>(POS_KEY, [])
  const [meta, setMeta] = useLocalStorage<PortfolioMeta | null>(META_KEY, null)

  const save = useCallback(
    (newRows: DeGiroRow[], newPositions: Position[], filename: string) => {
      setRows(newRows)
      setPositions(newPositions)
      setMeta({ filename, importedAt: new Date().toISOString(), rowCount: newRows.length })
    },
    [setRows, setPositions, setMeta]
  )

  const clear = useCallback(() => {
    setRows([])
    setPositions([])
    setMeta(null)
  }, [setRows, setPositions, setMeta])

  return { rows, positions, meta, save, clear }
}
