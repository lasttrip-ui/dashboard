import { NextResponse } from "next/server"

// Server-side proxy for the IBKR Flex Web Service. IB blocks browser requests
// (no CORS headers), so the client posts token+queryId here and this route
// performs the SendRequest → GetStatement dance from the server, returning the
// raw statement XML. The token is used in-flight only — never logged or stored.

export const dynamic = "force-dynamic"
export const maxDuration = 60

const BASE = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService"

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: Request) {
  let body: { token?: string; queryId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const token = (body.token ?? "").trim()
  const queryId = (body.queryId ?? "").trim()
  if (!token || !queryId) {
    return NextResponse.json({ error: "Faltan token o queryId" }, { status: 400 })
  }
  if (!/^[A-Za-z0-9]{8,64}$/.test(token) || !/^\d{1,12}$/.test(queryId)) {
    return NextResponse.json({ error: "Token o Query ID con formato inválido" }, { status: 400 })
  }

  try {
    const sendXml = await fetch(
      `${BASE}/SendRequest?t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=3`,
      { cache: "no-store" }
    ).then(r => r.text())

    const ref = sendXml.match(/<ReferenceCode>(\d+)<\/ReferenceCode>/)
    if (!ref) {
      const err = sendXml.match(/<ErrorMessage>([\s\S]*?)<\/ErrorMessage>/)
      return NextResponse.json(
        { error: err ? err[1].trim() : "IB no devolvió ReferenceCode (¿token caducado o query incorrecta?)" },
        { status: 502 }
      )
    }

    // IB generates the statement asynchronously — poll until ready
    await sleep(2000)
    let xml = ""
    for (let i = 0; i < 6; i++) {
      xml = await fetch(
        `${BASE}/GetStatement?q=${ref[1]}&t=${encodeURIComponent(token)}&v=3`,
        { cache: "no-store" }
      ).then(r => r.text())
      const inProgress = xml.includes("Statement generation in progress") || xml.includes("ErrorCode>1019")
      if (!inProgress) break
      await sleep(2500 + i * 1500)
    }

    if (xml.includes("<ErrorCode>")) {
      const err = xml.match(/<ErrorMessage>([\s\S]*?)<\/ErrorMessage>/)
      return NextResponse.json(
        { error: err ? err[1].trim() : "IB devolvió un error al generar el extracto" },
        { status: 502 }
      )
    }

    return new NextResponse(xml, {
      headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json({ error: "No se pudo contactar con IBKR desde el servidor" }, { status: 502 })
  }
}
