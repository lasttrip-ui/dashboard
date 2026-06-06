"use client"

import { useEffect, useState } from "react"
import AppSidebar from "@/components/layout/AppSidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = localStorage.getItem("tt-theme") as "dark" | "light" | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("tt-theme", next)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AppSidebar theme={theme} onThemeToggle={toggleTheme} />
      <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {children}
      </div>
    </div>
  )
}
