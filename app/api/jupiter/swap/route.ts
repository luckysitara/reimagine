import { NextResponse } from "next/server"

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"
const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { quoteResponse, userPublicKey } = body

    if (!quoteResponse || !userPublicKey) {
      return NextResponse.json({ error: "Missing required parameters: quoteResponse, userPublicKey" }, { status: 400 })
    }

    console.log("[v0] Note: Using deprecated swap endpoint. Consider migrating to Ultra API /order + /execute flow")

    if (quoteResponse.transaction) {
      return NextResponse.json({
        swapTransaction: quoteResponse.transaction,
      })
    }

    // Fallback: If somehow old quote format is used, return error
    return NextResponse.json(
      {
        error: "Invalid quote response format. Please use the Ultra API /order endpoint to get a transaction.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("[v0] Jupiter swap proxy error:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare swap transaction" },
      { status: 500 },
    )
  }
}
