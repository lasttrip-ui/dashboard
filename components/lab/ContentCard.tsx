"use client"

import {
  Bookmark,
  FileText,
  Mic,
  MessageCircle,
  Zap,
  Video,
  Users,
  type LucideIcon,
} from "lucide-react"
import { ContentItem, ContentTipo, TIPO_LABEL } from "@/lib/content"
import { useFavorites } from "@/lib/favorites"

const TIPO_ICON: Record<ContentTipo, LucideIcon> = {
  articulo: FileText,
  directo: Mic,
  qa: MessageCircle,
  taller: Zap,
  video: Video,
  "mentoria-grupal": Users,
}

const ACCESS_LABEL = { free: "Gratis", freemium: "Freemium", premium: "Premium" } as const

export default function ContentCard({ item }: { item: ContentItem }) {
  const { isSaved, toggle } = useFavorites()
  const saved = isSaved(item.id)
  const Icon = TIPO_ICON[item.tipo]
  const href = `https://lwsoptionslab.com/contenido/${item.slug}/`

  return (
    <article style={{ position: "relative" }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="lol-content-card"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--bg-card)",
          overflow: "hidden",
          transition: "transform .15s, border-color .15s, box-shadow .15s",
        }}
      >
        <div
          style={{
            height: 132,
            position: "relative",
            background: "linear-gradient(135deg, var(--amber) 0%, var(--amber-600) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(11,17,32,0.65)",
          }}
        >
          <Icon size={34} strokeWidth={1.6} />
          <span
            className={`lab-badge lab-badge--${item.access}`}
            style={{ position: "absolute", top: 8, left: 8 }}
          >
            {ACCESS_LABEL[item.access]}
          </span>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "3px 9px",
              borderRadius: 5,
              background: "var(--amber-dim)",
              color: "var(--amber)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {TIPO_LABEL[item.tipo]}
          </span>
          <h3 style={{ fontSize: 16, lineHeight: 1.25, color: "var(--text-primary)" }}>{item.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
            {item.excerpt}
          </p>
        </div>
      </a>
      <button
        type="button"
        onClick={() => toggle(item.id)}
        aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
        title={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: saved ? "var(--amber)" : "rgba(11,17,32,0.65)",
          color: saved ? "#0b1120" : "#f8fafc",
          backdropFilter: "blur(4px)",
          transition: "transform .12s, background .15s",
        }}
      >
        <Bookmark size={16} strokeWidth={1.9} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  )
}
