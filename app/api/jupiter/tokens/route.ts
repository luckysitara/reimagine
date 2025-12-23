import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function GET() {
  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    }

    // Add API key if available
    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${JUPITER_ULTRA_API}/search?query=SOL,USDC,USDT,wBTC,ETH,RAY,SRM,ORCA,MNGO,BONK`, {
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Jupiter tokens API error:", response.status, errorText)
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

    return NextResponse.json(tokens, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("[v0] Jupiter tokens API error:", error)
    const errorMsg =
      error instanceof Error && error.name === "AbortError"
        ? "Request timeout - Jupiter API took too long to respond"
        : error instanceof Error
          ? error.message
          : "Failed to fetch token list"

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
