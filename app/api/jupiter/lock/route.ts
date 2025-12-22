import { NextResponse } from "next/server"
import { getVestingSchedules, getLockedTokens, claimVestedTokens, getUnlockSchedule } from "@/lib/services/jupiter-lock"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, vestingAddress, beneficiary } = body

    if (action === "claim") {
      return NextResponse.json(await claimVestedTokens(vestingAddress, beneficiary))
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Jupiter Lock API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lock API request failed" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const type = searchParams.get("type")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    switch (type) {
      case "vesting":
        return NextResponse.json(await getVestingSchedules(wallet))

      case "locked":
        return NextResponse.json(await getLockedTokens(wallet))

      case "schedule":
        return NextResponse.json(await getUnlockSchedule(wallet))

      default:
        // Return all by default
        const [vesting, locked, schedule] = await Promise.all([
          getVestingSchedules(wallet),
          getLockedTokens(wallet),
          getUnlockSchedule(wallet),
        ])

        return NextResponse.json({ vesting, locked, schedule })
    }
  } catch (error) {
    console.error("[v0] Jupiter Lock API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lock API request failed" },
      { status: 500 },
    )
  }
}
