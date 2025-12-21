import { getJupiterTokenList, getJupiterQuote } from "../services/jupiter"

export interface TokenPrice {
  symbol: string
  priceUSD: number
  source: string
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const SOL_MINT = "So11111111111111111111111111111111111111112"

export async function getTokenPrice(tokenSymbol: string): Promise<TokenPrice> {
  try {
    const tokens = await getJupiterTokenList()

    const token = tokens.find((t) => t.symbol.toUpperCase() === tokenSymbol.toUpperCase())

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found`)
    }

    // Get price by comparing to USDC (1 token -> ? USDC)
    // Use 1 token with proper decimals
    const oneToken = Math.pow(10, token.decimals)

    const quote = await getJupiterQuote(
      token.address,
      USDC_MINT,
      oneToken,
      50, // 0.5% slippage for quotes
    )

    // USDC has 6 decimals
    const priceUSD = Number.parseInt(quote.outAmount) / 1e6

    return {
      symbol: tokenSymbol,
      priceUSD,
      source: "Jupiter",
    }
  } catch (error) {
    console.error("[v0] Error fetching token price:", error)

    // Fallback hardcoded prices for common tokens
    const fallbackPrices: Record<string, number> = {
      SOL: 100,
      USDC: 1.0,
      USDT: 1.0,
    }

    if (fallbackPrices[tokenSymbol.toUpperCase()]) {
      return {
        symbol: tokenSymbol,
        priceUSD: fallbackPrices[tokenSymbol.toUpperCase()],
        source: "Fallback",
      }
    }

    throw error
  }
}
