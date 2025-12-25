import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, currentPrice, targetPrice, type, walletAddress } = await request.json()

    console.log("[v0] Price alert notification:", { token, currentPrice, targetPrice, type })

    // In production: validate and send notification
    // await pushNotificationService.send({
    //   userId: walletAddress,
    //   type: 'price_alert',
    //   data: { token, currentPrice, targetPrice, type }
    // })

    return NextResponse.json({
      success: true,
      message: `Price alert sent for ${token}`,
    })
  } catch (error) {
    console.error("[v0] Notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
