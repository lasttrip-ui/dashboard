import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, ExternalLink, FileText, Download } from "lucide-react"
import { informes, getInformeBySlug, ACCESS_LABEL, formatDateEs } from "@/lib/content"

export function generateStaticParams() {
  return informes.map((i) => ({ slug: i.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const inf = getInformeBySlug(params.slug)
  return { title: inf ? `${inf.title} — LWS Options Lab` : "Informe" }
}

export default function InformeDetailPage({ params }: { params: { slug: string } }) {
  const inf = getInformeBySlug(params.slug)
  if (!inf) notFound()

  const external = `https://lwsoptionslab.com/informes/${inf.slug}`
  const color = inf.tickerColor ?? "var(--amber)"

  return (
    <article className="animate-in" style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <Link href="/informes" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
        <ArrowLeft size={15} strokeWidth={1.75} /> Informes especiales
      </Link>

      <header style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `color-mix(in srgb, ${color} 13%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
            color,
          }}
        >
          {inf.ticker ? (
            <span style={{ fontSize: 16, fontWeight: 800 }}>{inf.ticker}</span>
          ) : (
            <FileText size={28} strokeWidth={1.75} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              {inf.cat}
            </span>
            <span className={`lab-badge lab-badge--${inf.access}`}>{ACCESS_LABEL[inf.access]}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateEs(inf.date)}</span>
          </div>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, color: "var(--text-primary)" }}>{inf.title}</h1>
          {inf.excerpt && (
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 8 }}>{inf.excerpt}</p>
          )}
        </div>
      </header>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 9, background: "var(--amber)", color: "#0b1120", fontWeight: 600, fontSize: 13 }}
        >
          <Download size={15} strokeWidth={2} /> Abrir informe completo
        </a>
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 9, border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}
        >
          Ver en la plataforma <ExternalLink size={15} strokeWidth={2} />
        </a>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 22, display: "flex", flexDirection: "column", gap: 16, fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)" }}>
        <p>
          Vista previa del informe dentro de tu dashboard. El documento completo —con tablas de
          volatilidad implícita, niveles clave y la operativa modelo— está disponible en formato PDF
          en la plataforma.
        </p>
        <p>
          Pulsa <strong style={{ color: "var(--text-primary)" }}>«Abrir informe completo»</strong> para descargar el PDF.
        </p>
      </div>
    </article>
  )
}
