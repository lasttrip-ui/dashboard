import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function SectionHead({
  title,
  href,
  linkLabel = "Ver todo",
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        marginBottom: 18,
        flexWrap: "wrap",
      }}
    >
      <h2 style={{ fontSize: 22, color: "var(--text-primary)" }}>{title}</h2>
      {href && (
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--amber-600)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {linkLabel} <ArrowRight size={14} strokeWidth={1.75} />
        </Link>
      )}
    </header>
  )
}
