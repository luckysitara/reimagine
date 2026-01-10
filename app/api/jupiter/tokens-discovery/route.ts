import { NextResponse } from "next/server"
import {
  searchTokensAdvanced,
  getTokensByCategory,
  getRecentTokens,
  getTokensByTag,
  type Category,
  type Interval,
} from "@/lib/services/jupiter"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter: search, category, recent, or tag" }, { status: 400 })
    }

    // Search tokens by query
    if (action === "search") {
      const query = searchParams.get("query")
      if (!query) {
        return NextResponse.json({ error: "Missing query parameter" }, { status: 400 })
      }
      const tokens = await searchTokensAdvanced(query)
      return NextResponse.json(tokens)
    }

    // Get tokens by category and interval
    if (action === "category") {
      const category = searchParams.get("category") as Category
      const interval = (searchParams.get("interval") || "24h") as Interval
      const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

      if (!category) {
        return NextResponse.json(
          { error: "Invalid category: toptraded, toptrending, toporganicscore, or recent" },
          { status: 400 },
        )
      }

      // Handle "recent" category separately as it uses different API
      if (category === "recent") {
        const tokens = await getRecentTokens(limit)
        return NextResponse.json(tokens)
      }

      // Handle standard categories
      if (!["toptraded", "toptrending", "toporganicscore"].includes(category)) {
        return NextResponse.json(
          { error: "Invalid category: toptraded, toptrending, toporganicscore, or recent" },
          { status: 400 },
        )
      }

      const tokens = await getTokensByCategory(category, interval, limit)
      return NextResponse.json(tokens)
    }

    // Get recently created tokens
    if (action === "recent") {
      const limit = Number.parseInt(searchParams.get("limit") || "30", 10)
      const tokens = await getRecentTokens(limit)
      return NextResponse.json(tokens)
    }

    // Get tokens by tag
    if (action === "tag") {
      const tag = searchParams.get("tag") as "verified" | "lst"
      if (!tag || !["verified", "lst"].includes(tag)) {
        return NextResponse.json({ error: "Invalid tag: verified or lst" }, { status: 400 })
      }
      const tokens = await getTokensByTag(tag)
      return NextResponse.json(tokens)
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Token discovery error:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}
