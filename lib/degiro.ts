export interface DeGiroRow {
  fecha: string       // DD-MM-YYYY
  hora: string
  producto: string
  isin: string
  bolsa: string
  qty: number         // positive=buy, negative=sell
  precio: number
  currency: string
  valorEur: number
  totalEur: number
  orderId: string
  isCorporateAction: boolean
}

export interface Position {
  isin: string
  ticker: string      // derived from product name
  producto: string
  bolsa: string
  shares: number
  avgCost: number     // EUR per share
  totalInvested: number
  realizedPnl: number
}

function parseEuropeanNumber(s: string): number {
  if (!s || s.trim() === "") return 0
  // Remove quotes, replace European decimal comma → dot
  return parseFloat(s.replace(/"/g, "").replace(/\./g, "").replace(",", ".")) || 0
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// Shorten product name to a ticker-like label
function extractTicker(producto: string): string {
  const cleaned = producto
    .replace(/\bINC\.?\b/gi, "")
    .replace(/\bCORP\.?\b/gi, "")
    .replace(/\bCLASS\s+[A-Z]\b/gi, "")
    .replace(/\bCOMMON\s+STOCK\b/gi, "")
    .replace(/\bCOMM\b/gi, "")
    .replace(/\bORD\s+SHS\b/gi, "")
    .replace(/\bADR\s+ON\b/gi, "")
    .replace(/\bHOLDINGS?\b/gi, "")
    .replace(/\bTECHNOLOGIES\b/gi, "TECH")
    .replace(/\bTHERAPEUTICS\b/gi, "THER")
    .replace(/\s{2,}/g, " ")
    .trim()
  // Take first 3 words max
  return cleaned.split(" ").slice(0, 3).join(" ")
}

export function parseDeGiroCSV(csvText: string): DeGiroRow[] {
  const lines = csvText.trim().split("\n")
  const rows: DeGiroRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length < 12) continue

    const fecha = cols[0]?.trim() ?? ""
    const hora = cols[1]?.trim() ?? ""
    const producto = cols[2]?.trim() ?? ""
    const isin = cols[3]?.trim() ?? ""
    const bolsa = cols[4]?.trim() ?? ""
    // cols[5] = centro de ejecución
    const qty = parseEuropeanNumber(cols[6])
    const precio = parseEuropeanNumber(cols[7])
    // cols[8] = currency of price
    // cols[9] = valor local
    // cols[10] = currency of local
    const valorEur = parseEuropeanNumber(cols[11])
    // cols[12] = tipo de cambio
    // cols[13] = comisión AutoFX
    // cols[14] = costes transacción
    const totalEur = parseEuropeanNumber(cols[15])
    const orderId = cols[16]?.trim() ?? ""

    if (!fecha || !producto || qty === 0) continue

    // Corporate actions: no orderId and price=0 or very small
    const isCorporateAction = !orderId && Math.abs(precio) < 0.001

    rows.push({ fecha, hora, producto, isin, bolsa, qty, precio, currency: cols[8]?.trim() ?? "USD", valorEur, totalEur, orderId, isCorporateAction })
  }

  return rows
}

export function buildPositions(rows: DeGiroRow[]): Position[] {
  const map = new Map<string, Position>()

  // Process in chronological order (file is newest-first, so reverse)
  const ordered = [...rows].reverse()

  for (const row of ordered) {
    if (row.isCorporateAction) continue

    const key = row.isin || row.producto
    if (!map.has(key)) {
      map.set(key, {
        isin: row.isin,
        ticker: extractTicker(row.producto),
        producto: row.producto,
        bolsa: row.bolsa,
        shares: 0,
        avgCost: 0,
        totalInvested: 0,
        realizedPnl: 0,
      })
    }

    const pos = map.get(key)!
    const isBuy = row.qty > 0
    const absQty = Math.abs(row.qty)
    const costEur = Math.abs(row.totalEur)  // always positive cost basis

    if (isBuy) {
      // Update average cost
      const prevTotal = pos.shares * pos.avgCost
      pos.shares += absQty
      pos.totalInvested += costEur
      pos.avgCost = pos.shares > 0 ? (prevTotal + costEur) / pos.shares : 0
    } else {
      // Sell — realize P&L
      const proceeds = Math.abs(row.totalEur)
      const costBasis = pos.avgCost * absQty
      pos.realizedPnl += proceeds - costBasis
      pos.shares -= absQty
      pos.totalInvested -= costBasis
      if (pos.shares < 0.0001) {
        pos.shares = 0
        pos.totalInvested = 0
        pos.avgCost = 0
      }
    }
  }

  return Array.from(map.values())
}
