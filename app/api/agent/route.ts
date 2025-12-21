import { GoogleGenerativeAI } from "@google/generative-ai"
import type { FunctionDeclaration } from "@google/generative-ai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"

const systemPrompt = `You are an AI assistant for Reimagine, a DeFi trading platform on Solana. You help users execute blockchain operations through natural language.

Your capabilities:
- Execute token swaps using Jupiter DEX aggregator with Ultra API
- Provide portfolio analysis and recommendations
- Get real-time token prices
- Explain DeFi concepts in simple terms
- Help users make informed trading decisions

When users ask to swap tokens:
1. Extract the input token, output token, and amount
2. Use the execute_swap tool with the correct parameters
3. Confirm the transaction details clearly
4. Explain price impact and estimated output

Important notes:
- Always verify wallet connection before executing swaps
- Warn users about high price impact (>1%)
- Use clear, non-technical language
- Provide context for recommendations

Always prioritize security and provide clear explanations. Use metric formatting for numbers (K for thousands, M for millions).`

const tools: FunctionDeclaration[] = [
  {
    name: "execute_swap",
    description:
      "Prepare a token swap on Solana using Jupiter DEX Ultra API. Returns transaction details including estimated output, price impact, and transaction data for user confirmation.",
    parameters: {
      type: "object" as const,
      properties: {
        inputToken: {
          type: "string" as const,
          description: "Symbol of the input token (e.g., SOL, USDC, BONK)",
        },
        outputToken: {
          type: "string" as const,
          description: "Symbol of the output token (e.g., SOL, USDC, BONK)",
        },
        amount: {
          type: "number" as const,
          description: "Amount of input token to swap (in whole units, not lamports)",
        },
      },
      required: ["inputToken", "outputToken", "amount"],
    },
  },
  {
    name: "analyze_portfolio",
    description:
      "Analyze the user's Solana portfolio and provide comprehensive insights, recommendations, risk assessment, and diversification score",
    parameters: {
      type: "object" as const,
      properties: {
        walletAddress: {
          type: "string" as const,
          description: "Solana wallet address to analyze (base58 encoded public key)",
        },
      },
      required: ["walletAddress"],
    },
  },
  {
    name: "get_token_price",
    description: "Get the current price of a Solana token in USD using real-time Jupiter pricing data",
    parameters: {
      type: "object" as const,
      properties: {
        tokenSymbol: {
          type: "string" as const,
          description: "Token symbol (e.g., SOL, USDC, BONK, JUP)",
        },
      },
      required: ["tokenSymbol"],
    },
  },
]

export async function POST(request: Request) {
  try {
    const { message, walletAddress } = await request.json()

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    console.log("[v0] Checking Google AI API key configuration...")
    console.log("[v0] API key exists:", !!apiKey)
    console.log("[v0] API key length:", apiKey?.length || 0)

    if (!apiKey || apiKey.trim() === "") {
      console.error("[v0] GOOGLE_GENERATIVE_AI_API_KEY is not set or empty")
      return Response.json(
        {
          error:
            "AI service not configured properly. Please check that GOOGLE_GENERATIVE_AI_API_KEY is set in environment variables.",
        },
        { status: 500 },
      )
    }

    if (apiKey.includes("your_") || apiKey.includes("YOUR_") || apiKey.includes("placeholder")) {
      console.error("[v0] GOOGLE_GENERATIVE_AI_API_KEY appears to be a placeholder value")
      return Response.json(
        {
          error:
            "AI service not configured with a valid API key. Please update GOOGLE_GENERATIVE_AI_API_KEY with your actual Gemini API key from Google AI Studio.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] API key validated, initializing Google AI client...")

    let genAI: GoogleGenerativeAI
    try {
      genAI = new GoogleGenerativeAI(apiKey)
    } catch (initError) {
      console.error("[v0] Failed to initialize Google AI client:", initError)
      return Response.json(
        {
          error: "Failed to initialize AI service. Please check your API key configuration.",
          details: initError instanceof Error ? initError.message : "Unknown initialization error",
        },
        { status: 500 },
      )
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: tools }],
      toolConfig: {
        functionCallingConfig: {
          mode: "AUTO" as const,
        },
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    })

    const userPrompt = walletAddress
      ? `User wallet: ${walletAddress}\n\nUser message: ${message}`
      : `User message: ${message}\n\nNote: User wallet not connected - swap operations require wallet connection.`

    console.log("[v0] Sending request to Gemini API...")

    let retries = 0
    const maxRetries = 2
    let result: any

    while (retries <= maxRetries) {
      try {
        result = await Promise.race([
          model.generateContent(userPrompt),
          new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timeout after 30 seconds")), 30000)),
        ])
        console.log("[v0] Gemini API request successful")
        break // Success, exit retry loop
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        console.error("[v0] Gemini API request failed:", errorMessage)

        // Check if it's a rate limit error
        if (
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("RATE_LIMIT") ||
          errorMessage.includes("429")
        ) {
          retries++
          if (retries > maxRetries) {
            throw new Error(
              "API rate limit exceeded. The free tier has strict limits (5-15 requests per minute, ~20 per day for Flash models). Please wait a moment and try again, or consider upgrading your API key.",
            )
          }

          // Exponential backoff: 2s, 4s
          const waitTime = Math.pow(2, retries) * 1000
          console.log(`[v0] Rate limited, waiting ${waitTime}ms before retry ${retries}/${maxRetries}...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        } else {
          throw error
        }
      }
    }

    const response = result.response

    console.log("[v0] Gemini response received successfully")

    // Process function calls if any
    const toolResults: Array<{ tool: string; result: unknown; success: boolean }> = []
    let responseText = ""

    const functionCalls = response.functionCalls()

    if (functionCalls && functionCalls.length > 0) {
      console.log("[v0] Processing", functionCalls.length, "function calls")

      for (const functionCall of functionCalls) {
        console.log("[v0] Executing tool:", functionCall.name)

        try {
          switch (functionCall.name) {
            case "execute_swap": {
              const args = functionCall.args as { inputToken: string; outputToken: string; amount: number }

              if (!walletAddress) {
                toolResults.push({
                  tool: "execute_swap",
                  success: false,
                  result: {
                    error: "Wallet not connected. Please connect your wallet to execute swaps.",
                  },
                })
                break
              }

              const swapPrep = await prepareSwap({
                ...args,
                walletAddress,
              })

              toolResults.push({
                tool: "execute_swap",
                success: true,
                result: {
                  message: `Swap prepared: ${args.amount} ${args.inputToken} → ${swapPrep.estimatedOutput.toFixed(6)} ${args.outputToken}`,
                  inputToken: args.inputToken,
                  outputToken: args.outputToken,
                  inputAmount: args.amount,
                  estimatedOutput: swapPrep.estimatedOutput,
                  priceImpact: swapPrep.priceImpact,
                  requestId: swapPrep.requestId,
                  hasTransaction: true,
                },
              })
              break
            }

            case "analyze_portfolio": {
              const args = functionCall.args as { walletAddress: string }

              const addressToAnalyze = args.walletAddress || walletAddress

              if (!addressToAnalyze) {
                toolResults.push({
                  tool: "analyze_portfolio",
                  success: false,
                  result: {
                    error: "No wallet address provided. Please connect your wallet or specify an address.",
                  },
                })
                break
              }

              const analysis = await analyzePortfolio(addressToAnalyze)

              toolResults.push({
                tool: "analyze_portfolio",
                success: true,
                result: {
                  totalValue: analysis.totalValueUSD,
                  solBalance: analysis.solBalance,
                  tokenCount: analysis.tokens.length,
                  diversificationScore: analysis.diversification.score,
                  diversificationMessage: analysis.diversification.message,
                  riskLevel: analysis.riskLevel,
                  recommendations: analysis.recommendations,
                  tokens: analysis.tokens.slice(0, 5), // Top 5 tokens
                },
              })
              break
            }

            case "get_token_price": {
              const args = functionCall.args as { tokenSymbol: string }
              const price = await getTokenPrice(args.tokenSymbol)

              toolResults.push({
                tool: "get_token_price",
                success: true,
                result: {
                  token: price.symbol,
                  priceUSD: price.priceUSD,
                  source: price.source,
                  formatted: `$${price.priceUSD.toFixed(price.priceUSD < 1 ? 6 : 2)}`,
                },
              })
              break
            }

            default:
              toolResults.push({
                tool: functionCall.name,
                success: false,
                result: { error: "Unknown tool" },
              })
          }
        } catch (error) {
          console.error(`[v0] Tool ${functionCall.name} failed:`, error)
          toolResults.push({
            tool: functionCall.name,
            success: false,
            result: {
              error: error instanceof Error ? error.message : "Tool execution failed",
            },
          })
        }
      }

      const followUpPrompt = `Tool execution results:\n${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a clear, user-friendly summary of these results. Include:
1. What was done
2. Key numbers and metrics
3. Any warnings or important notes
4. Next steps if applicable

Format numbers clearly and explain any technical terms in simple language.`

      const followUpResult = await model.generateContent(followUpPrompt)
      responseText = followUpResult.response.text()
    } else {
      responseText = response.text()
    }

    return Response.json({
      text: responseText,
      toolCalls: functionCalls?.map((fc: any) => ({
        toolName: fc.name,
        args: fc.args,
      })),
      toolResults,
    })
  } catch (error: unknown) {
    console.error("[v0] Agent API error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    console.error("[v0] Error details:", {
      message: errorMessage,
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : "No stack trace",
    })

    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY_INVALID")) {
      return Response.json(
        {
          error: "Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY configuration.",
          details: errorMessage,
        },
        { status: 401 },
      )
    }

    if (errorMessage.includes("timeout")) {
      return Response.json(
        {
          error: "The AI service is taking too long to respond. Please try a simpler query.",
          details: errorMessage,
        },
        { status: 504 },
      )
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("RATE_LIMIT")) {
      return Response.json(
        {
          error: "API rate limit exceeded. Please try again in a moment.",
          details:
            "The free tier has limits: 5-15 requests per minute, approximately 20 per day. Consider waiting or upgrading your API key.",
          retryAfter: 60,
        },
        { status: 429 },
      )
    }

    if (errorMessage.includes("Token not found")) {
      return Response.json(
        {
          error: "Token not found. Please check the token symbol and try again.",
          details: errorMessage,
        },
        { status: 400 },
      )
    }

    if (errorMessage.includes("Wallet address is required")) {
      return Response.json(
        {
          error: "Wallet connection required. Please connect your wallet to perform this action.",
          details: errorMessage,
        },
        { status: 400 },
      )
    }

    return Response.json(
      {
        error: "I'm having trouble processing your request right now. Please try again.",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
