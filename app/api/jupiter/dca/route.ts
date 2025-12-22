import { type NextRequest, NextResponse } from "next/server"
import { getDCAAccounts, createDCAOrder, closeDCAOrder, withdrawDCA } from "@/lib/services/jupiter-recurring"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const accounts = await getDCAAccounts(wallet)
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("[v0] DCA API error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    if (action === "create") {
      const result = await createDCAOrder(params)
      return NextResponse.json(result)
    } else if (action === "close") {
      const result = await closeDCAOrder(params.dcaPubkey, params.user)
      return NextResponse.json(result)
    } else if (action === "withdraw") {
      const result = await withdrawDCA(params.dcaPubkey, params.user, params.amount)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] DCA action error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process DCA order" },
      { status: 500 },
    )
  }
}
