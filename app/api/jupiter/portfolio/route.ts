import { type NextRequest, NextResponse } from "next/server"
import { getPortfolioOverview, getStakedJupiter } from "@/lib/services/jupiter-portfolio"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get("wallet")
    const type = searchParams.get("type")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    if (type === "staked-jup") {
      const staked = await getStakedJupiter(wallet)
      return NextResponse.json(staked)
    }

    const portfolio = await getPortfolioOverview(wallet)
    return NextResponse.json(portfolio)
  } catch (error) {
    console.error("[v0] Portfolio API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch portfolio" },
      { status: 500 },
    )
  }
}
