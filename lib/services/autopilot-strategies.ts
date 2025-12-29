import type { PortfolioData } from "./helius"
import type { MonitorSnapshot } from "./autopilot-monitor"

export interface StrategyConfig {
  id: string
  name: "buy-dip" | "take-profit" | "rebalance" | "sentiment"
  enabled: boolean
  parameters: Record<string, any>
}

export interface StrategyOrder {
  strategy: string
  token: string
  action: "buy" | "sell" | "dca" | "limit"
  inputToken: string
  outputToken: string
  inputAmount: number
  targetPrice?: number
  reason: string
  confidence: number
  metadata: Record<string, any>
}

// Default strategy configurations
export const DEFAULT_STRATEGIES: StrategyConfig[] = [
  {
    id: "buy-dip",
    name: "buy-dip",
    enabled: true,
    parameters: {
      dropThreshold: 5, // Buy if price drops >5%
      minConfidence: 0.6,
      maxOrderSize: 500, // Max $500 per order
      useSpent: "USDC", // Use stablecoins for buying
    },
  },
  {
    id: "take-profit",
    name: "take-profit",
    enabled: true,
    parameters: {
      pumpThreshold: 10, // Sell if price rises >10%
      profitTarget: 0.95, // Sell at 95% of pump price
      minConfidence: 0.7,
    },
  },
  {
    id: "rebalance",
    name: "rebalance",
    enabled: false,
    parameters: {
      targetAllocation: {
        SOL: 0.4,
        USDC: 0.3,
        JUP: 0.2,
        BONK: 0.1,
      },
      imbalanceThreshold: 0.15, // Rebalance if >15% off target
      minOrderValue: 100, // Don't rebalance small amounts
    },
  },
  {
    id: "sentiment",
    name: "sentiment",
    enabled: false,
    parameters: {
      sentimentThreshold: 0.7, // Strong positive sentiment
      minConfidence: 0.5,
      actionType: "buy", // or "sell"
    },
  },
]

export async function evaluateStrategies(
  snapshot: MonitorSnapshot,
  strategies: StrategyConfig[],
): Promise<StrategyOrder[]> {
  const orders: StrategyOrder[] = []

  for (const strategy of strategies) {
    if (!strategy.enabled) continue

    switch (strategy.name) {
      case "buy-dip":
        orders.push(...evaluateBuyDipStrategy(snapshot, strategy))
        break
      case "take-profit":
        orders.push(...evaluateTakeProfitStrategy(snapshot, strategy))
        break
      case "rebalance":
        orders.push(...evaluateRebalanceStrategy(snapshot, strategy))
        break
      case "sentiment":
        orders.push(...evaluateSentimentStrategy(snapshot, strategy))
        break
    }
  }

  return orders
}

function evaluateBuyDipStrategy(snapshot: MonitorSnapshot, config: StrategyConfig): StrategyOrder[] {
  const orders: StrategyOrder[] = []
  const { dropThreshold, minConfidence, maxOrderSize, useSpent } = config.parameters

  for (const opportunity of snapshot.opportunities) {
    if (opportunity.type !== "buy_dip") continue
    if (opportunity.confidence < minConfidence) continue

    // Check if we have enough stablecoins
    const stablecoin = snapshot.portfolio.tokens.find((t) => t.symbol === useSpent)
    if (!stablecoin || stablecoin.valueUSD < 50) continue // Need at least $50

    const orderSize = Math.min(maxOrderSize, stablecoin.valueUSD * 0.5) // Use max 50% of balance

    orders.push({
      strategy: "buy-dip",
      token: opportunity.token,
      action: "buy",
      inputToken: useSpent,
      outputToken: opportunity.token,
      inputAmount: orderSize,
      reason: opportunity.reason,
      confidence: opportunity.confidence,
      metadata: {
        priceDropPercent: opportunity.confidence * 20, // Rough estimate
        executionType: "immediate",
      },
    })
  }

  return orders
}

function evaluateTakeProfitStrategy(snapshot: MonitorSnapshot, config: StrategyConfig): StrategyOrder[] {
  const orders: StrategyOrder[] = []
  const { pumpThreshold, profitTarget, minConfidence } = config.parameters

  for (const opportunity of snapshot.opportunities) {
    if (opportunity.type !== "take_profit") continue
    if (opportunity.confidence < minConfidence) continue

    // Check if we own this token
    const tokenBalance = snapshot.portfolio.tokens.find((t) => t.symbol === opportunity.token)
    if (!tokenBalance || tokenBalance.balance <= 0) continue

    orders.push({
      strategy: "take-profit",
      token: opportunity.token,
      action: "limit",
      inputToken: opportunity.token,
      outputToken: "USDC", // Sell for stablecoin
      inputAmount: tokenBalance.balance * 0.5, // Sell 50% of holdings
      targetPrice: opportunity.currentPrice * profitTarget,
      reason: opportunity.reason,
      confidence: opportunity.confidence,
      metadata: {
        profitTargetPercent: (1 - profitTarget) * 100,
        executionType: "limit_order",
      },
    })
  }

  return orders
}

function evaluateRebalanceStrategy(snapshot: MonitorSnapshot, config: StrategyConfig): StrategyOrder[] {
  const orders: StrategyOrder[] = []
  const { targetAllocation, imbalanceThreshold, minOrderValue } = config.parameters

  if (!targetAllocation) return orders

  for (const [targetToken, targetPercent] of Object.entries(targetAllocation)) {
    const currentToken = snapshot.portfolio.tokens.find((t) => t.symbol === targetToken)
    const currentPercent = currentToken ? (currentToken.valueUSD / snapshot.portfolio.totalValueUSD) * 100 : 0
    const actualPercent = targetPercent * 100
    const imbalance = Math.abs(currentPercent - actualPercent)

    if (imbalance < imbalanceThreshold) continue

    const orderValue = Math.abs((imbalance / 100) * snapshot.portfolio.totalValueUSD)
    if (orderValue < minOrderValue) continue

    if (currentPercent > actualPercent) {
      // Need to sell this token
      if (currentToken && currentToken.balance > 0) {
        const sellAmount = (orderValue / currentToken.priceUSD) * 0.8 // Sell 80% of needed amount

        orders.push({
          strategy: "rebalance",
          token: targetToken,
          action: "sell",
          inputToken: targetToken,
          outputToken: "USDC",
          inputAmount: sellAmount,
          reason: `Portfolio rebalance: ${currentToken.symbol} at ${currentPercent.toFixed(1)}% vs target ${actualPercent.toFixed(1)}%`,
          confidence: 0.8,
          metadata: {
            imbalancePercent: imbalance,
            executionType: "immediate",
          },
        })
      }
    } else {
      // Need to buy this token
      const usdcBalance = snapshot.portfolio.tokens.find((t) => t.symbol === "USDC")
      if (usdcBalance && usdcBalance.balance > minOrderValue) {
        orders.push({
          strategy: "rebalance",
          token: targetToken,
          action: "buy",
          inputToken: "USDC",
          outputToken: targetToken,
          inputAmount: orderValue,
          reason: `Portfolio rebalance: ${targetToken} at ${currentPercent.toFixed(1)}% vs target ${actualPercent.toFixed(1)}%`,
          confidence: 0.8,
          metadata: {
            imbalancePercent: imbalance,
            executionType: "immediate",
          },
        })
      }
    }
  }

  return orders
}

function evaluateSentimentStrategy(snapshot: MonitorSnapshot, config: StrategyConfig): StrategyOrder[] {
  // Sentiment analysis requires external data (news, social media)
  // For now, return empty array - this would be enhanced with real sentiment data
  return []
}

export function validateStrategyOrder(order: StrategyOrder, portfolio: PortfolioData): boolean {
  // Check if wallet has enough balance for the order
  const inputTokenData = portfolio.tokens.find((t) => t.symbol === order.inputToken)

  if (!inputTokenData || inputTokenData.balance < order.inputAmount) {
    return false
  }

  // Check minimum order size (avoid dust trades)
  if (order.inputAmount < 0.001) {
    return false
  }

  return true
}
