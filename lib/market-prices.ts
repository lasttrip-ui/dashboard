"use client"

import { useCallback } from "react"
import { useLocalStorage } from "./store"

export interface PriceCache {
  [ticker: string]: {
    price: number
    currency: string
    updatedAt: string
  }
}

const KEY = "lol-market-prices"

export function useMarketPrices() {
  const [cache, setCache] = useLocalStorage<PriceCache>(KEY, {})

  const setPrice = useCallback((ticker: string, price: number, currency = "USD") => {
    setCache({ ...cache, [ticker]: { price, currency, updatedAt: new Date().toISOString() } })
  }, [setCache, cache])

  const getPrice = useCallback((ticker: string) => cache[ticker] ?? null, [cache])

  return { cache, setPrice, getPrice }
}

// Fetch quote from Yahoo Finance (CORS-friendly)
export async function fetchYahooPrice(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
      { headers: { Accept: "application/json" } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    const currency = data?.chart?.result?.[0]?.meta?.currency ?? "USD"
    if (!price) return null
    return { price, currency }
  } catch {
    return null
  }
}

// Map DeGiro exchange suffix to Yahoo Finance suffix
export function toYahooTicker(ticker: string, bolsa: string): string {
  const suffixes: Record<string, string> = {
    MAD: ".MC", XMAD: ".MC", MESI: ".MC",
    AMS: ".AS", XAMS: ".AS",
    EPA: ".PA", XPAR: ".PA",
    ETR: ".DE", XETR: ".DE",
    LSE: ".L", XLON: ".L",
    MIL: ".MI", XMIL: ".MI",
    BRU: ".BR", XBRU: ".BR",
  }
  const suffix = suffixes[bolsa?.toUpperCase()] ?? ""
  return `${ticker}${suffix}`
}
