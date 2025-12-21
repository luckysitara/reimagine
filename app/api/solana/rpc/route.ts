import { NextResponse } from "next/server"

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL

export async function POST(request: Request) {
  try {
    if (!HELIUS_RPC_URL) {
      return NextResponse.json({ error: "HELIUS_RPC_URL is not configured on the server" }, { status: 500 })
    }

    const body = await request.json()

    console.log("[v0] Proxying Solana RPC request:", body.method)

    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Helius RPC error:", response.status, error)
      return NextResponse.json({ error: `RPC request failed: ${error}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] RPC proxy error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "RPC request failed" }, { status: 500 })
  }
}
