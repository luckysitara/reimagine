import { GoogleGenerativeAI } from "@google/generative-ai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { prepareMultiSwap } from "@/lib/tools/execute-multi-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"
import { analyzeTokenNews } from "@/lib/tools/analyze-token-news"
import { getOpenOrders, cancelLimitOrder } from "@/lib/services/jupiter-trigger"
import { getDCAAccounts, closeDCAOrder } from "@/lib/services/jupiter-recurring"
import { notifyTradingRecommendation } from "@/lib/services/notifications"
import { ReadableStream } from "stream/web"
import { TextEncoder } from "util"

const systemPrompt = `You are an AI DeFi assistant for Reimagine on Solana. Be concise and helpful.

CAPABILITIES:
- Single/multi token swaps (Jupiter)
- Limit orders and DCA
- New SPL token creation
- Portfolio analysis with scoring
- Real-time token price and news sentiment
- Order management and autopilot

INSTRUCTIONS:
1. Use tools directly - don't ask for confirmation unless critical
2. For swaps: confirm input/output tokens and amount
3. For orders: ask price/frequency if not specified
4. For analysis: use token analysis tools automatically
5. Format numbers: 1K for thousands, 1M for millions
6. Always warn if price impact >1%
7. Analyze with technical + sentiment indicators when asked
8. NEVER ask for private keys

CONTEXT: User wallet is connected.`

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

async function executeFunctionCall(functionCall: any, walletAddress?: string, baseUrl?: string) {
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

        await notifyTradingRecommendation(
          `Swap Ready: ${args.inputToken} → ${args.outputToken}`,
          `${args.amount} ${args.inputToken} will give you approximately ${result.estimatedOutput.toFixed(6)} ${args.outputToken}. Price impact: ${result.priceImpact.toFixed(2)}%`,
          {
            type: "swap",
            inputToken: args.inputToken,
            outputToken: args.outputToken,
            amount: args.amount,
          },
        )

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
          const { findTokenBySymbol } = await import("@/lib/services/jupiter")
          const { createLimitOrder } = await import("@/lib/services/jupiter-trigger")

          const inputToken = await findTokenBySymbol(args.inputToken)
          const outputToken = await findTokenBySymbol(args.outputToken)

          if (!inputToken) {
            return {
              success: false,
              error: `Token not found: ${args.inputToken}. Please check the symbol (e.g., SOL, USDC, BONK) and try again.`,
            }
          }

          if (!outputToken) {
            return {
              success: false,
              error: `Token not found: ${args.outputToken}. Please check the symbol and try again.`,
            }
          }

          if (!args.inputAmount || args.inputAmount <= 0) {
            return {
              success: false,
              error: "Input amount must be greater than 0.",
            }
          }

          if (!args.targetPrice || args.targetPrice <= 0) {
            return {
              success: false,
              error: "Target price must be greater than 0.",
            }
          }

          const makingAmount = Math.floor(args.inputAmount * Math.pow(10, inputToken.decimals)).toString()
          const takingAmount = Math.floor(
            args.inputAmount * args.targetPrice * Math.pow(10, outputToken.decimals),
          ).toString()

          const expirationDays = args.expirationDays || 30
          const expiredAt = Math.floor(Date.now() / 1000) + expirationDays * 24 * 60 * 60

          console.log("[v0] Limit order params:", {
            inputMint: inputToken.address,
            outputMint: outputToken.address,
            maker: walletAddress,
            payer: walletAddress,
            makingAmount,
            takingAmount,
            expiredAt,
          })

          const result = await createLimitOrder({
            inputMint: inputToken.address,
            outputMint: outputToken.address,
            maker: walletAddress,
            payer: walletAddress,
            makingAmount,
            takingAmount,
            expiredAt,
          })

          await notifyTradingRecommendation(
            `Limit Order Created: ${args.inputToken} → ${args.outputToken}`,
            `Order to sell ${args.inputAmount} ${args.inputToken} at ${args.targetPrice} ${args.outputToken} has been created. Valid for ${args.expirationDays} days.`,
            {
              type: "limit_order",
              inputToken: args.inputToken,
              outputToken: args.outputToken,
              targetPrice: args.targetPrice,
            },
          )

          console.log("[v0] Limit order result:", result)

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
            error: `Failed to create limit order: ${error?.message || "Unknown error"}. Please check your wallet balance and try again.`,
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
          const { findTokenBySymbol } = await import("@/lib/services/jupiter")
          const { createDCAOrder } = await import("@/lib/services/jupiter-recurring")

          const inputToken = await findTokenBySymbol(args.inputToken)
          const outputToken = await findTokenBySymbol(args.outputToken)

          if (!inputToken) {
            return {
              success: false,
              error: `Token not found: ${args.inputToken}. Please check the symbol (e.g., SOL, USDC, BONK) and try again.`,
            }
          }

          if (!outputToken) {
            return {
              success: false,
              error: `Token not found: ${args.outputToken}. Please check the symbol and try again.`,
            }
          }

          if (!args.totalAmount || args.totalAmount <= 0) {
            return {
              success: false,
              error: "Total amount must be greater than 0.",
            }
          }

          if (!args.amountPerCycle || args.amountPerCycle <= 0) {
            return {
              success: false,
              error: "Amount per cycle must be greater than 0.",
            }
          }

          if (args.amountPerCycle > args.totalAmount) {
            return {
              success: false,
              error: "Amount per cycle cannot be greater than total amount.",
            }
          }

          if (!args.frequencyHours || args.frequencyHours <= 0) {
            return {
              success: false,
              error: "Frequency must be greater than 0 hours.",
            }
          }

          const amountInSmallestUnit = Math.floor(args.totalAmount * Math.pow(10, inputToken.decimals)).toString()
          const cycleFrequency = args.frequencyHours * 3600
          const numberOfOrders = Math.ceil(args.totalAmount / args.amountPerCycle)

          console.log("[v0] DCA order params:", {
            inputMint: inputToken.address,
            outputMint: outputToken.address,
            payer: walletAddress,
            amount: amountInSmallestUnit,
            cycleFrequency,
            numberOfOrders,
          })

          const result = await createDCAOrder({
            inputMint: inputToken.address,
            outputMint: outputToken.address,
            payer: walletAddress,
            amount: amountInSmallestUnit,
            cycleFrequency,
            numberOfOrders,
          })

          console.log("[v0] DCA order result:", result)

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
            error: `Failed to create DCA order: ${error?.message || "Unknown error"}. Please check your wallet balance and try again.`,
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

          if (args.name.length < 1 || args.name.length > 100) {
            return {
              success: false,
              error: "Token name must be between 1 and 100 characters.",
            }
          }

          if (args.supply <= 0) {
            return {
              success: false,
              error: "Token supply must be greater than 0.",
            }
          }

          if (decimals < 0 || decimals > 18) {
            return {
              success: false,
              error: "Decimals must be between 0 and 18.",
            }
          }

          console.log("[v0] Creating token with params:", {
            name: args.name,
            symbol: args.symbol,
            decimals,
            supply: args.supply,
            walletAddress,
          })

          const apiUrl = baseUrl ? `${baseUrl}/api/token/create` : "http://localhost:3000/api/token/create"
          const response = await fetch(apiUrl, {
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

          console.log("[v0] Token creation response:", {
            mintAddress: data.mintAddress,
            hasTransaction: !!data.transaction,
          })

          return {
            success: true,
            type: "token_creation",
            message: `Token ${args.symbol} created successfully! Ready to sign transaction.`,
            tokenName: args.name,
            tokenSymbol: args.symbol,
            initialSupply: args.supply,
            decimals,
            mintAddress: data.mintAddress,
            transaction: data.transaction,
          }
        } catch (error: any) {
          console.error("[v0] Token creation error:", error)
          return {
            success: false,
            error: `Failed to create token: ${error?.message || "Unknown error"}. You need at least 0.1 SOL in your wallet.`,
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

      if (
        error?.message?.includes("API_KEY_INVALID") ||
        error?.message?.includes("API key not valid") ||
        error?.code === "PERMISSION_DENIED"
      ) {
        throw error
      }

      const isRateLimitError =
        error?.status === 429 ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("resource exhausted") ||
        error?.message?.toLowerCase().includes("too many requests")

      if (!isRateLimitError && attempt === maxRetries - 1) {
        throw error
      }

      const delay = initialDelay * Math.pow(2, attempt)
      console.log(`[v0] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

async function executeAgentWithStream(
  messages: any[],
  walletAddress: string | undefined,
): Promise<ReadableStream<Uint8Array> | null> {
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
  const grokApiKey = process.env.XAI_API_KEY || ""

  if (!googleApiKey && !grokApiKey) {
    console.error("[v0] No AI providers configured. Set GOOGLE_API_KEY or XAI_API_KEY.")
    throw new Error("AI service not configured")
  }

  // Use Google by default, fallback to Grok
  const client = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null
  const model = client?.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const response = await model?.generateContentStream({
    systemInstruction: systemPrompt,
    tools,
    contents: messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: msg.content,
        },
      ],
    })),
  })

  const stream = response?.stream
  const toolResultsToAdd: Array<{ role: string; parts: Array<{ text: string }> }> = []

  const processStream = async function* () {
    let buffer = ""
    const encoder = new TextEncoder()

    let fullText = ""
    let contentIndex = 0
    let hasMore = true
    const toolCalls: any[] = []

    while (hasMore) {
      const value = await stream?.next()
      hasMore = !value?.done

      if (value?.value) {
        const response = value.value

        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            fullText += part.text

            // Stream text chunks
            if (part.text.length > 0) {
              const newText = part.text.slice(contentIndex)
              contentIndex = part.text.length

              // Split and send chunks to avoid overwhelming the client
              const lines = newText.split(/(?<=[.!?])\s+/)
              for (const line of lines) {
                if (line.trim()) {
                  buffer += line + " "

                  // Send chunks every sentence or when buffer gets large
                  if (buffer.length > 100 || line.endsWith(".")) {
                    const data = `data: ${JSON.stringify({
                      type: "text_chunk",
                      content: buffer.trim() + " ",
                    })}\n\n`
                    console.log(data)
                    buffer = ""
                  }
                }
              }
            }
          }

          if (part.functionCall) {
            const toolCall = {
              toolName: part.functionCall.name,
              args: part.functionCall.args,
            }

            const data = `data: ${JSON.stringify({
              type: "tool_call",
              toolName: toolCall.toolName,
              args: toolCall.args,
            })}\n\n`
            console.log(data)

            console.log(`[v0] Executing tool: ${toolCall.toolName}`)
            const toolResult = await executeFunctionCall(toolCall, walletAddress)

            const toolResultData = `data: ${JSON.stringify({
              type: "tool_result",
              toolName: toolCall.toolName,
              result: toolResult,
            })}\n\n`
            console.log(toolResultData)

            toolResultsToAdd.push({
              role: "user",
              parts: [
                {
                  text: `Tool ${toolCall.toolName} executed with result: ${JSON.stringify(toolResult)}`,
                },
              ],
            })

            toolCalls.push(toolCall)
          }
        }
      }
    }

    // Send any remaining buffer
    if (buffer.trim()) {
      const data = `data: ${JSON.stringify({
        type: "text_chunk",
        content: buffer.trim(),
      })}\n\n`
      console.log(data)
    }

    const data = `data: ${JSON.stringify({
      type: "done",
    })}\n\n`
    console.log(data)
  }

  // Convert async generator to ReadableStream
  return new ReadableStream({
    async start(controller) {
      try {
        await processStream()
        controller.close()
      } catch (error) {
        console.error("[v0] Stream error:", error)
        controller.error(error)
      }
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const messages = body.messages || []
    const walletAddress = body.walletAddress || ""

    // Get the last user message from the messages array
    const userMessage = messages
      .filter((msg: any) => msg.role === "user")
      .slice(-1)[0]?.content || ""

    if (!userMessage.trim()) {
      return new Response(
        JSON.stringify({
          error: "Empty message",
        }),
        { status: 400 },
      )
    }

    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
    const grokApiKey = process.env.XAI_API_KEY || ""

    // Debug log for API keys
    console.log("[v0] API Keys check:", {
      google: googleApiKey ? "Set (Hidden)" : "Missing",
      grok: grokApiKey ? "Set (Hidden)" : "Missing"
    })

    if (!googleApiKey && !grokApiKey) {
      console.error("[v0] No AI providers configured. Set GOOGLE_API_KEY (Google/default) or XAI_API_KEY (Grok/fallback).")
      return new Response(
        JSON.stringify({
          error: "AI service is not configured. Please set GOOGLE_API_KEY or XAI_API_KEY.",
        }),
        { status: 503 },
      )
    }

    const encoder = new TextEncoder()
    const url = new URL(request.url)
    const baseUrl = url.origin

    const lastMessageId = Date.now().toString()

    // Function to try Google API with automatic Grok fallback
    async function tryGoogleWithFallback() {
      if (!googleApiKey) {
        if (!grokApiKey) {
          throw new Error("No AI providers configured")
        }
        console.log("[v0] Google API not configured. Starting with Grok fallback.")
        return { provider: "grok", useGrok: true }
      }

      try {
        console.log("[v0] Attempting Google Gemini API (primary)")
        const client = new GoogleGenerativeAI(googleApiKey)
        const model = client.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          tools,
        })
        return { provider: "google", useGrok: false, client, model }
      } catch (googleError: any) {
        // Check if error is rate limit, auth, or quota
        const errorMessage = googleError?.message?.toLowerCase() || ""
        const isRateLimitOrQuota =
          errorMessage.includes("rate") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("resource exhausted") ||
          errorMessage.includes("429") ||
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("401") ||
          errorMessage.includes("403")

        if (isRateLimitOrQuota && grokApiKey) {
          console.warn(
            "[v0] Google API rate limited or quota exceeded:",
            googleError.message,
          )
          console.log("[v0] Falling back to Grok AI...")
          return { provider: "grok", useGrok: true }
        }

        // If Grok available, try fallback for other errors too
        if (grokApiKey && !isRateLimitOrQuota) {
          console.warn("[v0] Google API error:", googleError.message)
          console.log("[v0] Falling back to Grok AI...")
          return { provider: "grok", useGrok: true }
        }

        // No fallback available
        throw googleError
      }
    }

    // Create response stream
    const resultStream = new ReadableStream({
      async start(controller) {
        try {
          // Try Google with automatic fallback to Grok
          const providerConfig = await tryGoogleWithFallback()
          const { useGrok, client, model } = providerConfig

          if (useGrok) {
            // Use Grok AI (automatic fallback) with streaming via direct API
            try {
              console.log("[v0] Using Grok AI for streaming response")
              
              const response = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${grokApiKey}`,
                },
                body: JSON.stringify({
                  model: "grok-4-latest",
                  messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map((msg: any) => ({
                      role: msg.role,
                      content: msg.content,
                    })),
                  ],
                  temperature: 0.7,
                  top_p: 0.95,
                  max_tokens: 1024,
                  stream: true,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Grok API error: ${response.status} - ${JSON.stringify(errorData)}`)
              }

              console.log("[v0] Grok response streaming to client")
              const reader = response.body?.getReader()
              const decoder = new TextDecoder()

              if (reader) {
                let buffer = ""
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  buffer += decoder.decode(value, { stream: true })
                  const lines = buffer.split("\n")
                  buffer = lines.pop() || ""

                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      const data = line.slice(6)
                      if (data === "[DONE]") continue

                      try {
                        const parsed = JSON.parse(data)
                        const content = parsed.choices?.[0]?.delta?.content
                        if (content) {
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                type: "text_chunk",
                                content: content,
                              })}\n\n`,
                            ),
                          )
                        }
                      } catch (e) {
                        // Skip parsing errors for individual chunks
                      }
                    }
                  }
                }
              }

              // Signal completion
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "done",
                  })}\n\n`,
                ),
              )
              controller.close()
            } catch (grokError: any) {
              console.error("[v0] Grok API error:", grokError)
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    error: "Both Google and Grok AI failed. Please try again later.",
                  })}\n\n`,
                ),
              )
              controller.close()
              return
            }
          } else {
            // Use Google Gemini (primary)
            try {
              console.log("[v0] Using Google Gemini for streaming response")
              // Convert message history to Gemini format
              const contents = messages.map((msg: any) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              }))

              const response = await model?.generateContentStream({
                contents,
                systemInstruction: systemPrompt,
                generationConfig: {
                  temperature: 0.7,
                  topP: 0.95,
                  topK: 40,
                  maxOutputTokens: 1024,
                },
              })

              let toolCallBuffer = ""
              let textBuffer = ""
              let isFirstChunk = true

              for await (const event of response?.stream || []) {
                if (event.candidates && event.candidates[0]?.content?.parts) {
                  for (const part of event.candidates[0].content.parts) {
                    if (part.text) {
                      textBuffer += part.text

                      // Only send complete sentences or when buffer is large
                      const lastDotIndex = textBuffer.lastIndexOf(".")
                      const lastNewlineIndex = textBuffer.lastIndexOf("\n")
                      const lastSentenceIndex = Math.max(lastDotIndex, lastNewlineIndex)

                      if (lastSentenceIndex > 0) {
                        const toSend = textBuffer.substring(0, lastSentenceIndex + 1)
                        textBuffer = textBuffer.substring(lastSentenceIndex + 1)

                        controller.enqueue(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              type: "text_chunk",
                              content: toSend,
                            })}\n\n`,
                          ),
                        )
                        isFirstChunk = false
                      }
                    }

                    if (part.functionCall) {
                      // Send any remaining text first
                      if (textBuffer.trim()) {
                        controller.enqueue(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              type: "text_chunk",
                              content: textBuffer,
                            })}\n\n`,
                          ),
                        )
                      }

                      toolCallBuffer += JSON.stringify(part.functionCall)

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "tool_call",
                            toolName: part.functionCall.name,
                            args: part.functionCall.args,
                          })}\n\n`,
                        ),
                      )

                      // Execute the tool
                      const toolResult = await executeFunctionCall(part.functionCall, walletAddress, baseUrl)

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "tool_result",
                            toolName: part.functionCall.name,
                            result: toolResult,
                          })}\n\n`,
                        ),
                      )

                      toolCallBuffer = ""
                    }
                  }
                }

                if (event.candidates?.[0]?.finishReason === "STOP") {
                  if (textBuffer.trim()) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "text_chunk",
                          content: textBuffer,
                        })}\n\n`,
                      ),
                    )
                    textBuffer = ""
                  }
                  
                  // Signal completion
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "done",
                      })}\n\n`,
                    ),
                  )
                  controller.close()
                }
              }
            } catch (googleStreamError: any) {
              // Google stream failed, try Grok fallback if available
              console.warn("[v0] Google stream error:", googleStreamError.message)

              if (grokApiKey) {
                try {
                  console.log("[v0] Google stream failed. Falling back to Grok...")
                  
                  const response = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${grokApiKey}`,
                    },
                    body: JSON.stringify({
                      model: "grok-4-latest",
                      messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map((msg: any) => ({
                          role: msg.role,
                          content: msg.content,
                        })),
                      ],
                      temperature: 0.7,
                      top_p: 0.95,
                      max_tokens: 1024,
                      stream: true,
                    }),
                  })

                  if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(`Grok API error: ${response.status} - ${JSON.stringify(errorData)}`)
                  }

                  console.log("[v0] Grok fallback succeeded, streaming response")
                  const reader = response.body?.getReader()
                  const decoder = new TextDecoder()

                  if (reader) {
                    let buffer = ""
                    while (true) {
                      const { done, value } = await reader.read()
                      if (done) break

                      buffer += decoder.decode(value, { stream: true })
                      const lines = buffer.split("\n")
                      buffer = lines.pop() || ""

                      for (const line of lines) {
                        if (line.startsWith("data: ")) {
                          const data = line.slice(6)
                          if (data === "[DONE]") continue

                          try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content
                            if (content) {
                              controller.enqueue(
                                encoder.encode(
                                  `data: ${JSON.stringify({
                                    type: "text_chunk",
                                    content: content,
                                  })}\n\n`,
                                ),
                              )
                            }
                          } catch (e) {
                            // Skip parsing errors for individual chunks
                          }
                        }
                      }
                    }
                  }

                  // Signal completion
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "done",
                      })}\n\n`,
                    ),
                  )
                  controller.close()
                } catch (grokFallbackError: any) {
                  console.error("[v0] Grok fallback also failed:", grokFallbackError)
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "error",
                        error: "Both Google and Grok AI failed. Please try again later.",
                      })}\n\n`,
                    ),
                  )
                  controller.close()
                  return
                }
              } else {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      error: googleStreamError.message || "Google AI failed and no fallback available",
                    })}\n\n`,
                  ),
                )
                controller.close()
                return
              }
            }
          }
        } catch (error: any) {
          console.error("[v0] Agent error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error?.message || "Failed to get response",
              })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(resultStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Agent route error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    )
  }
}
