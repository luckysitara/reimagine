import { type NextRequest, NextResponse } from "next/server"
import { getLendingPools, getUserLendingPositions, depositToPool, withdrawFromPool } from "@/lib/services/jupiter-lend"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get("wallet")
    const action = searchParams.get("action")

    if (action === "pools") {
      const pools = await getLendingPools()
      return NextResponse.json(pools)
    }

    if (action === "positions" && wallet) {
      const positions = await getUserLendingPositions(wallet)
      return NextResponse.json(positions)
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Lend API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch lending data" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, pool, amount, user } = body

    if (action === "deposit") {
      const result = await depositToPool(pool, amount, user)
      return NextResponse.json(result)
    } else if (action === "withdraw") {
      const result = await withdrawFromPool(pool, amount, user)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Lend action error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process lending action" },
      { status: 500 },
    )
  }
}
