import type { NextRequest } from "next/server"
import { getRiskLimits } from "@/lib/services/autopilot-risk-manager"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Get risk limits for wallet
    const limits = getRiskLimits(walletAddress)

    console.log(`[v0] Autopilot enabled for ${walletAddress}`)

    return Response.json({
      success: true,
      message: "Autopilot enabled successfully",
      walletAddress,
      limits,
    })
  } catch (error) {
    console.error("[v0] Enable autopilot error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to enable autopilot" },
      { status: 500 },
    )
  }
}
