"use client"

import { useMemo, useState } from "react"
import { LayoutGrid, FileText } from "lucide-react"
import {
  content as allContent,
  informes as allInformes,
  TIPOS,
  ContentTipo,
} from "@/lib/content"
import ContentCard from "./ContentCard"
import InformeCard from "./InformeCard"

type Tab = "all" | ContentTipo | "informes"

export default function ContentExplorer({
  limit,
  withInformes = true,
}: {
  limit?: number
  withInformes?: boolean
}) {
  const [tab, setTab] = useState<Tab>("all")

  const sorted = useMemo(
    () => [...allContent].sort((a, b) => b.date.localeCompare(a.date)),
    []
  )

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "all", label: "Todo" },
    ...TIPOS.filter((t) => sorted.some((c) => c.tipo === t.key)).map((t) => ({
      key: t.key as Tab,
      label: t.label,
    })),
    ...(withInformes ? [{ key: "informes" as Tab, label: "Informes", badge: allInformes.length }] : []),
  ]

  const items =
    tab === "all"
      ? sorted
      : tab === "informes"
      ? []
      : sorted.filter((c) => c.tipo === tab)

  const shown = limit ? items.slice(0, limit) : items

  return (
    <div>
      <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18, padding: 5, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                background: active ? "var(--bg-primary)" : "transparent",
                color: active ? "var(--amber)" : "var(--text-secondary)",
              }}
            >
              {t.key === "all" && <LayoutGrid size={14} strokeWidth={1.75} />}
              {t.key === "informes" && <FileText size={14} strokeWidth={1.75} />}
              {t.label}
              {t.badge != null && (
                <span style={{ background: "var(--amber)", color: "#0b1120", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {tab === "informes" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {allInformes.map((inf) => (
            <InformeCard key={inf.id} informe={inf} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 16 }} className="animate-in">
          {shown.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
