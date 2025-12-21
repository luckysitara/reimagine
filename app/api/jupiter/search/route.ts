import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    const headers: HeadersInit = {
      Accept: "application/json",
    }

    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const response = await fetch(`${JUPITER_ULTRA_API}/search?query=${encodeURIComponent(query)}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`)
    }

    const data = await response.json()

    const tokens =
      data.mints?.map((mint: any) => ({
        address: mint.mint,
        symbol: mint.symbol,
        name: mint.name,
        decimals: mint.decimals,
        logoURI: mint.icon,
        tags: mint.tags || [],
      })) || []

    return NextResponse.json(tokens)
  } catch (error) {
    console.error("[v0] Jupiter search API error:", error)
    return NextResponse.json({ error: "Failed to search tokens" }, { status: 500 })
  }
}
