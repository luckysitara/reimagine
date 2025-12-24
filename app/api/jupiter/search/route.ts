import { NextResponse } from "next/server"

const JUPITER_TOKENS_API = "https://tokens.jup.ag/"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query || query.trim() === "") {
      return NextResponse.json([])
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(JUPITER_TOKENS_API, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error("[v0] Jupiter tokens API error:", response.status)
      return NextResponse.json([])
    }

    const allTokens = await response.json()
    const queryLower = query.toLowerCase()

    const filtered = Object.values(allTokens)
      .filter((token: any) => {
        const symbol = (token.symbol || "").toLowerCase()
        const name = (token.name || "").toLowerCase()
        return symbol.includes(queryLower) || name.includes(queryLower)
      })
      .slice(0, 50)
      .map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        tags: token.tags || [],
      }))

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("[v0] Jupiter search error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 })
    }

    return NextResponse.json([])
  }
}
