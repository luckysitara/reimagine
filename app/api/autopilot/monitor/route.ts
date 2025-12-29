import type { NextRequest } from "next/server"
import { monitorPortfolio } from "@/lib/services/autopilot-monitor"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const snapshot = await monitorPortfolio(walletAddress)

    return Response.json(snapshot)
  } catch (error) {
    console.error("[v0] Autopilot monitor API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to monitor portfolio" },
      { status: 500 },
    )
  }
}
