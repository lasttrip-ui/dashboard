"use client"

import { useCallback } from "react"
import { useLocalStorage } from "./store"

const KEY = "lol-favorites"

export function useFavorites() {
  const [ids, setIds] = useLocalStorage<number[]>(KEY, [])

  const isSaved = useCallback((id: number) => ids.includes(id), [ids])

  const toggle = useCallback(
    (id: number) => {
      setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
    },
    [ids, setIds]
  )

  return { ids, isSaved, toggle }
}
