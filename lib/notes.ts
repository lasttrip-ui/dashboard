"use client"

import { useCallback } from "react"
import { useLocalStorage } from "./store"

const KEY = "lol-trade-notes"

export function useTradeNotes() {
  const [notes, setNotes] = useLocalStorage<Record<string, string>>(KEY, {})

  const get = useCallback((id: string) => notes[id] ?? "", [notes])

  const set = useCallback(
    (id: string, text: string) => {
      const next = { ...notes }
      const trimmed = text.trim()
      if (trimmed) next[id] = trimmed
      else delete next[id]
      setNotes(next)
    },
    [notes, setNotes]
  )

  return { get, set }
}
