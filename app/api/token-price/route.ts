import type { NextRequest } from "next/server"
import { getTokenPrice } from "@/lib/tools/get-token-price"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return Response.json({ error: "Token symbol is required" }, { status: 400 })
    }

    const price = await getTokenPrice(symbol)

    return Response.json(price)
  } catch (error) {
    console.error("[v0] Token price API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch token price" },
      { status: 500 },
    )
  }
}
