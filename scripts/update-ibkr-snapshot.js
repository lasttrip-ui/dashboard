#!/usr/bin/env node
/**
 * Daily IBKR snapshot updater via Flex Web Service.
 *
 * Requires env vars:
 *   IBKR_FLEX_TOKEN    — Flex Web Service token (IBKR Client Portal → Settings → Flex Web Service)
 *   IBKR_FLEX_QUERY_ID — Activity Flex Query ID that includes: Account Information,
 *                        Net Asset Value, Open Positions, Trades (last 30 days or more)
 *
 * Updates:
 *   lib/ibkr-snapshot.json            — summary, positions, recent trades
 *   public/data/executions-history.json — appends new executions (deduped by tradeId)
 */

const fs = require("fs")
const path = require("path")

const TOKEN = process.env.IBKR_FLEX_TOKEN
const QUERY_ID = process.env.IBKR_FLEX_QUERY_ID
const BASE = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService"

if (!TOKEN || !QUERY_ID) {
  console.error("Missing IBKR_FLEX_TOKEN or IBKR_FLEX_QUERY_ID")
  process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function xmlAttr(tag, attr) {
  const m = tag.match(new RegExp(`${attr}="([^"]*)"`))
  return m ? m[1] : ""
}

function xmlTags(xml, name) {
  return xml.match(new RegExp(`<${name}\\b[^>]*/?>`, "g")) || []
}

async function main() {
  // 1. Request the report
  const sendUrl = `${BASE}/SendRequest?t=${TOKEN}&q=${QUERY_ID}&v=3`
  const sendXml = await fetchText(sendUrl)
  const refMatch = sendXml.match(/<ReferenceCode>(\d+)<\/ReferenceCode>/)
  if (!refMatch) throw new Error(`Flex SendRequest failed: ${sendXml.slice(0, 500)}`)
  const ref = refMatch[1]
  console.log("Flex reference code:", ref)

  // 2. Poll for the statement (IBKR generates it asynchronously)
  let xml = ""
  for (let i = 0; i < 12; i++) {
    await sleep(10_000)
    xml = await fetchText(`${BASE}/GetStatement?t=${TOKEN}&q=${ref}&v=3`)
    if (!xml.includes("Statement generation in progress")) break
    console.log("waiting for statement...")
  }
  if (xml.includes("ErrorCode")) throw new Error(`Flex GetStatement error: ${xml.slice(0, 500)}`)
  console.log("statement received,", xml.length, "bytes")

  // 3. Parse what we need
  const snapPath = path.join(__dirname, "..", "lib", "ibkr-snapshot.json")
  const snap = JSON.parse(fs.readFileSync(snapPath, "utf8"))

  // Net Asset Value (EquitySummaryByReportDateInBase — last row is most recent)
  const navRows = xmlTags(xml, "EquitySummaryByReportDateInBase")
  if (navRows.length > 0) {
    const lastNav = navRows[navRows.length - 1]
    const total = parseFloat(xmlAttr(lastNav, "total"))
    const cash = parseFloat(xmlAttr(lastNav, "cash"))
    if (total > 0) {
      snap.summary.netLiquidation = Math.round(total * 100) / 100
      snap.summary.equityWithLoanValue = Math.round(total * 100) / 100
      if (!isNaN(cash)) snap.summary.totalCashValue = Math.round(cash * 100) / 100
      console.log("NAV updated:", snap.summary.netLiquidation)
    }
  }

  // Open positions
  const posRows = xmlTags(xml, "OpenPosition")
  if (posRows.length > 0) {
    snap.positions = posRows.map(row => ({
      contractId: parseInt(xmlAttr(row, "conid")) || 0,
      symbol: xmlAttr(row, "underlyingSymbol") || xmlAttr(row, "symbol"),
      description: xmlAttr(row, "description") || xmlAttr(row, "symbol"),
      assetClass: xmlAttr(row, "assetCategory"),
      position: parseFloat(xmlAttr(row, "position")) || 0,
      marketPrice: parseFloat(xmlAttr(row, "markPrice")) || 0,
      marketValue: parseFloat(xmlAttr(row, "positionValue")) || 0,
      currency: xmlAttr(row, "currency"),
      averagePrice: parseFloat(xmlAttr(row, "openPrice")) || 0,
      unrealizedPnl: parseFloat(xmlAttr(row, "fifoPnlUnrealized")) || 0,
    }))
    console.log("positions updated:", snap.positions.length)
  }

  // Trades → executions history + recentTrades
  const tradeRows = xmlTags(xml, "Trade")
  const execs = tradeRows
    .filter(row => xmlAttr(row, "transactionType") !== "DividendReinvestment")
    .map(row => {
      const dt = xmlAttr(row, "dateTime") // e.g. 20260610;143101
      const iso = dt
        ? `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T${dt.slice(9, 11)}:${dt.slice(11, 13)}:${dt.slice(13, 15)}Z`
        : ""
      const cat = xmlAttr(row, "assetCategory")
      const isOpt = cat === "OPT" || cat === "FOP"
      // Option contract detail — lets Operaciones/Bitácora rebuild real trades
      const putCall = xmlAttr(row, "putCall") // "P" | "C"
      const strikeRaw = xmlAttr(row, "strike")
      const expiryRaw = xmlAttr(row, "expiry") // YYYYMMDD
      const expiry = /^\d{8}$/.test(expiryRaw)
        ? `${expiryRaw.slice(0, 4)}-${expiryRaw.slice(4, 6)}-${expiryRaw.slice(6, 8)}`
        : ""
      const rec = {
        tradeId: xmlAttr(row, "tradeID") || xmlAttr(row, "transactionID"),
        symbol: xmlAttr(row, "underlyingSymbol") || xmlAttr(row, "symbol"),
        secType: cat,
        side: parseFloat(xmlAttr(row, "quantity")) < 0 ? "SELL" : "BUY",
        size: Math.abs(parseFloat(xmlAttr(row, "quantity")) || 0),
        price: parseFloat(xmlAttr(row, "tradePrice")) || 0,
        tradeTime: iso,
        commission: Math.abs(parseFloat(xmlAttr(row, "ibCommission")) || 0),
        netAmount: Math.abs(parseFloat(xmlAttr(row, "proceeds")) || 0),
        realizedPnl: parseFloat(xmlAttr(row, "fifoPnlRealized")) || 0,
      }
      if (isOpt) {
        if (putCall === "P" || putCall === "C") rec.right = putCall
        if (strikeRaw) rec.strike = parseFloat(strikeRaw) || 0
        if (expiry) rec.expiry = expiry
        const oc = xmlAttr(row, "openCloseIndicator") // "O" | "C" | "C;O"
        if (oc) rec.openClose = oc.includes("O") && !oc.includes("C") ? "O" : oc.includes("C") ? "C" : ""
      }
      return rec
    })
    .filter(e => e.tradeId && e.size >= 1)

  if (execs.length > 0) {
    const histPath = path.join(__dirname, "..", "public", "data", "executions-history.json")
    const hist = JSON.parse(fs.readFileSync(histPath, "utf8"))
    const byId = new Map(hist.map(e => [e.tradeId, e]))
    let added = 0
    let enriched = 0
    for (const e of execs) {
      const existing = byId.get(e.tradeId)
      if (!existing) {
        byId.set(e.tradeId, e)
        added++
      } else if (existing.right === undefined && e.right !== undefined) {
        // Backfill contract detail onto a record imported before enrichment
        Object.assign(existing, { right: e.right, strike: e.strike, expiry: e.expiry, openClose: e.openClose })
        enriched++
      }
    }
    if (added > 0 || enriched > 0) {
      const merged = Array.from(byId.values()).sort((a, b) => a.tradeTime.localeCompare(b.tradeTime))
      fs.writeFileSync(histPath, JSON.stringify(merged))
      console.log(`executions: +${added} new, ${enriched} enriched → total ${merged.length}`)
    } else {
      console.log("no new executions")
    }

    snap.recentTrades = execs.slice(-40).reverse()
  }

  snap.lastUpdated = new Date().toISOString()
  fs.writeFileSync(snapPath, JSON.stringify(snap, null, 2))
  console.log("snapshot saved. lastUpdated:", snap.lastUpdated)
}

main().catch(err => { console.error(err); process.exit(1) })
