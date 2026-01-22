import { NextResponse } from "next/server"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_API_KEY = process.env.JUPITER_API_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { signedTransaction, requestId } = body

    if (!signedTransaction || !requestId) {
      return NextResponse.json({ error: "Missing required parameters: signedTransaction, requestId" }, { status: 400 })
    }

    console.log("[v0] Proxying Jupiter Ultra execute request")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for execution

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (JUPITER_API_KEY) {
      headers["x-api-key"] = JUPITER_API_KEY
    }

    const response = await fetch(`${JUPITER_ULTRA_API}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        signedTransaction,
        requestId,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Jupiter Ultra execute API error:", response.status, error)
      return NextResponse.json(
        { error: `Jupiter API returned ${response.status}: ${error}` },
        { status: response.status },
      )
    }

    const result = await response.json()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Jupiter Ultra execute proxy error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - Jupiter API is taking too long to respond" },
        { status: 504 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute order" },
      { status: 500 },
    )
  }
}
