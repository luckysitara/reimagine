import type { StrategyOrder } from "./autopilot-strategies"
import type { PortfolioData } from "./helius"

export interface RiskLimits {
  maxDailyLossUSD: number // Max loss per day in USD
  maxOrderSizeUSD: number // Max order size
  maxSlippagePercent: number // Max slippage tolerance
  whitelistTokens: string[] // Only trade these tokens (empty = all)
  blacklistTokens: string[] // Never trade these tokens
  maxPortfolioConcentration: number // Max % in single token
  enableAutopilot: boolean
}

export interface RiskCheck {
  allowed: boolean
  reason?: string
  warnings: string[]
}

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxDailyLossUSD: 100,
  maxOrderSizeUSD: 500,
  maxSlippagePercent: 5,
  whitelistTokens: [],
  blacklistTokens: [],
  maxPortfolioConcentration: 50,
  enableAutopilot: false,
}

// Store daily loss tracking (reset every 24 hours)
const dailyLossTracking: Map<string, { loss: number; resetTime: number }> = new Map()

export function setRiskLimits(walletAddress: string, limits: Partial<RiskLimits>): void {
  // Store in session/memory (in production, would persist to database)
  console.log(`[v0] Updated risk limits for ${walletAddress}:`, limits)
}

export function getRiskLimits(walletAddress: string): RiskLimits {
  // Retrieve from session/memory (in production, would fetch from database)
  return { ...DEFAULT_RISK_LIMITS }
}

export function validateStrategyOrder(
  order: StrategyOrder,
  portfolio: PortfolioData,
  walletAddress: string,
): RiskCheck {
  const limits = getRiskLimits(walletAddress)
  const warnings: string[] = []
  const allowed = true

  // Check if autopilot is enabled
  if (!limits.enableAutopilot) {
    return {
      allowed: false,
      reason: "Autopilot is disabled. Enable it in settings to execute autonomous trades.",
      warnings,
    }
  }

  // Check whitelist
  if (limits.whitelistTokens.length > 0) {
    if (!limits.whitelistTokens.includes(order.inputToken) || !limits.whitelistTokens.includes(order.outputToken)) {
      return {
        allowed: false,
        reason: `Token not in whitelist. Add ${order.inputToken} and ${order.outputToken} to your whitelist.`,
        warnings,
      }
    }
  }

  // Check blacklist
  if (limits.blacklistTokens.includes(order.inputToken) || limits.blacklistTokens.includes(order.outputToken)) {
    return {
      allowed: false,
      reason: `Token is blacklisted. Remove from blacklist to trade.`,
      warnings,
    }
  }

  // Check order size
  if (order.inputAmount * getTokenPrice(order.inputToken) > limits.maxOrderSizeUSD) {
    return {
      allowed: false,
      reason: `Order size exceeds maximum of $${limits.maxOrderSizeUSD}`,
      warnings,
    }
  }

  // Check daily loss limit
  const dailyLoss = getDailyLoss(walletAddress)
  if (dailyLoss >= limits.maxDailyLossUSD) {
    return {
      allowed: false,
      reason: `Daily loss limit of $${limits.maxDailyLossUSD} has been reached. Try again tomorrow.`,
      warnings,
    }
  }

  if (dailyLoss > limits.maxDailyLossUSD * 0.8) {
    warnings.push(`Daily loss at ${((dailyLoss / limits.maxDailyLossUSD) * 100).toFixed(0)}% of limit`)
  }

  // Check portfolio concentration
  const inputTokenBalance = portfolio.tokens.find((t) => t.symbol === order.inputToken)
  if (inputTokenBalance) {
    const concentrationPercent = (inputTokenBalance.valueUSD / portfolio.totalValueUSD) * 100
    if (concentrationPercent > limits.maxPortfolioConcentration) {
      warnings.push(
        `High concentration in ${order.inputToken} (${concentrationPercent.toFixed(1)}%). Consider diversifying.`,
      )
    }
  }

  // Check wallet has sufficient balance
  const inputToken = portfolio.tokens.find((t) => t.symbol === order.inputToken)
  if (!inputToken || inputToken.balance < order.inputAmount) {
    return {
      allowed: false,
      reason: `Insufficient balance. Need ${order.inputAmount} ${order.inputToken}, have ${inputToken?.balance || 0}`,
      warnings,
    }
  }

  // Check estimated slippage (rough estimate)
  const estimatedSlippage = estimateSlippage(order.inputAmount, portfolio.totalValueUSD)
  if (estimatedSlippage > limits.maxSlippagePercent) {
    return {
      allowed: false,
      reason: `Estimated slippage ${estimatedSlippage.toFixed(2)}% exceeds maximum of ${limits.maxSlippagePercent}%`,
      warnings,
    }
  }

  return { allowed, warnings }
}

export function trackOrderExecution(walletAddress: string, orderValueUSD: number, success: boolean): void {
  if (!success && orderValueUSD > 0) {
    const tracking = dailyLossTracking.get(walletAddress) || { loss: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }

    // Reset if 24 hours have passed
    if (Date.now() > tracking.resetTime) {
      tracking.loss = 0
      tracking.resetTime = Date.now() + 24 * 60 * 60 * 1000
    }

    tracking.loss += orderValueUSD
    dailyLossTracking.set(walletAddress, tracking)

    console.log(`[v0] Tracked loss of $${orderValueUSD} for ${walletAddress}. Daily total: $${tracking.loss}`)
  }
}

export function getDailyLoss(walletAddress: string): number {
  const tracking = dailyLossTracking.get(walletAddress)

  if (!tracking) {
    return 0
  }

  // Reset if 24 hours have passed
  if (Date.now() > tracking.resetTime) {
    dailyLossTracking.delete(walletAddress)
    return 0
  }

  return tracking.loss
}

export function resetDailyLoss(walletAddress: string): void {
  dailyLossTracking.delete(walletAddress)
}

// Helper function to get rough token price
function getTokenPrice(symbol: string): number {
  const prices: Record<string, number> = {
    SOL: 100,
    USDC: 1,
    USDT: 1,
    BONK: 0.00003,
    JUP: 0.5,
  }
  return prices[symbol.toUpperCase()] || 0.01
}

// Estimate slippage based on order size relative to portfolio
function estimateSlippage(orderAmount: number, portfolioValue: number): number {
  const orderPercent = (orderAmount / portfolioValue) * 100

  // Rough estimate: 0.1% slippage per 1% of portfolio
  return Math.min(orderPercent * 0.1, 10)
}

export function validateLimits(limits: Partial<RiskLimits>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (limits.maxDailyLossUSD && limits.maxDailyLossUSD <= 0) {
    errors.push("Max daily loss must be greater than 0")
  }

  if (limits.maxOrderSizeUSD && limits.maxOrderSizeUSD <= 0) {
    errors.push("Max order size must be greater than 0")
  }

  if (limits.maxSlippagePercent && (limits.maxSlippagePercent <= 0 || limits.maxSlippagePercent > 50)) {
    errors.push("Max slippage must be between 0 and 50%")
  }

  if (
    limits.maxPortfolioConcentration &&
    (limits.maxPortfolioConcentration <= 0 || limits.maxPortfolioConcentration > 100)
  ) {
    errors.push("Max portfolio concentration must be between 0 and 100%")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
