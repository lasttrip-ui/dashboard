import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tortuga Trades",
  description: "Personal IB trading dashboard — Forex, Crypto, Stocks, Futures",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
