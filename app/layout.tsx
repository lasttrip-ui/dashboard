import type { Metadata } from "next"
import "./globals.css"
import AppShell from "@/components/lab/AppShell"

export const metadata: Metadata = {
  title: "LWS Options Lab — Dashboard",
  description:
    "Plataforma de opciones financieras: contenido, informes y tu operativa de venta de opciones en un solo lugar.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
