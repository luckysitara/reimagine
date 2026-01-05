import type { NextRequest } from "next/server"
import { executeAutopilotOrder, getExecutionLog, getExecutionStats } from "@/lib/tools/execute-autopilot-order"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import type { StrategyOrder } from "@/lib/services/autopilot-strategies"

export async function POST(request: NextRequest) {
  try {
    const { order, walletAddress } = await request.json()

    if (!order || !walletAddress) {
      return Response.json({ error: "Order and wallet address required" }, { status: 400 })
    }

    const portfolio = await analyzePortfolio(walletAddress)
    const executedOrder = await executeAutopilotOrder(order as StrategyOrder, walletAddress, portfolio)

    return Response.json(executedOrder)
  } catch (error) {
    console.error("[v0] Autopilot execute API error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Failed to execute order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")
    const strategy = searchParams.get("strategy")
    const limit = Number(searchParams.get("limit") || 50)

    if (action === "stats") {
      return Response.json(getExecutionStats())
    }

    const log = getExecutionLog(strategy || undefined, limit)
    return Response.json(log)
  } catch (error) {
    console.error("[v0] Autopilot execute API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch execution log" },
      { status: 500 },
    )
  }
}
