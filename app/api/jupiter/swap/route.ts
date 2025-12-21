import { NextResponse } from "next/server"

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { quoteResponse, userPublicKey } = body

    if (!quoteResponse || !userPublicKey) {
      return NextResponse.json({ error: "Missing required parameters: quoteResponse, userPublicKey" }, { status: 400 })
    }

    console.log("[v0] Proxying Jupiter swap request for user:", userPublicKey)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Reimagine-DeFi/1.0",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Jupiter swap API error:", response.status, error)
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}: ${error}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Jupiter swap proxy error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - Jupiter API is taking too long to respond" },
        { status: 504 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare swap transaction" },
      { status: 500 },
    )
  }
}
