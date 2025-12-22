import { NextResponse } from "next/server"

function getHeliusRPCUrl(): string {
  const url = process.env.HELIUS_RPC_URL
  if (!url) {
    throw new Error("HELIUS_RPC_URL environment variable is not configured")
  }
  return url
}

export async function POST(request: Request) {
  try {
    let rpcUrl: string
    try {
      rpcUrl = getHeliusRPCUrl()
    } catch (error) {
      console.error("[v0] HELIUS_RPC_URL is not configured on the server")
      return NextResponse.json(
        { error: "RPC endpoint not configured. Please set HELIUS_RPC_URL environment variable." },
        { status: 500 },
      )
    }

    const body = await request.json()

    // Validate RPC request structure
    if (!body.method || !body.jsonrpc) {
      return NextResponse.json({ error: "Invalid RPC request format" }, { status: 400 })
    }

    console.log("[v0] Secure RPC proxy request:", body.method)

    // Forward request to Helius with API key (secure server-side only)
    const response = await fetch(rpcUrl, {
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

// Handle GET requests with helpful error message
export async function GET() {
  return NextResponse.json(
    {
      error: "This endpoint only accepts POST requests with JSON-RPC payloads",
      usage: {
        method: "POST",
        contentType: "application/json",
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: ["WALLET_ADDRESS"],
        },
      },
    },
    { status: 405 },
  )
}
