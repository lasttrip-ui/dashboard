import { informes } from "@/lib/content"
import InformeCard from "@/components/lab/InformeCard"

export default function InformesPage() {
  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
          Premium
        </span>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Informes especiales</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Informes mensuales de mercado y análisis de volatilidad implícita por subyacente.
        </p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {informes.map((inf) => (
          <InformeCard key={inf.id} informe={inf} />
        ))}
      </div>
    </div>
  )
}
