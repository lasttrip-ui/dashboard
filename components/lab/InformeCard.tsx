"use client"

import { ArrowRight, FileText } from "lucide-react"
import { Informe, formatDateEs } from "@/lib/content"

export default function InformeCard({ informe }: { informe: Informe }) {
  const href = `https://lwsoptionslab.com/informes/${informe.slug}`
  const color = informe.tickerColor ?? "var(--amber)"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lol-informe-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--bg-card)",
        transition: "border-color .15s, transform .15s",
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 10,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `color-mix(in srgb, ${color} 13%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
          color,
        }}
      >
        {informe.ticker ? (
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em" }}>{informe.ticker}</span>
        ) : (
          <FileText size={22} strokeWidth={1.75} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDateEs(informe.date)}</span>
          <span className={`lab-badge lab-badge--${informe.access}`}>
            {informe.access === "premium" ? "Premium" : informe.access === "free" ? "Gratis" : "Freemium"}
          </span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px", lineHeight: 1.3 }}>
          {informe.title}
        </h3>
        {informe.excerpt && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
            {informe.excerpt}
          </p>
        )}
      </div>
      <ArrowRight size={16} strokeWidth={1.75} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
    </a>
  )
}
