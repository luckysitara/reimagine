import { findTokenBySymbol, getJupiterQuote } from "../services/jupiter"

export interface TokenPrice {
  symbol: string
  priceUSD: number
  source: string
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

// Fallback prices for common tokens
const FALLBACK_PRICES: Record<string, number> = {
  SOL: 180,
  USDC: 1.0,
  USDT: 1.0,
  BONK: 0.00004,
  JUP: 0.65,
  ORCA: 0.45,
  RAY: 0.22,
  COPE: 0.001,
  SRM: 0.35,
  SAMO: 0.0001,
}

export async function getTokenPrice(tokenSymbol: string): Promise<TokenPrice> {
  const upperSymbol = tokenSymbol.toUpperCase()

  if (upperSymbol === "USDC") {
    return {
      symbol: tokenSymbol,
      priceUSD: 1.0,
      source: "USDC Stablecoin",
    }
  }

  if (FALLBACK_PRICES[upperSymbol]) {
    return {
      symbol: tokenSymbol,
      priceUSD: FALLBACK_PRICES[upperSymbol],
      source: "Known Token Price",
    }
  }

  try {
    const token = await findTokenBySymbol(tokenSymbol)

    if (!token) {
      const fallbackPrice = FALLBACK_PRICES[upperSymbol] || 0.001
      return {
        symbol: tokenSymbol,
        priceUSD: fallbackPrice,
        source: "Fallback Estimate",
      }
    }

    const oneToken = Math.pow(10, token.decimals)

    const quote = await getJupiterQuote({
      inputMint: token.address,
      outputMint: USDC_MINT,
      amount: oneToken,
      slippageBps: 50,
      takerPublicKey: "11111111111111111111111111111111",
    })

    if (!quote || !quote.outAmount) {
      console.warn(`[v0] Failed to get quote for ${tokenSymbol}, using fallback`)
      const fallbackPrice = FALLBACK_PRICES[upperSymbol] || 0.001
      return {
        symbol: tokenSymbol,
        priceUSD: fallbackPrice,
        source: "Fallback Estimate",
      }
    }

    const priceUSD = Number.parseInt(quote.outAmount) / 1e6

    if (isNaN(priceUSD) || priceUSD <= 0) {
      console.warn(`[v0] Invalid price calculated for ${tokenSymbol}: ${priceUSD}, using fallback`)
      const fallbackPrice = FALLBACK_PRICES[upperSymbol] || 0.001
      return {
        symbol: tokenSymbol,
        priceUSD: fallbackPrice,
        source: "Fallback Estimate",
      }
    }

    return {
      symbol: tokenSymbol,
      priceUSD,
      source: "Jupiter",
    }
  } catch (error) {
    console.error(`[v0] Error fetching token price for ${tokenSymbol}:`, error)
    const fallbackPrice = FALLBACK_PRICES[upperSymbol] || 0.001
    return {
      symbol: tokenSymbol,
      priceUSD: fallbackPrice,
      source: "Fallback Estimate",
    }
  }
}
