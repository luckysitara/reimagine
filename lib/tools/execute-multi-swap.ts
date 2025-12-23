import { getJupiterQuote, getJupiterTokenList } from "../services/jupiter"

export interface MultiSwapParams {
  tokens: Array<{
    symbol: string
    amount: number
  }>
  outputToken: string
  walletAddress: string
}

export interface SwapStep {
  inputToken: string
  inputAmount: number
  outputToken: string
  estimatedOutput: number
  priceImpact: string
  transaction: string
  requestId: string
}

export interface MultiSwapPreparation {
  swaps: SwapStep[]
  totalEstimatedOutput: number
  outputToken: string
  totalSwaps: number
}

export async function prepareMultiSwap(params: MultiSwapParams): Promise<MultiSwapPreparation> {
  const { tokens, outputToken, walletAddress } = params

  if (!walletAddress) {
    throw new Error("Wallet address is required for multi-swap preparation")
  }

  if (tokens.length === 0) {
    throw new Error("No tokens provided for swap")
  }

  const tokenList = await getJupiterTokenList()
  const outputTokenData = tokenList.find((t) => t.symbol.toUpperCase() === outputToken.toUpperCase())

  if (!outputTokenData) {
    throw new Error(`Output token not found: ${outputToken}`)
  }

  const swaps: SwapStep[] = []
  let totalEstimatedOutput = 0

  console.log(`[v0] Preparing multi-swap for ${tokens.length} tokens to ${outputToken}`)

  for (const token of tokens) {
    try {
      if (token.amount <= 0) {
        console.log(`[v0] Skipping ${token.symbol} - amount is zero or negative`)
        continue
      }

      if (token.symbol.toUpperCase() === outputToken.toUpperCase()) {
        console.log(`[v0] Skipping ${token.symbol} - same as output token`)
        totalEstimatedOutput += token.amount
        continue
      }

      const inputTokenData = tokenList.find((t) => t.symbol.toUpperCase() === token.symbol.toUpperCase())

      if (!inputTokenData) {
        console.error(`[v0] Token not found in Jupiter list: ${token.symbol}`)
        continue
      }

      const amountInSmallestUnit = Math.floor(token.amount * Math.pow(10, inputTokenData.decimals))

      console.log(`[v0] Getting quote for ${token.symbol} → ${outputToken}`)

      const order = await getJupiterQuote(
        inputTokenData.address,
        outputTokenData.address,
        amountInSmallestUnit,
        100,
        walletAddress,
      )

      if (!order.transaction) {
        console.error(`[v0] No transaction returned for ${token.symbol} → ${outputToken}`)
        continue
      }

      const estimatedOutput = Number.parseInt(order.outAmount) / Math.pow(10, outputTokenData.decimals)

      swaps.push({
        inputToken: token.symbol,
        inputAmount: token.amount,
        outputToken: outputToken,
        estimatedOutput,
        priceImpact: order.priceImpactPct,
        transaction: order.transaction,
        requestId: order.requestId,
      })

      totalEstimatedOutput += estimatedOutput
    } catch (error) {
      console.error(`[v0] Failed to prepare swap for ${token.symbol}:`, error)
    }
  }

  if (swaps.length === 0) {
    throw new Error("No valid swaps could be prepared. Check token balances and liquidity.")
  }

  console.log(`[v0] Successfully prepared ${swaps.length} swaps with total output: ${totalEstimatedOutput}`)

  return {
    swaps,
    totalEstimatedOutput,
    outputToken,
    totalSwaps: swaps.length,
  }
}
