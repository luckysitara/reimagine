import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"
import type { PortfolioData } from "./helius"

export interface PriceChange {
  symbol: string
  currentPrice: number
  previousPrice: number
  changePercent: number
  timestamp: number
}

export interface PortfolioOpportunity {
  type: "buy_dip" | "take_profit" | "rebalance" | "sentiment"
  token: string
  reason: string
  currentPrice: number
  targetPrice?: number
  suggestedAction: string
  confidence: number // 0-1
  timestamp: number
}

export interface MonitorSnapshot {
  timestamp: number
  portfolio: PortfolioData
  priceChanges: PriceChange[]
  opportunities: PortfolioOpportunity[]
  portfolioChange: {
    percentChange: number
    dollarChange: number
  }
}

// Store previous portfolio state for change detection
const portfolioHistory: Map<string, MonitorSnapshot> = new Map()

// Store price history for trend analysis
const priceHistory: Map<string, PriceChange[]> = new Map()

export async function monitorPortfolio(walletAddress: string): Promise<MonitorSnapshot> {
  try {
    // Fetch current portfolio
    const portfolio = await analyzePortfolio(walletAddress)

    // Get previous snapshot for comparison
    const previousSnapshot = portfolioHistory.get(walletAddress)

    // Check for price changes
    const priceChanges = await detectPriceChanges(portfolio)

    // Analyze opportunities
    const opportunities = await analyzeOpportunities(portfolio, priceChanges, previousSnapshot)

    // Calculate portfolio change
    const portfolioChange = calculatePortfolioChange(previousSnapshot?.portfolio, portfolio)

    const snapshot: MonitorSnapshot = {
      timestamp: Date.now(),
      portfolio,
      priceChanges,
      opportunities,
      portfolioChange,
    }

    // Store snapshot for next comparison
    portfolioHistory.set(walletAddress, snapshot)

    return snapshot
  } catch (error) {
    console.error("[v0] Portfolio monitoring error:", error)
    throw error
  }
}

async function detectPriceChanges(portfolio: PortfolioData): Promise<PriceChange[]> {
  const changes: PriceChange[] = []

  // Check SOL price
  try {
    const solPrice = await getTokenPrice("SOL")
    const priceChange = getPriceChange("SOL", solPrice.priceUSD)
    if (priceChange) {
      changes.push(priceChange)
    }
  } catch (error) {
    console.error("[v0] Error fetching SOL price:", error)
  }

  // Check token prices
  for (const token of portfolio.tokens) {
    try {
      const tokenPrice = await getTokenPrice(token.symbol)
      const priceChange = getPriceChange(token.symbol, tokenPrice.priceUSD)
      if (priceChange) {
        changes.push(priceChange)
      }
    } catch (error) {
      console.warn(`[v0] Error fetching price for ${token.symbol}:`, error)
    }
  }

  return changes
}

function getPriceChange(symbol: string, currentPrice: number): PriceChange | null {
  const history = priceHistory.get(symbol) || []
  const previousPrice = history.length > 0 ? history[history.length - 1].currentPrice : currentPrice
  const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100

  // Only return if there's a meaningful change (>0.5%)
  if (Math.abs(changePercent) < 0.5) {
    return null
  }

  const change: PriceChange = {
    symbol,
    currentPrice,
    previousPrice,
    changePercent,
    timestamp: Date.now(),
  }

  // Keep last 100 price points for trend analysis
  history.push(change)
  if (history.length > 100) {
    history.shift()
  }
  priceHistory.set(symbol, history)

  return change
}

async function analyzeOpportunities(
  portfolio: PortfolioData,
  priceChanges: PriceChange[],
  previousSnapshot?: MonitorSnapshot,
): Promise<PortfolioOpportunity[]> {
  const opportunities: PortfolioOpportunity[] = []

  // Buy-the-dip opportunities
  for (const priceChange of priceChanges) {
    // If price dropped more than 5%, it might be a buying opportunity
    if (priceChange.changePercent < -5) {
      // Check if this token has had consistent downtrend
      const history = priceHistory.get(priceChange.symbol) || []
      const avgChange = history.length > 0 ? history.reduce((sum, p) => sum + p.changePercent, 0) / history.length : 0

      if (avgChange < -2) {
        opportunities.push({
          type: "buy_dip",
          token: priceChange.symbol,
          reason: `Price dropped ${Math.abs(priceChange.changePercent).toFixed(2)}% - potential buying opportunity`,
          currentPrice: priceChange.currentPrice,
          suggestedAction: `Consider buying ${priceChange.symbol} using DCA or limit orders`,
          confidence: Math.min(1, Math.abs(priceChange.changePercent) / 20),
          timestamp: Date.now(),
        })
      }
    }

    // Take-profit opportunities
    if (priceChange.changePercent > 10) {
      opportunities.push({
        type: "take_profit",
        token: priceChange.symbol,
        reason: `Price surged ${priceChange.changePercent.toFixed(2)}% - consider taking profits`,
        currentPrice: priceChange.currentPrice,
        targetPrice: priceChange.currentPrice * 0.95, // Suggest selling 5% below current
        suggestedAction: `Consider creating limit sell order for ${priceChange.symbol}`,
        confidence: Math.min(1, priceChange.changePercent / 30),
        timestamp: Date.now(),
      })
    }
  }

  // Portfolio rebalancing opportunities
  const solPercentage = (portfolio.solBalance / portfolio.totalValueUSD) * 100
  if (solPercentage > 70) {
    opportunities.push({
      type: "rebalance",
      token: "SOL",
      reason: `SOL concentration at ${solPercentage.toFixed(1)}% - portfolio is heavily weighted`,
      currentPrice: 0,
      suggestedAction: "Swap some SOL for stablecoins or diversified tokens",
      confidence: Math.min(1, (solPercentage - 50) / 50),
      timestamp: Date.now(),
    })
  }

  return opportunities
}

function calculatePortfolioChange(
  previousPortfolio: PortfolioData | undefined,
  currentPortfolio: PortfolioData,
): { percentChange: number; dollarChange: number } {
  if (!previousPortfolio) {
    return { percentChange: 0, dollarChange: 0 }
  }

  const dollarChange = currentPortfolio.totalValueUSD - previousPortfolio.totalValueUSD
  const percentChange = (dollarChange / previousPortfolio.totalValueUSD) * 100

  return {
    percentChange,
    dollarChange,
  }
}

export function clearMonitorHistory(walletAddress?: string): void {
  if (walletAddress) {
    portfolioHistory.delete(walletAddress)
  } else {
    portfolioHistory.clear()
    priceHistory.clear()
  }
}
