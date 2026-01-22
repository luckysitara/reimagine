import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const inputMint = searchParams.get("inputMint")
    const outputMint = searchParams.get("outputMint")
    const amount = searchParams.get("amount")
    const slippageBps = searchParams.get("slippageBps") || "100"
    const taker = searchParams.get("taker")

    if (!inputMint || !outputMint || !amount || !taker) {
      return NextResponse.json(
        { error: "Missing required parameters: inputMint, outputMint, amount, taker" },
        { status: 400 },
      )
    }

    const url = `${JUPITER_ULTRA_API}/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&taker=${taker}&slippageBps=${slippageBps}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Jupiter Ultra API error:", response.status, error)
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}: ${error}` },
        { status: response.status },
      )
    }

    const order = await response.json()

    if (order.error) {
      console.error("[v0] Jupiter returned error:", order.error, order.errorMessage)

      // Handle specific error cases
      if (order.errorCode === 1 || order.errorMessage?.includes("Insufficient funds")) {
        return NextResponse.json(
          {
            error: "Insufficient funds. Your wallet doesn't have enough balance for this swap (including fees).",
            details: order,
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: order.errorMessage || order.error || "Jupiter API returned an error",
          details: order,
        },
        { status: 400 },
      )
    }

    if (!order.transaction || order.transaction === "") {
      console.error("[v0] Jupiter response missing or empty transaction field")
      console.error("[v0] Response details:", {
        hasTransaction: !!order.transaction,
        transactionLength: order.transaction?.length || 0,
        error: order.error,
        errorMessage: order.errorMessage,
        errorCode: order.errorCode,
      })

      return NextResponse.json(
        {
          error:
            "Jupiter API did not return a transaction. This may indicate insufficient funds, unavailable swap path, or invalid parameters.",
          details: order,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(order, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] Jupiter Ultra order proxy error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order" },
      { status: 500 },
    )
  }
}
