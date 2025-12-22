import { NextResponse } from "next/server"
import {
  createSendLink,
  getSendLink,
  claimSendLink,
  cancelSendLink,
  getSenderLinks,
  getRecipientLinks,
} from "@/lib/services/jupiter-send"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case "create":
        return NextResponse.json(await createSendLink(params))

      case "claim":
        return NextResponse.json(await claimSendLink(params.linkId, params.claimer))

      case "cancel":
        return NextResponse.json(await cancelSendLink(params.linkId, params.sender))

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Jupiter Send API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send API request failed" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get("linkId")
    const sender = searchParams.get("sender")
    const recipient = searchParams.get("recipient")

    if (linkId) {
      return NextResponse.json(await getSendLink(linkId))
    }

    if (sender) {
      return NextResponse.json(await getSenderLinks(sender))
    }

    if (recipient) {
      return NextResponse.json(await getRecipientLinks(recipient))
    }

    return NextResponse.json({ error: "linkId, sender, or recipient required" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Jupiter Send API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send API request failed" },
      { status: 500 },
    )
  }
}
