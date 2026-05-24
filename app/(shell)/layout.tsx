"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useSettings } from "@/lib/store";
import { useEffect } from "react";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
