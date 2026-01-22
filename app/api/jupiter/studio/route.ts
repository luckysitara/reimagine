import { NextResponse } from "next/server"
import {
  createTokenTransaction,
  createTokenMetadata,
  getPresignedImageUrl,
  getTokenCreationStatus,
  getUnclaimedFees,
  claimCreatorFees,
  getTokenPoolAddresses,
} from "@/lib/services/jupiter-studio"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case "presigned-url":
        return NextResponse.json(await getPresignedImageUrl(params.fileName, params.contentType))

      case "create-metadata":
        return NextResponse.json(await createTokenMetadata(params))

      case "create-token":
        return NextResponse.json(await createTokenTransaction(params))

      case "claim-fees":
        return NextResponse.json(await claimCreatorFees(params.mint, params.creator))

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Jupiter Studio API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Studio API request failed" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const mint = searchParams.get("mint")
    const signature = searchParams.get("signature")
    const creator = searchParams.get("creator")

    switch (action) {
      case "status":
        if (!signature) return NextResponse.json({ error: "Signature required" }, { status: 400 })
        return NextResponse.json(await getTokenCreationStatus(signature))

      case "fees":
        if (!mint || !creator) return NextResponse.json({ error: "Mint and creator required" }, { status: 400 })
        return NextResponse.json(await getUnclaimedFees(mint, creator))

      case "pool":
        if (!mint) return NextResponse.json({ error: "Mint required" }, { status: 400 })
        return NextResponse.json(await getTokenPoolAddresses(mint))

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Jupiter Studio API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Studio API request failed" },
      { status: 500 },
    )
  }
}
