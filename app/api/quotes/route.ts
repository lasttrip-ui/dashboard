import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Simple in-memory cache (per serverless instance)
const cache = new Map<string, { price: number; ts: number }>()
const TTL = 60_000 // 1 minute

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  const hit = cache.get(symbol)
  if (hit && Date.now() - hit.ts < TTL) return hit.price
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof price === "number" && price > 0) {
      cache.set(symbol, { price, ts: Date.now() })
      return price
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols")
  if (!symbolsParam) {
    return NextResponse.json({ error: "missing symbols" }, { status: 400 })
  }
  const symbols = symbolsParam.split(",").map(s => s.trim()).filter(Boolean).slice(0, 150)

  // Fetch in parallel batches of 20
  const quotes: Record<string, number> = {}
  for (let i = 0; i < symbols.length; i += 20) {
    const batch = symbols.slice(i, i + 20)
    const results = await Promise.all(batch.map(s => fetchYahooPrice(s)))
    batch.forEach((s, j) => {
      const p = results[j]
      if (p !== null) quotes[s] = p
    })
  }

  return NextResponse.json(
    { quotes, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
  )
}
