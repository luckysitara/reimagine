import { GoogleGenAI, type FunctionDeclaration, FunctionCallingConfigMode } from "@google/genai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"

const systemPrompt = `You are an AI assistant for Reimagine, a DeFi trading platform on Solana. You help users execute blockchain operations through natural language.

Your capabilities:
- Execute token swaps using Jupiter DEX aggregator
- Provide portfolio analysis and recommendations
- Get real-time token prices
- Explain DeFi concepts in simple terms
- Help users make informed trading decisions

When users ask to swap tokens:
1. Extract the input token, output token, and amount
2. Use the execute_swap tool with the correct parameters
3. Confirm the transaction details clearly

Always prioritize security and provide clear explanations. Use metric formatting for numbers (K for thousands, M for millions).`

const tools: FunctionDeclaration[] = [
  {
    name: "execute_swap",
    description: "Prepare a token swap on Solana using Jupiter DEX. Returns transaction details for user confirmation.",
    parameters: {
      type: "object",
      properties: {
        inputToken: {
          type: "string",
          description: "Symbol of the input token (e.g., SOL, USDC)",
        },
        outputToken: {
          type: "string",
          description: "Symbol of the output token (e.g., SOL, USDC)",
        },
        amount: {
          type: "number",
          description: "Amount of input token to swap",
        },
      },
      required: ["inputToken", "outputToken", "amount"],
    },
  },
  {
    name: "analyze_portfolio",
    description: "Analyze the user's Solana portfolio and provide insights, recommendations, and risk assessment",
    parameters: {
      type: "object",
      properties: {
        walletAddress: {
          type: "string",
          description: "Solana wallet address to analyze",
        },
      },
      required: ["walletAddress"],
    },
  },
  {
    name: "get_token_price",
    description: "Get the current price of a Solana token in USD",
    parameters: {
      type: "object",
      properties: {
        tokenSymbol: {
          type: "string",
          description: "Token symbol (e.g., SOL, USDC, BONK)",
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

    if (!apiKey) {
      console.error("[v0] GOOGLE_GENERATIVE_AI_API_KEY is not set")
      console.error(
        "[v0] Available env vars:",
        Object.keys(process.env).filter((key) => key.includes("GOOGLE")),
      )
      return Response.json(
        {
          error: "AI service not configured. The GOOGLE_GENERATIVE_AI_API_KEY environment variable is missing.",
          hint: "Add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file and restart the dev server",
        },
        { status: 500 },
      )
    }

    console.log("[v0] API key found, length:", apiKey.length)

    const genAI = new GoogleGenAI({
      apiKey: apiKey,
    })

    console.log("[v0] GoogleGenAI client initialized")

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: tools }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    })

    console.log("[v0] Model configured")

    const userPrompt = walletAddress ? `User wallet: ${walletAddress}\n\nUser message: ${message}` : message

    console.log("[v0] Sending request to Gemini...")

    const result = (await Promise.race([
      model.generateContent(userPrompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000)),
    ])) as { response: any }

    const response = result.response

    console.log("[v0] Gemini response received")

    // Process function calls if any
    const toolResults: Array<{ tool: string; result: unknown; success: boolean }> = []
    let responseText = ""

    const functionCalls = response.functionCalls()

    if (functionCalls && functionCalls.length > 0) {
      console.log("[v0] Function calls detected:", functionCalls)

      for (const functionCall of functionCalls) {
        console.log("[v0] Processing function call:", functionCall.name, functionCall.args)

        try {
          switch (functionCall.name) {
            case "execute_swap": {
              const args = functionCall.args as { inputToken: string; outputToken: string; amount: number }
              const swapPrep = await prepareSwap({
                ...args,
                walletAddress: walletAddress || undefined,
              })
              toolResults.push({
                tool: "execute_swap",
                success: true,
                result: {
                  message: `Swap prepared: ${args.amount} ${args.inputToken} → ${swapPrep.estimatedOutput.toFixed(4)} ${args.outputToken}`,
                  estimatedOutput: swapPrep.estimatedOutput,
                  priceImpact: swapPrep.priceImpact,
                  transaction: swapPrep.transaction,
                },
              })
              break
            }

            case "analyze_portfolio": {
              const args = functionCall.args as { walletAddress: string }
              const analysis = await analyzePortfolio(args.walletAddress)
              toolResults.push({
                tool: "analyze_portfolio",
                success: true,
                result: {
                  totalValue: analysis.totalValueUSD,
                  solBalance: analysis.solBalance,
                  tokenCount: analysis.tokens.length,
                  diversificationScore: analysis.diversification.score,
                  riskLevel: analysis.riskLevel,
                  recommendations: analysis.recommendations,
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
          console.error(`[v0] Tool ${functionCall.name} error:`, error)
          toolResults.push({
            tool: functionCall.name,
            success: false,
            result: {
              error: error instanceof Error ? error.message : "Tool execution failed",
            },
          })
        }
      }

      // Generate follow-up response with tool results
      const followUpPrompt = `Tool results:\n${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a natural language summary of these results for the user.`
      const followUpResult = await model.generateContent(followUpPrompt)
      responseText = followUpResult.response.text()
    } else {
      responseText = response.text()
    }

    return Response.json({
      text: responseText,
      toolCalls: functionCalls?.map((fc) => ({
        toolName: fc.name,
        args: fc.args,
      })),
      toolResults,
    })
  } catch (error: unknown) {
    console.error("[v0] Agent API error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorStack = error instanceof Error ? error.stack : ""

    console.error("[v0] Error details:", {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
    })

    return Response.json(
      {
        error:
          "I'm having trouble processing your request right now. Please check that your API key is valid and try again.",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
