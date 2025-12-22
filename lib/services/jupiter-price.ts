import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface TokenPrice {
  id: string
  mintSymbol: string
  vsToken: string
  vsTokenSymbol: string
  price: number
}

export interface PriceHistory {
  timestamp: number
  price: number
  volume: number
}

export async function getTokenPrice(mintAddress: string): Promise<TokenPrice | null> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.price}?ids=${mintAddress}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || error.message || `Failed to fetch token price: ${response.statusText}`)
      }
      throw new Error(`Failed to fetch token price: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid response format from Jupiter Price API")
    }

    const data = await response.json()

    // Check if data has the expected structure
    if (!data || !data.data || typeof data.data !== "object") {
      console.error("[v0] Invalid price data structure:", data)
      return null
    }

    return data.data[mintAddress] || null
  } catch (error) {
    console.error("[v0] Get token price error:", error)
    return null
  }
}

export async function getMultipleTokenPrices(mintAddresses: string[]): Promise<Record<string, TokenPrice>> {
  try {
    const ids = mintAddresses.join(",")
    const response = await fetch(`${JUPITER_API_URLS.price}?ids=${ids}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || error.message || `Failed to fetch token prices: ${response.statusText}`)
      }
      throw new Error(`Failed to fetch token prices: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid response format from Jupiter Price API")
    }

    const data = await response.json()
    return data.data || {}
  } catch (error) {
    console.error("[v0] Get multiple token prices error:", error)
    return {}
  }
}

export async function getPriceHistory(
  mintAddress: string,
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" = "1h",
  limit = 100,
): Promise<PriceHistory[]> {
  const response = await fetch(
    `${JUPITER_API_URLS.price}/history?id=${mintAddress}&interval=${interval}&limit=${limit}`,
    {
      headers: getJupiterHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.statusText}`)
  }

  return await response.json()
}
