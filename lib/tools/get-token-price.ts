import { findTokenBySymbol, getJupiterQuote } from "../services/jupiter"

export interface TokenPrice {
  symbol: string
  priceUSD: number
  source: string
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

export async function getTokenPrice(tokenSymbol: string): Promise<TokenPrice> {
  try {
    const token = await findTokenBySymbol(tokenSymbol)

    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found`)
    }

    // Get price by comparing to USDC (1 token -> ? USDC)
    // Use 1 token with proper decimals
    const oneToken = Math.pow(10, token.decimals)

    const dummyTaker = "11111111111111111111111111111111"

    const quote = await getJupiterQuote(
      token.address,
      USDC_MINT,
      oneToken,
      50, // 0.5% slippage for quotes
      dummyTaker,
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

    const fallbackPrices: Record<string, number> = {
      SOL: 100,
      USDC: 1.0,
      USDT: 1.0,
      BONK: 0.00003,
      JUP: 0.5,
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
