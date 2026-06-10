import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, ExternalLink } from "lucide-react"
import {
  content,
  getContentBySlug,
  TIPO_LABEL,
  ACCESS_LABEL,
  formatDateEs,
} from "@/lib/content"
import SaveButton from "@/components/lab/SaveButton"

export function generateStaticParams() {
  return content.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const item = getContentBySlug(params.slug)
  return { title: item ? `${item.title} — LWS Options Lab` : "Contenido" }
}

export default function ContentDetailPage({ params }: { params: { slug: string } }) {
  const item = getContentBySlug(params.slug)
  if (!item) notFound()

  const external = `https://lwsoptionslab.com/contenido/${item.slug}/`

  return (
    <article className="animate-in" style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <Link href="/contenido" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
        <ArrowLeft size={15} strokeWidth={1.75} /> Todo el contenido
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 9px", borderRadius: 5, background: "var(--amber-dim)", color: "var(--amber)", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {TIPO_LABEL[item.tipo]}
          </span>
          <span className={`lab-badge lab-badge--${item.access}`}>{ACCESS_LABEL[item.access]}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateEs(item.date)}</span>
        </div>
        <h1 style={{ fontSize: 34, lineHeight: 1.15, color: "var(--text-primary)" }}>{item.title}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--text-secondary)" }}>{item.excerpt}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SaveButton id={item.id} />
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9, background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 13 }}
          >
            Abrir contenido completo <ExternalLink size={15} strokeWidth={2} />
          </a>
        </div>
      </header>

      <div
        style={{
          height: 220,
          borderRadius: 14,
          background: "linear-gradient(135deg, var(--amber) 0%, var(--amber-600) 100%)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)" }}>
        <p>
          Esta es una vista previa dentro de tu dashboard. El contenido completo —incluyendo
          gráficos, vídeo y material descargable— está disponible en la plataforma.
        </p>
        <p>
          {item.excerpt} Pulsa <strong style={{ color: "var(--text-primary)" }}>«Abrir contenido completo»</strong> para leerlo entero,
          o guárdalo en favoritos para revisitarlo más tarde.
        </p>
      </div>
    </article>
  )
}
