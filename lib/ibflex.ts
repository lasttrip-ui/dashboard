import type { OptionTrade } from "./data"

// IB Flex Query endpoints
const SEND_REQUEST = "https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest"
const GET_STATEMENT = "https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement"

export interface IBFlexConfig {
  token: string
  queryId: string
}

export interface IBFlexResult {
  trades: OptionTrade[]
  accountId: string
  fetchedAt: string
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from)
  const b = new Date(to)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

function parseIBDate(d: string): string {
  // IB dates: "20260115" → "2026-01-15"
  if (!d || d.length < 8) return d
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function parseTradeXml(xml: string): IBFlexResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "text/xml")

  const stmt = doc.querySelector("FlexStatement")
  const accountId = stmt?.getAttribute("accountId") ?? ""

  const tradeEls = Array.from(doc.querySelectorAll("Trade"))
  const trades: OptionTrade[] = []

  for (const el of tradeEls) {
    if (el.getAttribute("assetCategory") !== "OPT") continue
    const buySell = el.getAttribute("buySell") ?? ""
    if (!buySell.includes("SELL")) continue

    const putCall = el.getAttribute("putCall") ?? ""
    if (!putCall) continue

    const rawDate = el.getAttribute("tradeDate") ?? ""
    const rawExpiry = el.getAttribute("expiry") ?? el.getAttribute("expiryDate") ?? ""
    const date = parseIBDate(rawDate)
    const expiration = parseIBDate(rawExpiry)

    const qty = Math.abs(parseFloat(el.getAttribute("quantity") ?? "0"))
    const premium = Math.abs(parseFloat(el.getAttribute("tradePrice") ?? "0"))
    const closePrice = parseFloat(el.getAttribute("closePrice") ?? "0")
    const openClose = el.getAttribute("openCloseIndicator") ?? ""
    const ticker = el.getAttribute("underlyingSymbol") ?? el.getAttribute("symbol")?.split(" ")[0] ?? ""
    const tradeId = el.getAttribute("tradeID") ?? el.getAttribute("transactionID") ?? String(Date.now())

    trades.push({
      id: `ib-${tradeId}`,
      date,
      ticker,
      type: putCall === "P" ? "Put" : "Call",
      action: "SELL",
      qty,
      premium,
      expiration,
      dteTotalAtOpen: daysBetween(date, expiration),
      currentPrice: openClose === "O" ? closePrice : 0,
      closePrice: openClose === "C" ? closePrice : undefined,
      status: openClose === "C" ? "closed" : "open",
    })
  }

  return { trades, accountId, fetchedAt: new Date().toISOString() }
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    // IB may respond with "Statement generation in progress" — retry
    if (text.includes("Status>In Progress") || text.includes("ErrorCode>1019")) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs))
      continue
    }
    return text
  }
  throw new Error("IB report still generating after retries")
}

export async function fetchIBFlexQuery(config: IBFlexConfig): Promise<IBFlexResult> {
  // Step 1 — request the report
  const reqUrl = `${SEND_REQUEST}?t=${config.token}&q=${config.queryId}&v=3`
  const reqXml = await fetch(reqUrl).then(r => r.text())

  const refMatch = reqXml.match(/<ReferenceCode>(.*?)<\/ReferenceCode>/)
  if (!refMatch) {
    const errMatch = reqXml.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)
    throw new Error(errMatch ? errMatch[1] : "No ReferenceCode in IB response")
  }
  const referenceCode = refMatch[1]

  // Step 2 — wait for report, then download
  await new Promise(r => setTimeout(r, 2000))
  const stmtUrl = `${GET_STATEMENT}?q=${referenceCode}&t=${config.token}&v=3`
  const xml = await fetchWithRetry(stmtUrl)

  return parseTradeXml(xml)
}

export function parseUploadedXml(xml: string): IBFlexResult {
  return parseTradeXml(xml)
}
