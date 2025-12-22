import { type NextRequest, NextResponse } from "next/server"
import { getTokenPrice, getMultipleTokenPrices, getPriceHistory } from "@/lib/services/jupiter-price"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mint = searchParams.get("mint") || searchParams.get("ids")
    const mints = searchParams.get("mints")
    const history = searchParams.get("history")
    const interval = searchParams.get("interval") as "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | null

    console.log("[v0] Price API request:", { mint, mints, history, interval })

    if (history && mint) {
      const data = await getPriceHistory(mint, interval || "1h")
      return NextResponse.json(data)
    }

    if (mints) {
      const mintArray = mints.split(",")
      const prices = await getMultipleTokenPrices(mintArray)
      return NextResponse.json(prices)
    }

    if (mint) {
      const price = await getTokenPrice(mint)

      console.log("[v0] Price result:", price)

      if (!price) {
        return NextResponse.json({
          data: {
            [mint]: {
              id: mint,
              price: 0,
              mintSymbol: "UNKNOWN",
              vsToken: "USDC",
              vsTokenSymbol: "USDC",
            },
          },
        })
      }

      return NextResponse.json({ data: { [mint]: price } })
    }

    return NextResponse.json({ error: "Mint address required (use 'mint' or 'ids' parameter)" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Price API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch price data" },
      { status: 500 },
    )
  }
}
