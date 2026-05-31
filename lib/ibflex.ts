import type { OptionTrade } from "./data"

export interface IBFlexConfig {
  token: string
  queryId: string
}

export interface IBFlexResult {
  trades: OptionTrade[]
  accountId: string
  fetchedAt: string
  warnings: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function attr(el: Element, ...names: string[]): string {
  for (const n of names) {
    const v = el.getAttribute(n) ?? el.getAttribute(n.toLowerCase()) ?? el.getAttribute(n.toUpperCase())
    if (v && v.trim() !== "") return v.trim()
  }
  return ""
}

function parseIBDate(d: string): string {
  if (!d) return ""
  // "20260115" → "2026-01-15"
  if (/^\d{8}$/.test(d)) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
  // Already "2026-01-15"
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
  // "01/15/2026"
  const us = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (us) return `${us[3]}-${us[1]}-${us[2]}`
  return d
}

function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000))
}

function parseNum(s: string): number {
  if (!s) return 0
  return parseFloat(s.replace(/,/g, "")) || 0
}

// Position key for matching opens to closes
function posKey(el: Element): string {
  const sym = attr(el, "underlyingSymbol", "symbol").split(" ")[0]
  const pc  = attr(el, "putCall")
  const str = attr(el, "strike")
  const exp = parseIBDate(attr(el, "expiry", "expiryDate", "lastTradeDT"))
  return `${sym}|${pc}|${str}|${exp}`
}

// ── Main parser ─────────────────────────────────────────────────────────────

export function parseUploadedXml(xml: string): IBFlexResult {
  const warnings: string[] = []

  // Support both XML and plain-text errors from IB
  if (!xml.includes("<")) {
    throw new Error(`IB devolvió texto plano: ${xml.slice(0, 200)}`)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "text/xml")

  const parseErr = doc.querySelector("parsererror")
  if (parseErr) throw new Error("XML inválido: " + parseErr.textContent?.slice(0, 100))

  const ibErr = doc.querySelector("FlexStatementResponse Status")
  if (ibErr?.textContent === "Warn" || ibErr?.textContent === "Fail") {
    const msg = attr(doc.documentElement, "ErrorMessage") || doc.querySelector("ErrorMessage")?.textContent || "Error desconocido de IB"
    throw new Error(`IB: ${msg}`)
  }

  const stmt = doc.querySelector("FlexStatement")
  const accountId = attr(stmt ?? doc.documentElement, "accountId", "AccountId", "ACCTID")

  const allTradeEls = Array.from(doc.querySelectorAll("Trade, TradeConfirm"))

  if (allTradeEls.length === 0) {
    warnings.push("No se encontraron elementos <Trade> en el XML. Asegúrate de que tu Flex Query incluya 'Trades' con assetCategory=OPT.")
    return { trades: [], accountId, fetchedAt: new Date().toISOString(), warnings }
  }

  // Separate option trades
  const optTrades = allTradeEls.filter(el => {
    const cat = attr(el, "assetCategory", "AssetClass")
    return cat === "OPT" || cat === "Option"
  })

  if (optTrades.length === 0) {
    const cats = [...new Set(allTradeEls.map(el => attr(el, "assetCategory", "AssetClass") || "?"))].join(", ")
    warnings.push(`Se encontraron ${allTradeEls.length} trades pero ninguno con assetCategory=OPT. Categorías encontradas: ${cats}`)
    return { trades: [], accountId, fetchedAt: new Date().toISOString(), warnings }
  }

  // Group by position key: collect opens (SELL O) and closes (BUY C)
  const opens  = new Map<string, Element[]>()
  const closes = new Map<string, Element[]>()

  for (const el of optTrades) {
    const buySell = attr(el, "buySell", "BuySell").toUpperCase()
    const oci     = attr(el, "openCloseIndicator", "OpenClose").toUpperCase()
    const key     = posKey(el)

    const isSellOpen  = buySell.includes("SELL") && (oci.includes("O") || oci === "")
    const isBuyClose  = buySell.includes("BUY")  && (oci.includes("C") || oci === "")

    if (isSellOpen) {
      const arr = opens.get(key) ?? []
      arr.push(el)
      opens.set(key, arr)
    } else if (isBuyClose) {
      const arr = closes.get(key) ?? []
      arr.push(el)
      closes.set(key, arr)
    }
  }

  const trades: OptionTrade[] = []

  opens.forEach((openEls, key) => {
    const closeEls = closes.get(key) ?? []

    // Total qty sold vs bought back
    const totalSold   = openEls.reduce((s, el) => s + Math.abs(parseNum(attr(el, "quantity"))), 0)
    const totalBought = closeEls.reduce((s, el) => s + Math.abs(parseNum(attr(el, "quantity"))), 0)

    // Weighted avg open premium
    const totalProceeds = openEls.reduce((s, el) => s + Math.abs(parseNum(attr(el, "tradePrice"))), 0)
    const avgPremium = openEls.length > 0 ? totalProceeds / openEls.length : 0

    // Weighted avg close price
    const avgClose = closeEls.length > 0
      ? closeEls.reduce((s, el) => s + Math.abs(parseNum(attr(el, "tradePrice"))), 0) / closeEls.length
      : undefined

    const firstOpen = openEls[0]
    const putCall   = attr(firstOpen, "putCall", "PutCall").toUpperCase()
    const rawDate   = attr(firstOpen, "tradeDate", "TradeDate")
    const rawExpiry = attr(firstOpen, "expiry", "expiryDate", "lastTradeDT", "Expiry")
    const date      = parseIBDate(rawDate)
    const expiration = parseIBDate(rawExpiry)
    const ticker    = attr(firstOpen, "underlyingSymbol", "UnderlyingSymbol", "symbol").split(" ")[0]
    const tradeId   = attr(firstOpen, "tradeID", "TradeID", "transactionID") || `${key}-${date}`

    // Mark price (closePrice attribute = end-of-day mark, not the closing trade)
    const markPrice = parseNum(attr(firstOpen, "closePrice"))

    const isClosed = totalBought >= totalSold * 0.99
    const isExpired = avgClose !== undefined && avgClose < 0.01

    trades.push({
      id: `ib-${tradeId}`,
      date,
      ticker,
      type: putCall === "P" || putCall.startsWith("PUT") ? "Put" : "Call",
      action: "SELL",
      qty: Math.round(totalSold),
      premium: avgPremium,
      expiration,
      dteTotalAtOpen: daysBetween(date, expiration),
      currentPrice: isClosed ? 0 : markPrice,
      closePrice: isClosed ? (isExpired ? 0 : (avgClose ?? undefined)) : undefined,
      status: isClosed ? "closed" : "open",
    })
  })

  trades.sort((a, b) => b.date.localeCompare(a.date))

  if (trades.length === 0) {
    warnings.push(`Se encontraron ${optTrades.length} opciones pero ninguna con SELL (apertura). Revisa que tu Flex Query incluya ventas de apertura.`)
  }

  return { trades, accountId, fetchedAt: new Date().toISOString(), warnings }
}

// ── Direct IB API fetch (blocked by CORS in browser) ──────────────────────

const SEND_REQUEST = "https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest"
const GET_STATEMENT = "https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement"

export async function fetchIBFlexQuery(config: IBFlexConfig): Promise<IBFlexResult> {
  const reqXml = await fetch(`${SEND_REQUEST}?t=${config.token}&q=${config.queryId}&v=3`).then(r => r.text())
  const refMatch = reqXml.match(/<ReferenceCode>(.*?)<\/ReferenceCode>/)
  if (!refMatch) {
    const errMatch = reqXml.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)
    throw new Error(errMatch ? errMatch[1] : "No ReferenceCode en la respuesta de IB")
  }
  await new Promise(r => setTimeout(r, 2500))
  let xml = ""
  for (let i = 0; i < 4; i++) {
    xml = await fetch(`${GET_STATEMENT}?q=${refMatch[1]}&t=${config.token}&v=3`).then(r => r.text())
    if (!xml.includes("Status>In Progress") && !xml.includes("ErrorCode>1019")) break
    await new Promise(r => setTimeout(r, 3000 * (i + 1)))
  }
  return parseUploadedXml(xml)
}
