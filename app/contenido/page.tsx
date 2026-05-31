import ContentExplorer from "@/components/lab/ContentExplorer"

export default function ContenidoPage() {
  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          Biblioteca
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Todo el contenido</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Artículos, directos, talleres, Q&amp;A, vídeos e informes especiales.
        </p>
      </header>
      <ContentExplorer />
    </div>
  )
}
