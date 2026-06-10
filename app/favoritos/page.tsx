"use client"

import Link from "next/link"
import { Bookmark } from "lucide-react"
import { content } from "@/lib/content"
import { useFavorites } from "@/lib/favorites"
import ContentCard from "@/components/lab/ContentCard"

export default function FavoritosPage() {
  const { ids } = useFavorites()
  const saved = content.filter((c) => ids.includes(c.id))

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          Tu colección
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Favoritos</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          {saved.length > 0
            ? `Tienes ${saved.length} ${saved.length === 1 ? "contenido guardado" : "contenidos guardados"}.`
            : "Marca como favorito el contenido que quieras revisitar."}
        </p>
      </header>

      {saved.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 16 }}>
          {saved.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--bg-card)",
            border: "1px dashed var(--border)",
            borderRadius: 14,
            color: "var(--text-secondary)",
          }}
        >
          <Bookmark size={32} strokeWidth={1.6} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ margin: "0 0 16px", fontSize: 14 }}>
            Aún no has guardado nada. Pulsa el icono <Bookmark size={13} style={{ display: "inline", verticalAlign: "middle" }} /> en
            cualquier tarjeta para guardarla aquí.
          </p>
          <Link
            href="/contenido"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: "var(--amber)",
              color: "#0b1120",
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Explorar contenido
          </Link>
        </div>
      )}
    </div>
  )
}
