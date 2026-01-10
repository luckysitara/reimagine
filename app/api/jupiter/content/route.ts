import { NextResponse } from "next/server"
import { getCookingContent, getContentByMints } from "@/lib/services/jupiter"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter: cooking or mints" }, { status: 400 })
    }

    // Get trending/cooking content
    if (action === "cooking") {
      const content = await getCookingContent()
      return NextResponse.json(content)
    }

    // Get content for specific mints
    if (action === "mints") {
      const mintsParam = searchParams.get("mints")
      if (!mintsParam) {
        return NextResponse.json({ error: "Missing mints parameter" }, { status: 400 })
      }

      const mints = mintsParam.split(",").filter((m) => m.trim())
      if (mints.length === 0) {
        return NextResponse.json({ error: "Invalid mints format" }, { status: 400 })
      }

      const content = await getContentByMints(mints)
      return NextResponse.json(content)
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Content fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
