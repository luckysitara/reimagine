import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { description } = await request.json()

    if (!description || description.trim() === "") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    // In production, integrate with: fal.ai, DALL-E 3, Stable Diffusion, or Midjourney
    const encodedDescription = encodeURIComponent(description.slice(0, 100))

    // Generate a color hash from description for consistent colors
    const hashCode = description.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    const hue = Math.abs(hashCode % 360)

    // Create SVG data URL with gradient based on description
    const svgContent = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 50%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360}, 70%, 40%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#grad)" />
        <circle cx="200" cy="200" r="120" fill="rgba(255,255,255,0.2)" />
        <text x="200" y="220" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle" font-weight="bold">
          ${description.slice(0, 2).toUpperCase()}
        </text>
      </svg>
    `.trim()

    const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`

    // TODO: For production, use a real AI image generation service:
    // Example with fal.ai (already has integration):
    // const falClient = fal(process.env.FAL_KEY)
    // const result = await falClient.subscribe("fal-ai/flux/schnell", {
    //   input: { prompt: `Professional crypto token logo: ${description}`, image_size: "square" }
    // })
    // const imageUrl = result.images[0].url

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Token image generated successfully (using placeholder - integrate AI service for production)",
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
