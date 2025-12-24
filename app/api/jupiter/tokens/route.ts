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
    address: "EPjFWaLb3bKP3qxKbF2WwR9dRi12gm1xQYYFnKn9G6bP",
    symbol: "USDC",
    name: "USDC Coin",
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
    const response = await fetch("https://token.jup.ag/all", {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Jupiter strict token list error:", response.status)
      return POPULAR_TOKENS
    }

    const tokens = await response.json()

    if (!Array.isArray(tokens)) {
      console.error("[v0] Jupiter tokens response is not an array")
      return POPULAR_TOKENS
    }

    // Map and validate token structure
    return tokens
      .filter((token: any) => token.address && token.symbol && token.name && typeof token.decimals === "number")
      .slice(0, 2000) // Limit to prevent memory issues
  } catch (error) {
    console.error("[v0] Jupiter token fetch error:", error)
    return POPULAR_TOKENS
  }
}

export async function GET() {
  try {
    const now = Date.now()
    if (cachedTokens && now - cacheTimestamp < CACHE_TTL) {
      console.log("[v0] Returning cached token list")
      return NextResponse.json(cachedTokens, {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      })
    }

    // Fetch fresh token list
    const tokens = await fetchJupiterTokenList()

    // Update cache
    cachedTokens = tokens
    cacheTimestamp = now

    return NextResponse.json(tokens, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("[v0] Tokens endpoint error:", error)

    return NextResponse.json(POPULAR_TOKENS, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    })
  }
}
