import type { NextRequest } from "next/server"
import { getExecutionStats } from "@/lib/tools/execute-autopilot-order"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const stats = getExecutionStats()

    console.log(`[v0] Autopilot disabled for ${walletAddress}`)

    return Response.json({
      success: true,
      message: "Autopilot disabled successfully",
      walletAddress,
      sessionStats: stats,
    })
  } catch (error) {
    console.error("[v0] Disable autopilot error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to disable autopilot" },
      { status: 500 },
    )
  }
}
