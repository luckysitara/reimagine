import type { NextRequest } from "next/server"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return Response.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const analysis = await analyzePortfolio(walletAddress)

    return Response.json(analysis)
  } catch (error) {
    console.error("[v0] Portfolio API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch portfolio" },
      { status: 500 },
    )
  }
}
