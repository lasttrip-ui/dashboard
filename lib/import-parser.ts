import type { OptionTrade } from "./data"

export type Broker = "IBKR" | "DeGiro"

// ── CSV line parser (handles quoted fields) ───────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ }
    else if (c === "," && !inQ) { result.push(cur.trim()); cur = "" }
    else { cur += c }
  }
  result.push(cur.trim())
  return result
}

// ── Date normalizers ──────────────────────────────────────────────────────────

function toISO(d: string): string {
  if (!d) return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
  // DD-MM-YYYY or DD/MM/YYYY
  const m = d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3]
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  }
  return d
}

function dte(open: string, exp: string): number {
  const diff = new Date(exp).getTime() - new Date(open).getTime()
  return Math.max(0, Math.round(diff / 86_400_000))
}

// ── IBKR option symbol: "ZETA  241115P00025000" ──────────────────────────────

function parseIBKRSym(sym: string): { ticker: string; expiration: string; type: "Put" | "Call"; strike: number } | null {
  const s = sym.replace(/"/g, "").trim()
  const m = s.match(/^([A-Z.]+)\s+(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/)
  if (!m) return null
  const [, ticker, yy, mm, dd, cp, strikeRaw] = m
  return {
    ticker,
    expiration: `20${yy}-${mm}-${dd}`,
    type: cp === "C" ? "Call" : "Put",
    strike: parseInt(strikeRaw) / 1000,
  }
}

// ── IBKR Activity Statement CSV ───────────────────────────────────────────────
// Sección "Trades" (EN) o "Transacciones" (ES), columnas:
// [0] section  [1] Data  [2] Order  [3] Asset Category  [4] Currency
// [5] Symbol   [6] Date/Time  [7] Quantity  [8] T.Price ...

export function parseIBKR(csv: string): OptionTrade[] {
  const trades: OptionTrade[] = []
  const lines = csv.split(/\r?\n/)
  let idxCounter = 0

  for (const line of lines) {
    const cols = parseLine(line)
    const section = cols[0]?.toLowerCase()
    const tag = cols[1]?.toLowerCase()
    const category = cols[3]?.toLowerCase()

    const isTradeData =
      (section === "trades" || section === "transacciones") &&
      (tag === "data" || tag === "datos") &&
      (category === "options" || category === "opciones")

    if (!isTradeData) continue

    const sym = cols[5] || ""
    const parsed = parseIBKRSym(sym)
    if (!parsed) continue

    const dateRaw = cols[6] || ""
    const date = toISO(dateRaw.split(",")[0].trim())
    if (!date) continue

    const qty = parseFloat(cols[7] || "0")
    const price = Math.abs(parseFloat(cols[8] || "0"))

    // Negative qty = SELL (short option), positive = BUY (close/long)
    if (qty >= 0) continue

    idxCounter++
    trades.push({
      id: `ibkr_imp_${date}_${parsed.ticker}_${idxCounter}`,
      date,
      ticker: parsed.ticker,
      type: parsed.type,
      action: "SELL",
      qty: Math.abs(qty),
      premium: price,
      expiration: parsed.expiration,
      dteTotalAtOpen: dte(date, parsed.expiration),
      currentPrice: 0,
      status: "open",
    })
  }

  return trades
}

// ── DeGiro Transaction CSV ────────────────────────────────────────────────────
// Columnas ES: Fecha, Hora, Producto, ISIN, Bolsa, Cantidad, Precio, Valor local, ...
// Columnas EN: Date, Time, Product, ISIN, Exchange, Quantity, Price, Local value, ...
// Opciones: producto como "APPLE INC. CALL 21/01/22 150.00" o "PUT OPTION ..."

function parseDeGiroProduct(product: string): { ticker: string; type: "Put" | "Call"; expiration: string } | null {
  const p = product.toUpperCase()
  const m = p.match(/([A-Z.]+)\s+(CALL|PUT)\s+(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})\s+([\d.]+)/)
  if (m) {
    const [, , cp, dd, mm2, yy] = m
    const year = yy.length === 2 ? "20" + yy : yy
    // DeGiro uses DD/MM/YY
    const expiration = `${year}-${mm2.padStart(2, "0")}-${dd.padStart(2, "0")}`
    const ticker = product.split(/\s+/)[0].toUpperCase()
    return { ticker, type: cp === "CALL" ? "Call" : "Put", expiration }
  }
  // Alternative: "PUT OPTION ON AAPL ..."
  const m2 = p.match(/(CALL|PUT)\s+OPTION.*?([A-Z]{2,5})\s+EXP\s+(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/)
  if (m2) {
    const [, cp, ticker, dd, mm2, yy] = m2
    const year = yy.length === 2 ? "20" + yy : yy
    return { ticker, type: cp === "CALL" ? "Call" : "Put", expiration: `${year}-${mm2}-${dd}` }
  }
  return null
}

export function parseDeGiro(csv: string): OptionTrade[] {
  const trades: OptionTrade[] = []
  const lines = csv.split(/\r?\n/)
  let idxCounter = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length < 7) continue

    const dateRaw = cols[0]
    const product = cols[2] || ""
    const qty = parseFloat(cols[5] || "0")
    const price = Math.abs(parseFloat((cols[6] || "0").replace(",", ".")))

    if (!product) continue

    const parsed = parseDeGiroProduct(product)
    if (!parsed) continue

    // DeGiro: negative quantity = sell
    if (qty >= 0) continue

    const date = toISO(dateRaw)
    if (!date) continue

    idxCounter++
    trades.push({
      id: `degiro_imp_${date}_${parsed.ticker}_${idxCounter}`,
      date,
      ticker: parsed.ticker,
      type: parsed.type,
      action: "SELL",
      qty: Math.abs(qty),
      premium: price,
      expiration: parsed.expiration,
      dteTotalAtOpen: dte(date, parsed.expiration),
      currentPrice: 0,
      status: "open",
    })
  }

  return trades
}

// ── Generic executions parser (all asset types, all years) ───────────────────
// Reads the "Operaciones"/"Trades" section of an IBKR Activity Statement and
// returns every stock/option execution as a calendar-compatible execution.

export interface ImportedExecution {
  tradeId: string
  symbol: string
  secType: string
  side: "BUY" | "SELL"
  size: number
  price: number
  tradeTime: string
  commission: number
  netAmount: number
  realizedPnl: number
}

const STOCK_CATS = ["acciones", "stocks"]
const OPTION_CATS = ["opciones", "equity and index options", "opciones sobre acciones y sobre índices", "opciones sobre acciones"]

function num(s: string | undefined): number {
  if (!s) return 0
  const v = parseFloat(s.replace(/"/g, "").replace(",", "."))
  return isNaN(v) ? 0 : v
}

export function parseIBKRExecutions(csv: string): ImportedExecution[] {
  const out: ImportedExecution[] = []
  const lines = csv.split(/\r?\n/)
  let cols: Record<string, number> = {}
  let counter = 0

  for (const line of lines) {
    const c = parseLine(line)
    const section = (c[0] || "").toLowerCase()
    if (section !== "operaciones" && section !== "trades" && section !== "transacciones") continue

    const rowType = (c[1] || "").toLowerCase()

    if (rowType === "header") {
      // Map column names (ES/EN) to indices
      cols = {}
      c.forEach((name, i) => {
        const n = name.toLowerCase().trim()
        if (n === "categoría de activo" || n === "asset category") cols.cat = i
        if (n === "divisa" || n === "currency") cols.ccy = i
        if (n === "símbolo" || n === "symbol") cols.sym = i
        if (n === "fecha/hora" || n === "date/time") cols.dt = i
        if (n === "cantidad" || n === "quantity") cols.qty = i
        if (n === "precio trans." || n === "t. price" || n === "precio de transacción") cols.price = i
        if (n === "productos" || n === "proceeds") cols.proceeds = i
        if (n.startsWith("tarifa/com") || n.startsWith("comm")) cols.comm = i
        if (n === "pyg realizadas" || n === "realized p/l") cols.pnl = i
        if (n === "datadiscriminator") cols.disc = i
      })
      continue
    }

    if (rowType !== "data" && rowType !== "datos") continue
    if (cols.sym === undefined || cols.dt === undefined) continue

    const disc = (c[cols.disc] || "").toLowerCase()
    if (cols.disc !== undefined && disc !== "order" && disc !== "trade") continue

    const cat = (c[cols.cat] || "").toLowerCase()
    const isStock = STOCK_CATS.some(s => cat.includes(s) && !cat.includes("opciones"))
    const isOption = OPTION_CATS.some(s => cat.includes(s))
    if (!isStock && !isOption) continue // skip forex, CFDs, etc.

    const rawSym = (c[cols.sym] || "").trim()
    if (!rawSym) continue
    // Options symbol like "ZETA 15NOV24 25 P" → underlying ticker
    const symbol = rawSym.split(/\s+/)[0]

    const dtRaw = (c[cols.dt] || "").replace(/"/g, "")
    const dPart = dtRaw.split(",")[0].trim()
    const tPart = (dtRaw.split(",")[1] || "00:00:00").trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dPart)) continue

    const qty = num(c[cols.qty])
    if (qty === 0) continue
    const price = num(c[cols.price])

    counter++
    out.push({
      tradeId: `imp_${dPart}_${symbol}_${counter}`,
      symbol,
      secType: isOption ? "OPT" : "STK",
      side: qty < 0 ? "SELL" : "BUY",
      size: Math.abs(qty),
      price,
      tradeTime: `${dPart}T${tPart}Z`,
      commission: Math.abs(num(c[cols.comm])),
      netAmount: Math.abs(num(c[cols.proceeds])),
      realizedPnl: num(c[cols.pnl]),
    })
  }

  return out.sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))
}

// ── IBKR Dividend CSV parser ─────────────────────────────────────────────────
// Section "Dividendos"/"Dividends" in activity statement
// Columns: [0]section [1]type [2]currency [3]date [4]description [5]amount

export interface ImportedDividend {
  date: string       // YYYY-MM-DD
  company: string    // ticker extracted from description
  amount: number     // positive only (skip withholding tax lines)
  currency: string
  description: string
}

export function parseIBKRDividends(csv: string): ImportedDividend[] {
  const out: ImportedDividend[] = []
  const lines = csv.split(/\r?\n/)

  for (const line of lines) {
    const c = parseLine(line)
    const section = (c[0] || "").toLowerCase()
    if (section !== "dividendos" && section !== "dividends") continue

    const rowType = (c[1] || "").toLowerCase()
    if (rowType !== "data" && rowType !== "datos") continue

    const currency = (c[2] || "USD").replace(/"/g, "").trim()
    const dateRaw = (c[3] || "").replace(/"/g, "").trim()
    const description = (c[4] || "").replace(/"/g, "").trim()
    const amountRaw = (c[5] || "").replace(/"/g, "").trim()

    const date = toISO(dateRaw)
    if (!date) continue

    const amount = parseFloat(amountRaw.replace(",", "."))
    if (isNaN(amount) || amount <= 0) continue  // skip withholding tax (negative amounts)

    // Extract ticker: "VICI PROPERTIES INC(US...) Cash Dividend..." → "VICI"
    const beforeParen = description.split("(")[0].trim()
    const company = beforeParen.split(/\s+/)[0].toUpperCase()
    if (!company) continue

    out.push({ date, company, amount, currency, description })
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}

// ── DeGiro Account statement CSV (cash movements) ─────────────────────────────
// Columnas: Fecha, Hora, Fecha valor, Producto, ISIN, Descripción, Tipo, [ccy, Variación], [ccy, Saldo], ID Orden
// La fila de "Dividendo" trae el importe bruto; "Retención del dividendo" es la retención (negativa) y se ignora.

export function parseDeGiroDividends(csv: string): ImportedDividend[] {
  const out: ImportedDividend[] = []
  const lines = csv.split(/\r?\n/)

  for (let i = 1; i < lines.length; i++) {
    const c = parseLine(lines[i])
    if (c.length < 9) continue

    const description = (c[5] || "").trim()
    if (description.toLowerCase() !== "dividendo" && description.toLowerCase() !== "dividend") continue

    const product = (c[3] || "").trim()
    if (!product) continue

    const date = toISO(c[0] || "")
    if (!date) continue

    const currency = (c[7] || "EUR").trim()
    const amount = parseFloat((c[8] || "").replace(",", "."))
    if (isNaN(amount) || amount <= 0) continue

    out.push({ date, company: product, amount, currency, description: product })
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}

// ── Auto-detect broker ────────────────────────────────────────────────────────

export function detectBroker(csv: string): Broker {
  const header = csv.slice(0, 1000).toLowerCase()
  if (header.includes("statement of funds") || header.includes("account information") || header.includes("ibkr") || header.includes("interactive brokers") || header.includes("transacciones,") || header.includes("trades,")) {
    return "IBKR"
  }
  if (header.includes("degiro") || header.includes("bolsa de valores") || header.includes("isin")) {
    return "DeGiro"
  }
  return "IBKR" // fallback
}

export function parseCSV(csv: string, broker: Broker): OptionTrade[] {
  return broker === "IBKR" ? parseIBKR(csv) : parseDeGiro(csv)
}
