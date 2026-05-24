"use client"

import { useEffect, useState } from "react"
import { trades } from "@/lib/data"
import {
  calcStats,
  filterByPeriod,
  PeriodKey,
  TODAY,
} from "@/lib/utils"
import { useLocalStorage } from "@/lib/store"
import Header from "@/components/Header"
import KpiCards from "@/components/KpiCards"
import Calendar from "@/components/Calendar"
import TickersSidebar from "@/components/TickersSidebar"
import TradesTable from "@/components/TradesTable"

const PERIOD_LABELS: Record<PeriodKey, string> = {
  mes: "PERÍODO",
  anio: "ESTE AÑO",
  todo: "TOTAL",
}

export default function DashboardPage() {
  const [theme, setTheme] = useLocalStorage<"dark" | "light">("tt-theme", "dark")
  const [period, setPeriod] = useLocalStorage<PeriodKey>("tt-period", "anio")

  // Calendar / table month state (starts at April 2026)
  const [viewYear, setViewYear] = useState(2026)
  const [viewMonth, setViewMonth] = useState(4)

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  function handleMonthChange(y: number, m: number) {
    setViewYear(y)
    setViewMonth(m)
  }

  const periodTrades = filterByPeriod(trades, period)
  const stats = calcStats(periodTrades)

  const periodLabel = PERIOD_LABELS[period]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header
        theme={theme}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        period={period}
        onPeriodChange={setPeriod}
      />

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Section 1: KPI Cards */}
        <section style={{ marginBottom: "1.5rem" }}>
          <KpiCards stats={stats} periodLabel={periodLabel} />
        </section>

        {/* Section 2: Calendar + Sidebar */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", marginBottom: "1.5rem" }}>
          <Calendar
            trades={trades}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onMonthChange={handleMonthChange}
          />
          <TickersSidebar
            trades={trades}
            viewYear={viewYear}
            viewMonth={viewMonth}
          />
        </section>

        {/* Section 3: Trades Table */}
        <section>
          <TradesTable
            trades={trades}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onMonthChange={handleMonthChange}
          />
        </section>
      </main>
    </div>
  )
}
