"use client"

import { Bookmark } from "lucide-react"
import { useFavorites } from "@/lib/favorites"

export default function SaveButton({ id }: { id: number }) {
  const { isSaved, toggle } = useFavorites()
  const saved = isSaved(id)

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid ${saved ? "var(--amber)" : "var(--border)"}`,
        background: saved ? "var(--amber)" : "transparent",
        color: saved ? "#0b1120" : "var(--text-primary)",
        transition: "all .15s",
      }}
    >
      <Bookmark size={15} strokeWidth={1.9} fill={saved ? "currentColor" : "none"} />
      {saved ? "Guardado" : "Guardar"}
    </button>
  )
}
