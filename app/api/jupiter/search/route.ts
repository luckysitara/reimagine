import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query || query.trim() === "") {
      console.log("[v0] Empty search query, returning empty results")
      return NextResponse.json([])
    }

    const headers: HeadersInit = {
      Accept: "application/json",
    }

    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const searchUrl = `${JUPITER_ULTRA_API}/search?query=${encodeURIComponent(query)}`
    console.log("[v0] Jupiter search request for query:", query)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(searchUrl, {
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Jupiter API error:", response.status, errorText)
      return NextResponse.json({ error: `Jupiter API error: ${response.statusText}` }, { status: response.status })
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
    const errorMsg =
      error instanceof Error && error.name === "AbortError"
        ? "Request timeout - Jupiter API took too long to respond"
        : error instanceof Error
          ? error.message
          : "Failed to search tokens"

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
