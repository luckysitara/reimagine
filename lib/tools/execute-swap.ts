import { getJupiterQuote } from "../services/jupiter"
import { findTokenBySymbol } from "../services/jupiter"

export interface SwapParams {
  inputToken: string
  outputToken: string
  amount: number
  walletAddress?: string
}

export interface SwapPreparation {
  quote: {
    inputMint: string
    outputMint: string
    inAmount: string
    outAmount: string
    priceImpactPct: string
  }
  transaction: string
  estimatedOutput: number
  priceImpact: string
  requestId: string
}

export async function prepareSwap(params: SwapParams): Promise<SwapPreparation> {
  const { inputToken, outputToken, amount, walletAddress } = params

  if (!walletAddress) {
    throw new Error("Wallet address is required for swap preparation")
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  const inputTokenData = await findTokenBySymbol(inputToken)
  const outputTokenData = await findTokenBySymbol(outputToken)

  if (!inputTokenData) {
    throw new Error(`Token not found: ${inputToken}. Please check the symbol (e.g., SOL, USDC, BONK) and try again.`)
  }

  if (!outputTokenData) {
    throw new Error(`Token not found: ${outputToken}. Please check the symbol (e.g., SOL, USDC, BONK) and try again.`)
  }

  if (inputTokenData.address === outputTokenData.address) {
    throw new Error("Cannot swap a token for itself")
  }

  // Convert amount to lamports based on decimals
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, inputTokenData.decimals))

  if (amountInSmallestUnit <= 0) {
    throw new Error("Amount is too small for this token's decimal precision")
  }

  console.log("[v0] Preparing swap:", {
    input: `${amount} ${inputToken} (${inputTokenData.address})`,
    output: outputToken,
    amountInSmallestUnit,
    wallet: walletAddress,
  })

  const order = await getJupiterQuote(
    inputTokenData.address,
    outputTokenData.address,
    amountInSmallestUnit,
    100, // 1% slippage
    walletAddress,
  )

  // Calculate estimated output
  const estimatedOutput = Number.parseInt(order.outAmount) / Math.pow(10, outputTokenData.decimals)

  if (!order.transaction) {
    throw new Error("Jupiter API did not return a valid transaction. The swap may not be possible at this time.")
  }

  return {
    quote: {
      inputMint: order.inputMint,
      outputMint: order.outputMint,
      inAmount: order.inAmount,
      outAmount: order.outAmount,
      priceImpactPct: order.priceImpactPct,
    },
    transaction: order.transaction,
    estimatedOutput,
    priceImpact: order.priceImpactPct,
    requestId: order.requestId,
  }
}
