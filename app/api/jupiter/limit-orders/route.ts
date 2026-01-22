import { type NextRequest, NextResponse } from "next/server"
import { getOpenOrders, createLimitOrder, cancelLimitOrder } from "@/lib/services/jupiter-trigger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const orders = await getOpenOrders(wallet)
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Limit orders API error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    if (action === "create") {
      const result = await createLimitOrder({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        maker: params.maker,
        payer: params.payer,
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        expiredAt: params.expiredAt,
      })
      return NextResponse.json(result)
    } else if (action === "cancel") {
      const result = await cancelLimitOrder(params.orderPubkey, params.maker)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Limit order action error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process limit order" },
      { status: 500 },
    )
  }
}
