import { NextResponse } from "next/server"

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const inputMint = searchParams.get("inputMint")
    const outputMint = searchParams.get("outputMint")
    const amount = searchParams.get("amount")
    const slippageBps = searchParams.get("slippageBps") || "100"

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json({ error: "Missing required parameters: inputMint, outputMint, amount" }, { status: 400 })
    }

    const url =
      `${JUPITER_QUOTE_API}/quote?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `slippageBps=${slippageBps}&` +
      `onlyDirectRoutes=false&` +
      `asLegacyTransaction=false`

    console.log("[v0] Proxying Jupiter quote request:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Reimagine-DeFi/1.0",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Jupiter quote API error:", response.status, error)
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}: ${error}` },
        { status: response.status },
      )
    }

    const quote = await response.json()

    return NextResponse.json(quote, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] Jupiter quote proxy error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - Jupiter API is taking too long to respond" },
        { status: 504 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quote" },
      { status: 500 },
    )
  }
}
