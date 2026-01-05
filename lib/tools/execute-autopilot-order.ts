import { prepareSwap } from "@/lib/tools/execute-swap"
import { createLimitOrder } from "@/lib/services/jupiter-trigger"
import { createDCAOrder } from "@/lib/services/jupiter-recurring"
import type { StrategyOrder } from "@/lib/services/autopilot-strategies"
import type { PortfolioData } from "@/lib/services/helius"

export interface ExecutedOrder {
  id: string
  timestamp: number
  strategy: string
  action: "buy" | "sell" | "dca" | "limit"
  inputToken: string
  outputToken: string
  inputAmount: number
  estimatedOutput?: number
  status: "pending" | "success" | "failed"
  transactionHash?: string
  error?: string
  metadata: Record<string, any>
}

const executionLog: ExecutedOrder[] = []

export async function executeAutopilotOrder(
  order: StrategyOrder,
  walletAddress: string,
  portfolio: PortfolioData,
): Promise<ExecutedOrder> {
  const executedOrder: ExecutedOrder = {
    id: `autopilot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    strategy: order.strategy,
    action: order.action,
    inputToken: order.inputToken,
    outputToken: order.outputToken,
    inputAmount: order.inputAmount,
    status: "pending",
    metadata: order.metadata,
  }

  try {
    console.log("[v0] Executing autopilot order:", {
      id: executedOrder.id,
      strategy: order.strategy,
      action: order.action,
      inputToken: order.inputToken,
      outputToken: order.outputToken,
      amount: order.inputAmount,
    })

    switch (order.action) {
      case "buy":
      case "sell":
        await executeSwapOrder(order, walletAddress, executedOrder)
        break
      case "limit":
        await executeLimitOrder(order, walletAddress, executedOrder)
        break
      case "dca":
        await executeDCAOrder(order, walletAddress, executedOrder)
        break
    }

    executedOrder.status = "success"
    console.log("[v0] Autopilot order executed successfully:", executedOrder.id)
  } catch (error) {
    executedOrder.status = "failed"
    executedOrder.error = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Autopilot order failed:", error)
  }

  // Log the execution
  executionLog.push(executedOrder)
  // Keep only last 500 orders
  if (executionLog.length > 500) {
    executionLog.shift()
  }

  return executedOrder
}

async function executeSwapOrder(
  order: StrategyOrder,
  walletAddress: string,
  executedOrder: ExecutedOrder,
): Promise<void> {
  const result = await prepareSwap({
    inputToken: order.inputToken,
    outputToken: order.outputToken,
    amount: order.inputAmount,
    walletAddress,
  })

  executedOrder.estimatedOutput = result.estimatedOutput
  executedOrder.transactionHash = result.transactionHash
  executedOrder.metadata.priceImpact = result.priceImpact
}

async function executeLimitOrder(
  order: StrategyOrder,
  walletAddress: string,
  executedOrder: ExecutedOrder,
): Promise<void> {
  if (!order.targetPrice) {
    throw new Error("Target price required for limit orders")
  }

  const { findTokenBySymbol } = await import("@/lib/services/jupiter")

  const inputToken = await findTokenBySymbol(order.inputToken)
  const outputToken = await findTokenBySymbol(order.outputToken)

  if (!inputToken) {
    throw new Error(`Token not found: ${order.inputToken}`)
  }

  if (!outputToken) {
    throw new Error(`Token not found: ${order.outputToken}`)
  }

  const makingAmount = Math.floor(order.inputAmount * Math.pow(10, inputToken.decimals)).toString()
  const takingAmount = Math.floor(order.inputAmount * order.targetPrice * Math.pow(10, outputToken.decimals)).toString()

  // 30-day expiration by default
  const expiredAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  const result = await createLimitOrder({
    inputMint: inputToken.address,
    outputMint: outputToken.address,
    maker: walletAddress,
    payer: walletAddress,
    makingAmount,
    takingAmount,
    expiredAt,
  })

  executedOrder.transactionHash = result.transactionHash
  executedOrder.metadata.orderId = result.orderId
}

async function executeDCAOrder(
  order: StrategyOrder,
  walletAddress: string,
  executedOrder: ExecutedOrder,
): Promise<void> {
  const { findTokenBySymbol } = await import("@/lib/services/jupiter")

  const inputToken = await findTokenBySymbol(order.inputToken)
  const outputToken = await findTokenBySymbol(order.outputToken)

  if (!inputToken) {
    throw new Error(`Token not found: ${order.inputToken}`)
  }

  if (!outputToken) {
    throw new Error(`Token not found: ${order.outputToken}`)
  }

  // For autopilot DCA, use daily frequency by default
  const result = await createDCAOrder({
    inputToken: order.inputToken,
    outputToken: order.outputToken,
    totalAmount: order.inputAmount,
    amountPerCycle: order.inputAmount / 10, // Split into 10 cycles
    frequencyHours: 24, // Daily
    walletAddress,
  })

  executedOrder.transactionHash = result.transactionHash
  executedOrder.metadata.dcaId = result.dcaId
}

export function getExecutionLog(strategy?: string, limit = 50): ExecutedOrder[] {
  if (strategy) {
    return executionLog.filter((order) => order.strategy === strategy).slice(-limit)
  }
  return executionLog.slice(-limit)
}

export function getExecutionStats(): {
  totalExecutions: number
  successCount: number
  failureCount: number
  successRate: number
  byStrategy: Record<string, number>
} {
  const byStrategy: Record<string, number> = {}

  for (const order of executionLog) {
    byStrategy[order.strategy] = (byStrategy[order.strategy] || 0) + 1
  }

  const successCount = executionLog.filter((o) => o.status === "success").length
  const failureCount = executionLog.filter((o) => o.status === "failed").length

  return {
    totalExecutions: executionLog.length,
    successCount,
    failureCount,
    successRate: executionLog.length > 0 ? (successCount / executionLog.length) * 100 : 0,
    byStrategy,
  }
}

export function clearExecutionLog(): void {
  executionLog.length = 0
}
