import { GoogleGenerativeAI } from "@google/generative-ai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { prepareMultiSwap } from "@/lib/tools/execute-multi-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"
import { analyzeTokenNews } from "@/lib/tools/analyze-token-news"
import { getJupiterTokenList } from "@/lib/services/jupiter"
import { createLimitOrder, getOpenOrders, cancelLimitOrder } from "@/lib/services/jupiter-trigger"
import { createDCAOrder, getDCAAccounts, closeDCAOrder } from "@/lib/services/jupiter-recurring"

const systemPrompt = `You are an AI assistant for Reimagine, a DeFi trading platform on Solana. You help users execute blockchain operations and analyze token-related news through natural language.

Capabilities:
- Execute single token swaps using Jupiter DEX Ultra API
- Execute multi-token swaps to consolidate multiple tokens into one (reduce clutter, minimize fees)
- Create and manage limit orders (buy/sell at target prices)
- Create and manage DCA orders (dollar-cost averaging for automated recurring purchases)
- Create new SPL tokens with custom metadata
- View and cancel active limit/DCA orders
- Provide portfolio analysis and recommendations
- Fetch real-time token prices
- Analyze news and social media for tokens, including sentiment and trends
- Operate in autopilot mode to proactively monitor portfolios, prices, and news
- Explain DeFi concepts in simple terms
- Help users make informed trading decisions

When users want to consolidate/clear multiple tokens:
1. Use get_wallet_tokens or analyze_portfolio to see all tokens
2. Ask which tokens they want to swap and what output token they prefer (SOL/USDC recommended)
3. Use execute_multi_swap with an array of token symbols and amounts
4. Each swap will be prepared individually and executed sequentially

When users ask about creating orders:
1. Verify wallet connection
2. Extract tokens, amounts, and order parameters
3. Use the appropriate tool (create_limit_order or create_dca_order)
4. Return transaction details for user to sign

When users want to see their orders:
- Use get_active_orders to fetch limit and DCA orders
- Display them in an organized, readable format

When users ask about token news:
1. Extract the token symbol and optional time range
2. Use the analyze_token_news tool to fetch and analyze data
3. Summarize findings clearly, highlighting sentiment, key news, and risks

For swaps:
1. Verify wallet connection
2. Extract input/output tokens and amount
3. Use execute_swap, confirm details, and warn about price impact (>1%)

For token creation:
1. Extract name, symbol, decimals, supply, and optional metadata
2. Verify sufficient SOL balance (minimum 0.1 SOL required)
3. Use create_token to prepare the transaction

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
        name: "execute_multi_swap",
        description:
          "Consolidate multiple tokens into a single output token in one operation. Perfect for clearing dust tokens, portfolio cleanup, or reducing transaction fees. Each token will be swapped sequentially to the target output token.",
        parameters: {
          type: "object",
          properties: {
            tokens: {
              type: "array",
              description: "Array of tokens to swap with their amounts",
              items: {
                type: "object",
                properties: {
                  symbol: {
                    type: "string",
                    description: "Token symbol (e.g., BONK, JUP, RAY)",
                  },
                  amount: {
                    type: "number",
                    description: "Amount of this token to swap",
                  },
                },
                required: ["symbol", "amount"],
              },
            },
            outputToken: {
              type: "string",
              description: "Target token to receive (e.g., SOL, USDC). Recommended: SOL or USDC for best liquidity.",
            },
          },
          required: ["tokens", "outputToken"],
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
      {
        name: "create_limit_order",
        description:
          "Create a limit order to automatically execute a trade when the market reaches your target price. The order will remain active until filled, cancelled, or expired.",
        parameters: {
          type: "object",
          properties: {
            inputToken: {
              type: "string",
              description: "Token symbol to sell/spend (e.g., SOL, USDC)",
            },
            outputToken: {
              type: "string",
              description: "Token symbol to buy/receive (e.g., BONK, JUP)",
            },
            inputAmount: {
              type: "number",
              description: "Amount of input token to sell",
            },
            targetPrice: {
              type: "number",
              description: "Target price in output token units per input token (e.g., 130 USDC per SOL)",
            },
            expirationDays: {
              type: "number",
              description: "Days until order expires (default: 30 days)",
            },
          },
          required: ["inputToken", "outputToken", "inputAmount", "targetPrice"],
        },
      },
      {
        name: "create_dca_order",
        description:
          "Create a Dollar-Cost Averaging (DCA) order for automated recurring token purchases. Helps reduce timing risk by spreading purchases over time.",
        parameters: {
          type: "object",
          properties: {
            inputToken: {
              type: "string",
              description: "Token to spend per cycle (e.g., SOL, USDC)",
            },
            outputToken: {
              type: "string",
              description: "Token to buy each cycle (e.g., BONK, JUP)",
            },
            totalAmount: {
              type: "number",
              description: "Total amount to invest (will be divided into cycles)",
            },
            amountPerCycle: {
              type: "number",
              description: "Amount to spend per cycle",
            },
            frequencyHours: {
              type: "number",
              description: "Hours between each purchase (e.g., 24 for daily, 168 for weekly)",
            },
          },
          required: ["inputToken", "outputToken", "totalAmount", "amountPerCycle", "frequencyHours"],
        },
      },
      {
        name: "create_token",
        description:
          "Create a new SPL token on Solana with custom name, symbol, supply, and metadata. Requires at least 0.1 SOL for transaction fees.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Full token name (e.g., My Awesome Token)",
            },
            symbol: {
              type: "string",
              description: "Token ticker symbol, 3-6 characters (e.g., MAT, MYTKN)",
            },
            decimals: {
              type: "number",
              description: "Decimal places for token (typically 6-9, default: 9)",
            },
            supply: {
              type: "number",
              description: "Initial token supply (in whole units)",
            },
            description: {
              type: "string",
              description: "Token description (optional)",
            },
            imageUrl: {
              type: "string",
              description: "URL to token logo image (optional)",
            },
          },
          required: ["name", "symbol", "supply"],
        },
      },
      {
        name: "get_active_orders",
        description: "Fetch all active limit orders and DCA orders for the connected wallet.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "cancel_limit_order",
        description: "Cancel an active limit order by its order ID.",
        parameters: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              description: "The public key/ID of the limit order to cancel",
            },
          },
          required: ["orderId"],
        },
      },
      {
        name: "cancel_dca_order",
        description: "Cancel an active DCA order by its order ID.",
        parameters: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              description: "The public key/ID of the DCA order to cancel",
            },
          },
          required: ["orderId"],
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
          transaction: result.transaction,
        }
      }

      case "execute_multi_swap": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected. Please connect your wallet to execute multi-swaps.",
          }
        }

        const result = await prepareMultiSwap({
          tokens: args.tokens,
          outputToken: args.outputToken,
          walletAddress,
        })

        return {
          success: true,
          type: "multi_swap",
          message: `Multi-swap prepared: ${result.totalSwaps} tokens → ${result.totalEstimatedOutput.toFixed(6)} ${result.outputToken}`,
          swaps: result.swaps,
          totalEstimatedOutput: result.totalEstimatedOutput,
          outputToken: result.outputToken,
          totalSwaps: result.totalSwaps,
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

      case "create_limit_order": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected. Please connect your wallet to create limit orders.",
          }
        }

        try {
          const tokens = await getJupiterTokenList()
          const inputTokenData = tokens.find((t) => t.symbol.toUpperCase() === args.inputToken.toUpperCase())
          const outputTokenData = tokens.find((t) => t.symbol.toUpperCase() === args.outputToken.toUpperCase())

          if (!inputTokenData || !outputTokenData) {
            return {
              success: false,
              error: `Token not found: ${!inputTokenData ? args.inputToken : args.outputToken}. Please check the token symbol and try again.`,
            }
          }

          const makingAmount = Math.floor(args.inputAmount * Math.pow(10, inputTokenData.decimals)).toString()
          const takingAmount = Math.floor(
            args.inputAmount * args.targetPrice * Math.pow(10, outputTokenData.decimals),
          ).toString()

          const expirationDays = args.expirationDays || 30
          const expiredAt = Math.floor(Date.now() / 1000) + expirationDays * 24 * 60 * 60

          const result = await createLimitOrder({
            inputMint: inputTokenData.address,
            outputMint: outputTokenData.address,
            maker: walletAddress,
            payer: walletAddress,
            makingAmount,
            takingAmount,
            expiredAt,
          })

          return {
            success: true,
            type: "limit_order",
            message: `Limit order created: Sell ${args.inputAmount} ${args.inputToken} for ${args.targetPrice} ${args.outputToken} per unit`,
            inputToken: args.inputToken,
            outputToken: args.outputToken,
            inputAmount: args.inputAmount,
            targetPrice: args.targetPrice,
            expiresIn: `${expirationDays} days`,
            transaction: result.tx,
          }
        } catch (error: any) {
          console.error("[v0] Limit order creation error:", error)
          return {
            success: false,
            error: `Failed to create limit order: ${error?.message || "Unknown error"}`,
          }
        }
      }

      case "create_dca_order": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected. Please connect your wallet to create DCA orders.",
          }
        }

        try {
          const tokens = await getJupiterTokenList()
          const inputTokenData = tokens.find((t) => t.symbol.toUpperCase() === args.inputToken.toUpperCase())
          const outputTokenData = tokens.find((t) => t.symbol.toUpperCase() === args.outputToken.toUpperCase())

          if (!inputTokenData || !outputTokenData) {
            return {
              success: false,
              error: `Token not found: ${!inputTokenData ? args.inputToken : args.outputToken}. Please check the token symbol and try again.`,
            }
          }

          const amountInSmallestUnit = Math.floor(args.totalAmount * Math.pow(10, inputTokenData.decimals)).toString()
          const cycleFrequency = args.frequencyHours * 3600
          const numberOfOrders = Math.floor(args.totalAmount / args.amountPerCycle)

          const result = await createDCAOrder({
            inputMint: inputTokenData.address,
            outputMint: outputTokenData.address,
            payer: walletAddress,
            amount: amountInSmallestUnit,
            cycleFrequency,
            numberOfOrders,
          })

          return {
            success: true,
            type: "dca_order",
            message: `DCA order created: ${args.amountPerCycle} ${args.inputToken} → ${args.outputToken} every ${args.frequencyHours}h for ${numberOfOrders} cycles`,
            inputToken: args.inputToken,
            outputToken: args.outputToken,
            totalAmount: args.totalAmount,
            amountPerCycle: args.amountPerCycle,
            frequency: `${args.frequencyHours} hours`,
            cycles: numberOfOrders,
            transaction: result.tx,
          }
        } catch (error: any) {
          console.error("[v0] DCA order creation error:", error)
          return {
            success: false,
            error: `Failed to create DCA order: ${error?.message || "Unknown error"}`,
          }
        }
      }

      case "create_token": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected. Please connect your wallet to create tokens.",
          }
        }

        const decimals = args.decimals || 9

        try {
          if (!args.name || !args.symbol || args.supply === undefined) {
            return {
              success: false,
              error: "Missing required fields: name, symbol, and supply are required to create a token.",
            }
          }

          if (args.symbol.length < 1 || args.symbol.length > 10) {
            return {
              success: false,
              error: "Token symbol must be between 1 and 10 characters.",
            }
          }

          const response = await fetch("/api/token/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: args.name,
              symbol: args.symbol,
              decimals,
              supply: args.supply,
              description: args.description || "",
              imageUrl: args.imageUrl || "",
              walletAddress,
            }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({
              error: `HTTP ${response.status}: ${response.statusText}`,
            }))
            console.error("[v0] Token creation API error:", error)
            return {
              success: false,
              error: error.error || error.details || "Failed to create token. Please check your inputs and try again.",
            }
          }

          const data = await response.json()

          return {
            success: true,
            type: "token_creation",
            message: `Token ${args.symbol} created successfully! Ready to sign transaction.`,
            tokenName: args.name,
            tokenSymbol: args.symbol,
            initialSupply: args.supply,
            mintAddress: data.mintAddress,
            transaction: data.transaction,
          }
        } catch (error: any) {
          console.error("[v0] Token creation error:", error)
          return {
            success: false,
            error: `Failed to create token: ${error?.message || "Unknown error"}. Please ensure you have at least 0.1 SOL for fees.`,
          }
        }
      }

      case "get_active_orders": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected.",
          }
        }

        const [limitOrders, dcaOrders] = await Promise.all([
          getOpenOrders(walletAddress),
          getDCAAccounts(walletAddress),
        ])

        return {
          success: true,
          limitOrders: limitOrders.map((order: any) => ({
            id: order.publicKey,
            inputMint: order.account.inputMint,
            outputMint: order.account.outputMint,
            makingAmount: order.account.makingAmount,
            takingAmount: order.account.takingAmount,
            expiredAt: order.account.expiredAt,
            state: order.account.state,
          })),
          dcaOrders: dcaOrders.map((order: any) => ({
            id: order.publicKey,
            inputMint: order.account.inputMint,
            outputMint: order.account.outputMint,
            inDeposited: order.account.inDeposited,
            inUsed: order.account.inUsed,
            inAmountPerCycle: order.account.inAmountPerCycle,
            cycleFrequency: order.account.cycleFrequency,
            nextCycleAt: order.account.nextCycleAt,
          })),
          totalOrders: limitOrders.length + dcaOrders.length,
        }
      }

      case "cancel_limit_order": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected.",
          }
        }

        const result = await cancelLimitOrder(args.orderId, walletAddress)

        return {
          success: true,
          type: "cancel_limit_order",
          message: `Limit order cancelled successfully`,
          orderId: args.orderId,
          transaction: result.tx,
        }
      }

      case "cancel_dca_order": {
        if (!walletAddress) {
          return {
            success: false,
            error: "Wallet not connected.",
          }
        }

        const result = await closeDCAOrder(args.orderId, walletAddress)

        return {
          success: true,
          type: "cancel_dca_order",
          message: `DCA order cancelled successfully`,
          orderId: args.orderId,
          transaction: result.tx,
        }
      }

      default:
        return {
          success: false,
          error: `Unknown function: ${name}`,
        }
    }
  } catch (error: any) {
    console.error(`[v0] Function execution error:`, error)

    const errorMessage = error?.message || error?.error || "Unknown error"

    // Map common errors to user-friendly messages
    if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
      return {
        success: false,
        error: "Insufficient balance. Please ensure you have enough SOL or tokens for this operation.",
      }
    }

    if (errorMessage.includes("not found") || errorMessage.includes("invalid")) {
      return {
        success: false,
        error: `Invalid or missing data: ${errorMessage}. Please check your inputs and try again.`,
      }
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
      return {
        success: false,
        error: "Network error or request timeout. Please check your connection and try again.",
      }
    }

    return {
      success: false,
      error: `Operation failed: ${errorMessage}`,
    }
  }
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry on non-retriable errors
      if (
        error?.message?.includes("API_KEY_INVALID") ||
        error?.message?.includes("API key not valid") ||
        error?.code === "PERMISSION_DENIED"
      ) {
        throw error
      }

      // Only retry on rate limit or temporary errors
      const isRateLimitError =
        error?.status === 429 ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("resource exhausted") ||
        error?.message?.toLowerCase().includes("too many requests")

      if (!isRateLimitError && attempt === maxRetries - 1) {
        throw error
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt)
      console.log(`[v0] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Max retries exceeded")
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
          error:
            "AI service not configured. Please set a valid GOOGLE_GENERATIVE_AI_API_KEY in environment variables. Get your free API key at https://ai.google.dev/",
        })
        await writer.close()
        return
      }

      console.log("[v0] Initializing Gemini AI...")

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
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

      const lastMessage = messages[messages.length - 1] // Declare lastMessage variable

      let result = await retryWithBackoff(() => chat.sendMessage(lastMessage.content))
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

        result = await retryWithBackoff(() =>
          chat.sendMessage([
            {
              functionResponse: {
                name: functionCall.name,
                response: functionResult,
              },
            },
          ]),
        )

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
      console.error("[v0] Agent error:", error)
      console.error("[v0] Error details:", {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        stack: error?.stack?.split("\n").slice(0, 3).join("\n"),
      })

      let errorMessage = "Failed to process request"

      // Handle API key errors
      if (
        error?.message?.includes("API_KEY_INVALID") ||
        error?.message?.includes("API key not valid") ||
        error?.code === "PERMISSION_DENIED"
      ) {
        errorMessage =
          "Invalid Google AI API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY configuration. Get a free key at https://ai.google.dev/"
      }
      // Handle quota exceeded errors (429 Too Many Requests)
      else if (
        error?.status === 429 ||
        error?.code === "RESOURCE_EXHAUSTED" ||
        (error?.message?.toLowerCase().includes("quota") && error?.message?.toLowerCase().includes("exceed")) ||
        error?.message?.toLowerCase().includes("too many requests")
      ) {
        errorMessage =
          "Google AI API quota exceeded or rate limit hit. Please wait a few minutes and try again. If this persists, consider upgrading your API plan at https://ai.google.dev/pricing"
      }
      // Handle rate limit errors (distinct from quota)
      else if (error?.message?.toLowerCase().includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before sending another message."
      }
      // Handle model unavailable errors
      else if (error?.message?.toLowerCase().includes("model") && error?.message?.toLowerCase().includes("not found")) {
        errorMessage =
          "The AI model is temporarily unavailable. Please try again in a moment or check your API key permissions."
      }
      // Handle safety/content filtering
      else if (error?.message?.toLowerCase().includes("safety") || error?.code === "SAFETY") {
        errorMessage = "Your message was blocked by safety filters. Please rephrase your request."
      }
      // Generic error with message
      else if (error?.message) {
        errorMessage = `AI request failed: ${error.message}`
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
