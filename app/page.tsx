import Link from "next/link"
import { CandlestickChart } from "lucide-react"
import { trades } from "@/lib/data"
import { calcStats, fmtDollar, fmtNumber } from "@/lib/utils"
import { informes, TIPOS, USER } from "@/lib/content"
import ContentExplorer from "@/components/lab/ContentExplorer"
import InformeCard from "@/components/lab/InformeCard"
import SectionHead from "@/components/lab/SectionHead"

export default function OverviewPage() {
  const stats = calcStats(trades)
  const contentTotal = TIPOS.reduce((sum, t) => sum + t.count, 0)
  const recentInformes = [...informes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  const heroStats = [
    { num: String(contentTotal), label: "Contenidos" },
    { num: String(informes.length), label: "Informes" },
    { num: fmtDollar(stats.totalPnl, 0), label: "P&L operativa", accent: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" },
    { num: `${fmtNumber(stats.winRate, 0)}%`, label: "Win rate" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* ── Hero ── */}
      <header
        className="lol-hero animate-in"
        style={{
          background: "linear-gradient(135deg,#0b1120 0%,#131c2e 60%,#1e293b 100%)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 32,
          display: "flex",
          gap: 32,
          alignItems: "flex-end",
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-8%",
            width: 280,
            height: 280,
            background: "radial-gradient(circle, rgba(251,191,36,0.16), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber)" }}>
            Dashboard
          </span>
          <h1 style={{ fontSize: 32, color: "#f8fafc", margin: "6px 0 8px", lineHeight: 1.1 }}>
            Hola, {USER.name}
          </h1>
          <span className="lab-badge lab-badge--premium" style={{ fontSize: 12, padding: "5px 12px" }}>
            Premium
          </span>
          <p style={{ fontSize: 15, color: "#cbd5e1", margin: "12px 0 0", maxWidth: 520, lineHeight: 1.55 }}>
            Acceso completo. Hay <strong style={{ color: "#f8fafc" }}>{contentTotal} contenidos</strong> y{" "}
            <strong style={{ color: "#f8fafc" }}>{informes.length} informes</strong>, y tu operativa lleva{" "}
            <strong style={{ color: stats.totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmtDollar(stats.totalPnl, 0)}</strong> acumulados.
          </p>
        </div>
        <div className="lol-hero-stats" style={{ display: "flex", gap: 24, flex: 1, justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
          {heroStats.map((s) => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <span className="num" style={{ display: "block", fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700, color: s.accent ?? "var(--amber)", lineHeight: 1 }}>
                {s.num}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Recent content ── */}
      <section>
        <SectionHead title="Contenido reciente" href="/contenido" />
        <ContentExplorer limit={8} />
      </section>

      {/* ── Trading summary strip ── */}
      <section>
        <SectionHead title="Tu operativa" href="/operativa" linkLabel="Ver operativa" />
        <Link
          href="/operativa"
          className="lol-operativa-strip"
          style={{
            display: "grid",
            gridTemplateColumns: "auto repeat(4, 1fr)",
            gap: 24,
            alignItems: "center",
            padding: "22px 24px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--amber-dim)",
              border: "1px solid rgba(251,191,36,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--amber)",
            }}
          >
            <CandlestickChart size={24} strokeWidth={1.75} />
          </div>
          <Stat label="P&L total" value={fmtDollar(stats.totalPnl, 0)} accent={stats.totalPnl >= 0 ? "var(--green)" : "var(--red)"} />
          <Stat label="Win rate" value={`${fmtNumber(stats.winRate, 0)}%`} />
          <Stat label="Operaciones" value={String(stats.tradeCount)} />
          <Stat label="Profit factor" value={stats.profitFactor >= 999 ? "∞" : fmtNumber(stats.profitFactor, 2)} />
        </Link>
      </section>

      {/* ── Reports ── */}
      <section>
        <SectionHead title="Informes especiales" href="/informes" linkLabel="Ver todos" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {recentInformes.map((inf) => (
            <InformeCard key={inf.id} informe={inf} />
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .lol-hero { flex-direction: column; align-items: stretch; padding: 20px; gap: 16px; }
          .lol-hero-stats { justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid #1e293b; }
          .lol-hero-stats > div { text-align: left; }
          .lol-operativa-strip { grid-template-columns: 1fr 1fr !important; }
          .lol-operativa-strip > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <span className="num" style={{ display: "block", fontSize: 22, fontWeight: 700, color: accent ?? "var(--text-primary)", lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
}
