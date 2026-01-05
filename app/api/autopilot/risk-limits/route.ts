import type { NextRequest } from "next/server"
import {
  setRiskLimits,
  getRiskLimits,
  validateLimits,
  getDailyLoss,
  resetDailyLoss,
} from "@/lib/services/autopilot-risk-manager"
import type { RiskLimits } from "@/lib/services/autopilot-risk-manager"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("wallet")
    const action = searchParams.get("action")

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (action === "daily-loss") {
      const loss = getDailyLoss(walletAddress)
      return Response.json({ walletAddress, dailyLoss: loss })
    }

    const limits = getRiskLimits(walletAddress)
    return Response.json(limits)
  } catch (error) {
    console.error("[v0] Risk limits API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch risk limits" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, limits, action } = await request.json()

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (action === "reset-daily-loss") {
      resetDailyLoss(walletAddress)
      return Response.json({ success: true, message: "Daily loss tracking reset" })
    }

    if (limits) {
      // Validate limits
      const validation = validateLimits(limits)
      if (!validation.valid) {
        return Response.json({ error: "Invalid limits", errors: validation.errors }, { status: 400 })
      }

      // Set limits
      setRiskLimits(walletAddress, limits as Partial<RiskLimits>)
      const updated = getRiskLimits(walletAddress)
      return Response.json(updated)
    }

    return Response.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Risk limits API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update risk limits" },
      { status: 500 },
    )
  }
}
