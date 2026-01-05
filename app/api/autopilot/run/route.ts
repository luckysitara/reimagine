import type { NextRequest } from "next/server"
import { monitorPortfolio } from "@/lib/services/autopilot-monitor"
import { evaluateStrategies, DEFAULT_STRATEGIES, validateStrategyOrder } from "@/lib/services/autopilot-strategies"
import { executeAutopilotOrder } from "@/lib/tools/execute-autopilot-order"
import { validateStrategyOrder as validateRisk } from "@/lib/services/autopilot-risk-manager"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Step 1: Monitor portfolio
    const snapshot = await monitorPortfolio(walletAddress)

    // Step 2: Evaluate strategies
    const strategyOrders = await evaluateStrategies(snapshot, DEFAULT_STRATEGIES)

    if (strategyOrders.length === 0) {
      return Response.json({
        success: true,
        walletAddress,
        snapshot,
        executed: [],
        message: "No trading opportunities found",
      })
    }

    // Step 3: Get portfolio for validation
    const portfolio = await analyzePortfolio(walletAddress)

    // Step 4: Execute valid orders
    const executed = []
    for (const order of strategyOrders) {
      // Validate order
      if (!validateStrategyOrder(order, portfolio)) {
        console.warn(`[v0] Strategy order validation failed:`, order)
        continue
      }

      // Check risk limits
      const riskCheck = validateRisk(order, portfolio, walletAddress)
      if (!riskCheck.allowed) {
        console.warn(`[v0] Risk check failed: ${riskCheck.reason}`)
        continue
      }

      // Execute order
      const result = await executeAutopilotOrder(order, walletAddress, portfolio)
      executed.push(result)
    }

    return Response.json({
      success: true,
      walletAddress,
      snapshot,
      opportunities: strategyOrders,
      executed,
      message: `Found ${strategyOrders.length} opportunities, executed ${executed.length}`,
    })
  } catch (error) {
    console.error("[v0] Autopilot run error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Failed to run autopilot" }, { status: 500 })
  }
}
