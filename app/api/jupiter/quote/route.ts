import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const inputMint = searchParams.get("inputMint")
    const outputMint = searchParams.get("outputMint")
    const amount = searchParams.get("amount")
    const slippageBps = searchParams.get("slippageBps") || "100"
    const taker = searchParams.get("taker")

    if (!inputMint || !outputMint || !amount || !taker) {
      return NextResponse.json(
        { error: "Missing required parameters: inputMint, outputMint, amount, taker" },
        { status: 400 },
      )
    }

    const url =
      `${JUPITER_ULTRA_API}/quote?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `taker=${taker}&` +
      `slippageBps=${slippageBps}`

    console.log("[v0] Fetching Jupiter Ultra quote from:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Jupiter Ultra API error:", response.status, error)
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}: ${error}` },
        { status: response.status },
      )
    }

    const quote = await response.json()

    if (quote.error || !quote.outAmount) {
      console.error("[v0] Jupiter returned error:", quote.error || "No outAmount in response")
      return NextResponse.json(
        {
          error: quote.error || "No swap route available for this pair",
          details: quote,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(quote, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] Jupiter Ultra quote proxy error:", error)

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
