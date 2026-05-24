import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Tortuga_Trades Dashboard",
  description: "Interactive Brokers options trading dashboard — premium collection strategy",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
