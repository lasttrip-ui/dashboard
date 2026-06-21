import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Server side of the cross-device sync (see lib/sync.ts). Stores one JSON blob
// per account in a Vercel KV / Upstash Redis instance, reached over its REST
// API. Provisioning a KV store on the Vercel project auto-injects the env vars
// below; until then every request returns 501 and the client stays in
// localStorage-only mode. The static GitHub Pages build has no /api at all, so
// there it simply 404s and the client falls back the same way.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const UNCONFIGURED = Symbol("unconfigured")

/** Run a Redis command via the Upstash REST API. */
async function kv(cmd: (string | number)[]): Promise<unknown | typeof UNCONFIGURED> {
  if (!KV_URL || !KV_TOKEN) return UNCONFIGURED
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`kv ${res.status}`)
  const json = await res.json()
  return json?.result ?? null
}

// Account keys are SHA-256 hex digests produced client-side.
const KEY_RE = /^[a-f0-9]{64}$/

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (!key || !KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 })
  }
  try {
    const result = await kv(["GET", `tt-sync:${key}`])
    if (result === UNCONFIGURED) {
      return NextResponse.json({ error: "sync store not configured" }, { status: 501 })
    }
    const data = typeof result === "string" ? JSON.parse(result) : null
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "sync read failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const key = body?.key
  if (!key || typeof key !== "string" || !KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 })
  }
  if (body?.data == null) {
    return NextResponse.json({ error: "missing data" }, { status: 400 })
  }
  const json = JSON.stringify(body.data)
  if (json.length > 5_000_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 })
  }
  try {
    const result = await kv(["SET", `tt-sync:${key}`, json])
    if (result === UNCONFIGURED) {
      return NextResponse.json({ error: "sync store not configured" }, { status: 501 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "sync write failed" }, { status: 500 })
  }
}
