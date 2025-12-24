import { NextResponse } from "next/server"

// Cache token list in memory with TTL
let cachedTokens: any[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 3600000 // 1 hour

// Popular tokens fallback
const POPULAR_TOKENS = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  {
    address: "DezXAZ8z7PnrnRJjoBRwWQVzEjVAn81VolNAH3vtN2g",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
  },
  {
    address: "JUPyiwrYJFskUPiHa7hKeAlrjUzNcfCP5AJbNbLAXUc",
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
  },
  {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
  },
  {
    address: "SRMuApVgqbCmmp5LoVNiipoe4fcMj1sQ3nTYvOJMUKe",
    symbol: "SRM",
    name: "Serum",
    decimals: 6,
  },
  {
    address: "orcaEKTdK7LKz57chYcSKdWe8ZWAj9kXMwNtXZcV7x4",
    symbol: "ORCA",
    name: "Orca",
    decimals: 6,
  },
  {
    address: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    symbol: "MNGO",
    name: "Mango",
    decimals: 6,
  },
  {
    address: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YA2qYs",
    symbol: "COPE",
    name: "Cope",
    decimals: 6,
  },
  {
    address: "WenuKvASd8wQy3MsFxo4vSKv75XCSqr3zWjKqp2LGnd",
    symbol: "ORCA",
    name: "Orca",
    decimals: 6,
  },
]

async function fetchJupiterTokenList(): Promise<any[]> {
  try {
    // Try primary endpoint first
    let response = await fetch("https://token.jup.ag/all", {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Primary Jupiter token endpoint failed, trying secondary:", response.status)
      // Try secondary endpoint
      response = await fetch("https://api.jup.ag/strict", {
        headers: {
          Accept: "application/json",
        },
      })
    }

    if (!response.ok) {
      console.error("[v0] Jupiter token list endpoints failed:", response.status)
      return POPULAR_TOKENS
    }

    const tokens = await response.json()

    if (!Array.isArray(tokens)) {
      console.error("[v0] Jupiter tokens response is not an array, type:", typeof tokens)
      // If it's an object with a 'tokens' property
      if (tokens && typeof tokens === "object" && "tokens" in tokens && Array.isArray(tokens.tokens)) {
        const filteredTokens = tokens.tokens
          .filter((token: any) => token.address && token.symbol && token.name && typeof token.decimals === "number")
          .slice(0, 5000)
        console.log("[v0] Extracted token list from wrapper object:", filteredTokens.length, "tokens")
        return filteredTokens
      }
      return POPULAR_TOKENS
    }

    // Validate and filter tokens
    const filteredTokens = tokens
      .filter((token: any) => {
        return (
          token &&
          typeof token === "object" &&
          token.address &&
          typeof token.address === "string" &&
          token.symbol &&
          typeof token.symbol === "string" &&
          typeof token.decimals === "number" &&
          token.decimals >= 0 &&
          token.decimals <= 255
        )
      })
      .slice(0, 5000) // Limit to prevent memory issues

    console.log("[v0] Successfully fetched", filteredTokens.length, "tokens from Jupiter")
    return filteredTokens.length > 0 ? filteredTokens : POPULAR_TOKENS
  } catch (error) {
    console.error("[v0] Jupiter token fetch error:", error instanceof Error ? error.message : error)
    return POPULAR_TOKENS
  }
}

export async function GET() {
  try {
    const now = Date.now()
    if (cachedTokens && now - cacheTimestamp < 600000) {
      console.log("[v0] Returning cached token list:", cachedTokens.length, "tokens")
      return NextResponse.json(cachedTokens, {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      })
    }

    // Fetch fresh token list
    console.log("[v0] Fetching fresh token list from Jupiter...")
    const tokens = await fetchJupiterTokenList()

    // Update cache
    cachedTokens = tokens
    cacheTimestamp = now

    console.log("[v0] Token list endpoint returning", tokens.length, "tokens")

    return NextResponse.json(tokens, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Tokens endpoint error:", error instanceof Error ? error.message : error)

    return NextResponse.json(POPULAR_TOKENS, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    })
  }
}
