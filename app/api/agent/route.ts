import { GoogleGenerativeAI } from "@google/generative-ai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"
import { analyzeTokenNews } from "@/lib/tools/analyze-token-news"

const systemPrompt = `You are an AI assistant for Reimagine, a DeFi trading platform on Solana. You help users execute blockchain operations and analyze token-related news through natural language.

Capabilities:
- Execute token swaps using Jupiter DEX Ultra API
- Provide portfolio analysis and recommendations
- Fetch real-time token prices
- Analyze news and social media for tokens, including sentiment and trends
- Operate in autopilot mode to proactively monitor portfolios, prices, and news
- Explain DeFi concepts in simple terms
- Help users make informed trading decisions

When users ask about token news:
1. Extract the token symbol and optional time range
2. Use the analyze_token_news tool to fetch and analyze data
3. Summarize findings clearly, highlighting sentiment, key news, and risks

For swaps:
1. Verify wallet connection
2. Extract input/output tokens and amount
3. Use execute_swap, confirm details, and warn about price impact (>1%)

In autopilot mode:
- Monitor portfolio, prices, and news periodically
- Notify users of significant changes or opportunities
- Suggest actions but require confirmation for swaps

Prioritize security, clarity, and non-technical language. Use metric formatting (K, M).`

const tools = [
  {
    functionDeclarations: [
      {
        name: "execute_swap",
        description:
          "Prepare a token swap on Solana using Jupiter DEX. Returns transaction details including estimated output, price impact, and transaction data for user confirmation.",
        parameters: {
          type: "object",
          properties: {
            inputToken: {
              type: "string",
              description: "Symbol of the input token (e.g., SOL, USDC, BONK)",
            },
            outputToken: {
              type: "string",
              description: "Symbol of the output token (e.g., SOL, USDC, BONK)",
            },
            amount: {
              type: "number",
              description: "Amount of input token to swap (in whole units, not lamports)",
            },
          },
          required: ["inputToken", "outputToken", "amount"],
        },
      },
      {
        name: "analyze_portfolio",
        description:
          "Analyze a Solana wallet portfolio and provide comprehensive insights, recommendations, risk assessment, and diversification score.",
        parameters: {
          type: "object",
          properties: {
            walletAddress: {
              type: "string",
              description: "Solana wallet address to analyze (optional, uses connected wallet if not provided)",
            },
          },
        },
      },
      {
        name: "get_token_price",
        description: "Get the current price of a Solana token in USD using real-time Jupiter pricing data.",
        parameters: {
          type: "object",
          properties: {
            tokenSymbol: {
              type: "string",
              description: "Token symbol (e.g., SOL, USDC, BONK, JUP)",
            },
          },
          required: ["tokenSymbol"],
        },
      },
      {
        name: "analyze_token_news",
        description:
          "Analyze news and social media sentiment for a specific token. Returns sentiment analysis, key headlines, trends, and risk indicators.",
        parameters: {
          type: "object",
          properties: {
            tokenSymbol: {
              type: "string",
              description: "Token symbol to analyze (e.g., SOL, BONK, JUP)",
            },
            timeRange: {
              type: "string",
              enum: ["24h", "7d", "30d"],
              description: "Time range for analysis (default: 24h)",
            },
          },
          required: ["tokenSymbol"],
        },
      },
    ],
  },
]

async function executeFunctionCall(functionCall: any, walletAddress?: string) {
  const { name, args } = functionCall

  console.log(`[v0] Executing function: ${name}`, args)

  try {
    switch (name) {
      case "execute_swap": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected. Please connect your wallet to execute swaps.",
          }
        }

        const result = await prepareSwap({
          inputToken: args.inputToken,
          outputToken: args.outputToken,
          amount: args.amount,
          walletAddress,
        })

        return {
          success: true,
          message: `Swap prepared: ${args.amount} ${args.inputToken} → ${result.estimatedOutput.toFixed(6)} ${args.outputToken}`,
          inputToken: args.inputToken,
          outputToken: args.outputToken,
          inputAmount: args.amount,
          estimatedOutput: result.estimatedOutput,
          priceImpact: result.priceImpact,
          requestId: result.requestId,
        }
      }

      case "analyze_portfolio": {
        const addressToAnalyze = args.walletAddress || walletAddress

        if (!addressToAnalyze) {
          return {
            success: false,
            error: "No wallet address provided.",
          }
        }

        const analysis = await analyzePortfolio(addressToAnalyze)

        return {
          success: true,
          totalValue: analysis.totalValueUSD,
          solBalance: analysis.solBalance,
          tokenCount: analysis.tokens.length,
          diversificationScore: analysis.diversification.score,
          diversificationMessage: analysis.diversification.message,
          riskLevel: analysis.riskLevel,
          recommendations: analysis.recommendations,
          topTokens: analysis.tokens.slice(0, 5),
        }
      }

      case "get_token_price": {
        const price = await getTokenPrice(args.tokenSymbol)

        return {
          success: true,
          token: price.symbol,
          priceUSD: price.priceUSD,
          source: price.source,
          formatted: `$${price.priceUSD.toFixed(price.priceUSD < 1 ? 6 : 2)}`,
        }
      }

      case "analyze_token_news": {
        const news = await analyzeTokenNews(args.tokenSymbol, args.timeRange || "24h")

        return {
          success: true,
          token: args.tokenSymbol,
          timeRange: args.timeRange || "24h",
          sentiment: news.sentiment,
          sentimentScore: news.sentimentScore,
          headlines: news.headlines,
          socialMetrics: news.socialMetrics,
          trends: news.trends,
          riskIndicators: news.riskIndicators,
          summary: news.summary,
        }
      }

      default:
        return {
          success: false,
          error: `Unknown function: ${name}`,
        }
    }
  } catch (error) {
    console.error(`[v0] Function execution error for ${name}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Function execution failed",
    }
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sendMessage = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }
  ;(async () => {
    try {
      const { messages, walletAddress } = await request.json()

      console.log("[v0] Received request with", messages?.length, "messages")

      if (!messages || !Array.isArray(messages)) {
        await sendMessage({ error: "Messages array is required" })
        await writer.close()
        return
      }

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

      if (!apiKey || apiKey.trim() === "" || apiKey === "your-api-key-here") {
        await sendMessage({
          error: "AI service not configured. Please set a valid GOOGLE_GENERATIVE_AI_API_KEY in environment variables.",
        })
        await writer.close()
        return
      }

      console.log("[v0] Initializing Gemini AI...")

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools,
        systemInstruction: systemPrompt,
      })

      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))

      // Filter out any consecutive messages with the same role
      const filteredHistory: any[] = []
      for (const msg of history) {
        if (filteredHistory.length === 0 || filteredHistory[filteredHistory.length - 1].role !== msg.role) {
          filteredHistory.push(msg)
        }
      }

      // Ensure first message is from user
      if (filteredHistory.length > 0 && filteredHistory[0].role !== "user") {
        filteredHistory.shift()
      }

      const chat = model.startChat({
        history: filteredHistory,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })

      const lastMessage = messages[messages.length - 1]

      let result = await chat.sendMessage(lastMessage.content)
      let response = result.response
      let loopCount = 0
      const maxLoops = 5

      while (response.candidates?.[0]?.content?.parts?.[0]?.functionCall && loopCount < maxLoops) {
        loopCount++
        const functionCall = response.candidates[0].content.parts[0].functionCall

        console.log(`[v0] Function call detected (iteration ${loopCount}):`, functionCall.name)

        // Send tool call notification to client
        await sendMessage({
          type: "tool_call",
          toolName: functionCall.name,
          args: functionCall.args,
        })

        // Execute the function
        const functionResult = await executeFunctionCall(functionCall, walletAddress)

        console.log(`[v0] Function result:`, functionResult)

        // Send tool result to client
        await sendMessage({
          type: "tool_result",
          toolName: functionCall.name,
          result: functionResult,
        })

        // Send function response back to model
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: functionCall.name,
              response: functionResult,
            },
          },
        ])

        response = result.response
      }

      const text = response.text()

      // Send chunks for streaming effect
      const words = text.split(" ")
      for (const word of words) {
        await sendMessage({
          type: "text_chunk",
          content: word + " ",
        })
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      await sendMessage({ type: "done" })
      await writer.close()
    } catch (error: any) {
      console.error("Agent error:", error)

      let errorMessage = "Failed to process request"

      if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("API key not valid")) {
        errorMessage = "Invalid Google AI API key. Please check your configuration."
      } else if (error?.message) {
        errorMessage = error.message
      }

      await sendMessage({ error: errorMessage })
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
