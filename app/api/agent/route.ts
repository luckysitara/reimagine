import { GoogleGenerativeAI } from "@google/generative-ai"
import { prepareSwap } from "@/lib/tools/execute-swap"
import { prepareMultiSwap } from "@/lib/tools/execute-multi-swap"
import { analyzePortfolio } from "@/lib/tools/analyze-portfolio"
import { getTokenPrice } from "@/lib/tools/get-token-price"
import { analyzeTokenNews } from "@/lib/tools/analyze-token-news"
import { getOpenOrders, cancelLimitOrder } from "@/lib/services/jupiter-trigger"
import { getDCAAccounts, closeDCAOrder } from "@/lib/services/jupiter-recurring"
import { notifyTradingRecommendation } from "@/lib/services/notifications"

const systemPrompt = `You are an AI assistant for Reimagine, a DeFi trading platform on Solana. Provide clear, concise responses.

Capabilities:
- Execute single/multi token swaps via Jupiter DEX
- Create and manage limit orders and DCA (dollar-cost averaging)
- Create new SPL tokens with custom metadata
- View and cancel active orders
- Portfolio analysis with diversification scoring
- Real-time token pricing and news analysis with sentiment
- Autopilot mode for proactive monitoring

Key instructions:
1. Be concise - avoid repeating yourself
2. For swaps: extract input/output tokens and amounts
3. For orders: ask for token, amount, and target price/frequency
4. For news: fetch and summarize sentiment, key news, and risks
5. Always verify wallet connection before operations
6. Format large numbers with K/M suffix
7. Warn about price impact >1%

Security first - never ask for private keys.`

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
  const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "")
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const response = await model.generateContentStream({
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

  const stream = response.stream
  const toolResultsToAdd: Array<{ role: string; parts: Array<{ text: string }> }> = []

  const processStream = async () => {
    const encoder = new TextEncoder()
    let buffer = ""

    let fullText = ""
    let contentIndex = 0
    let hasMore = true
    const toolCalls: any[] = []

    while (hasMore) {
      const value = await stream.next()
      hasMore = !value.done

      if (value.value) {
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
                    return {
                      type: "text_chunk",
                      content: buffer.trim() + " ",
                    }
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

            return {
              type: "tool_call",
              toolName: toolCall.toolName,
              args: toolCall.args,
            }

            console.log(`[v0] Executing tool: ${toolCall.toolName}`)
            const toolResult = await executeFunctionCall(toolCall, walletAddress)

            return {
              type: "tool_result",
              toolName: toolCall.toolName,
              result: toolResult,
            }

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
      return {
        type: "text_chunk",
        content: buffer.trim(),
      }
    }

    return {
      type: "done",
    }
  }

  // Convert async generator to ReadableStream
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of processStream()) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        }
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
    const userMessage = body.message || ""
    const walletAddress = body.walletAddress || ""

    if (!userMessage.trim()) {
      return new Response(
        JSON.stringify({
          error: "Empty message",
        }),
        { status: 400 },
      )
    }

    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools,
    })

    const stream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    })

    const encoder = new TextEncoder()
    const lastMessageId = Date.now().toString()
    let toolCallBuffer = ""
    let textBuffer = ""
    let isFirstChunk = true

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream.stream) {
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
                        JSON.stringify({
                          type: "text",
                          content: toSend,
                          messageId: lastMessageId,
                        }) + "\n",
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
                        JSON.stringify({
                          type: "text",
                          content: textBuffer,
                          messageId: lastMessageId,
                        }) + "\n",
                      ),
                    )
                    textBuffer = ""
                  }

                  toolCallBuffer += JSON.stringify(part.functionCall)

                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "tool_call",
                        toolName: part.functionCall.name,
                        args: part.functionCall.args,
                        messageId: lastMessageId,
                      }) + "\n",
                    ),
                  )

                  // Execute the tool
                  const toolResult = await executeFunctionCall(part.functionCall, walletAddress)

                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "tool_result",
                        toolName: part.functionCall.name,
                        result: toolResult,
                        messageId: lastMessageId,
                      }) + "\n",
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
                    JSON.stringify({
                      type: "text",
                      content: textBuffer,
                      messageId: lastMessageId,
                    }) + "\n",
                  ),
                )
              }
            }
          }

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "end",
                messageId: lastMessageId,
              }) + "\n",
            ),
          )
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }) + "\n",
            ),
          )
        } finally {
          controller.close()
        }
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
