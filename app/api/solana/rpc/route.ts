import { NextResponse } from "next/server"

function getHeliusRPCUrl(): string {
  const url = process.env.HELIUS_RPC_URL
  if (!url) {
    throw new Error("HELIUS_RPC_URL environment variable is not configured")
  }
  return url
}

export async function POST(request: Request) {
  try {
    let rpcUrl: string
    try {
      rpcUrl = getHeliusRPCUrl()
    } catch (error) {
      console.error("[v0] HELIUS_RPC_URL is not configured on the server")
      return NextResponse.json(
        {
          error: "RPC endpoint not configured. Please set HELIUS_RPC_URL environment variable.",
          details:
            "Get your free API key at https://dev.helius.xyz/ and set it in your deployment settings as: HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
        },
        { status: 500 },
      )
    }

    const contentType = request.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 })
    }

    let body
    try {
      const text = await request.text()
      if (!text) {
        return NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 400 },
      )
    }

    // Validate RPC request structure
    if (!body.method || !body.jsonrpc) {
      return NextResponse.json({ error: "Invalid RPC request format" }, { status: 400 })
    }

    console.log("[v0] Secure RPC proxy request:", body.method)

    // Try Helius RPC first with retry logic, fallback to public RPC
    const publicRpc = "https://api.mainnet-beta.solana.com"
    let response: Response | null = null
    let lastError: Error | null = null

    // Attempt Helius RPC with retry
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[v0] Attempting Helius RPC (attempt ${attempt + 1}/2)`)
        response = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(40000), // 40 second timeout to allow for slow responses
        })

        // If response is OK, we're done - exit both the try and the outer loop
        if (response.ok) {
          console.log("[v0] Helius RPC succeeded")
          break
        }

        // If we got a non-OK response, log it but try again on first attempt
        const errorText = await response.text()
        console.warn(`[v0] Helius RPC returned HTTP ${response.status}:`, errorText.substring(0, 200))

        // On 401/403, don't retry - auth error
        if (response.status === 401 || response.status === 403) {
          lastError = new Error(`Authentication error: ${response.status}`)
          break
        }

        // On first attempt, wait and retry
        if (attempt === 0) {
          console.log("[v0] Retrying Helius RPC...")
          await new Promise((resolve) => setTimeout(resolve, 500))
          continue
        }

        // On second attempt, fall through to public RPC
        lastError = new Error(`HTTP ${response.status}`)
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError))
        console.warn(`[v0] Helius RPC attempt ${attempt + 1} network error:`, lastError.message)

        // If this was the first attempt, try again
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          continue
        }

        // Second attempt failed, will try public RPC
      }
    }

    // If Helius failed completely, try public RPC as fallback
    if (!response || !response.ok) {
      console.log("[v0] Falling back to public Solana RPC...")
      try {
        response = await fetch(publicRpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(40000),
        })
        console.log("[v0] Public RPC fallback responded with status", response.status)
      } catch (publicError) {
        console.error("[v0] Public RPC fallback also failed:", publicError)
        return NextResponse.json(
          {
            error: "All RPC endpoints are unavailable",
            details: "Please try again in a few moments",
          },
          { status: 503 },
        )
      }
    }

    if (!response) {
      return NextResponse.json(
        { error: "Failed to get RPC response" },
        { status: 503 },
      )
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] RPC endpoint error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 },
        )
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Invalid RPC API key. Please check your HELIUS_RPC_URL configuration." },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: `RPC request failed: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()

    if (data.error) {
      console.error("[v0] RPC error response:", data.error)
      return NextResponse.json(
        {
          error: data.error.message || "RPC request failed",
          code: data.error.code,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] RPC proxy error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "RPC request failed",
        hint: "Check that HELIUS_RPC_URL is properly configured in your environment variables",
      },
      { status: 500 },
    )
  }
}

// Handle GET requests with helpful error message
export async function GET() {
  return NextResponse.json(
    {
      error: "This endpoint only accepts POST requests with JSON-RPC payloads",
      usage: {
        method: "POST",
        contentType: "application/json",
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: ["WALLET_ADDRESS"],
        },
      },
    },
    { status: 405 },
  )
}
