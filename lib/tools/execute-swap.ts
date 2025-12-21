import { getJupiterQuote, getJupiterSwapTransaction } from "../services/jupiter"
import { getJupiterTokenList } from "../services/jupiter"

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
}

export async function prepareSwap(params: SwapParams): Promise<SwapPreparation> {
  const { inputToken, outputToken, amount, walletAddress } = params

  if (!walletAddress) {
    throw new Error("Wallet address is required for swap preparation")
  }

  // Get token list
  const tokens = await getJupiterTokenList()

  // Find token mints by symbol
  const inputTokenData = tokens.find((t) => t.symbol.toUpperCase() === inputToken.toUpperCase())
  const outputTokenData = tokens.find((t) => t.symbol.toUpperCase() === outputToken.toUpperCase())

  if (!inputTokenData || !outputTokenData) {
    throw new Error(`Token not found: ${!inputTokenData ? inputToken : outputToken}`)
  }

  // Convert amount to lamports based on decimals
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, inputTokenData.decimals))

  // Get quote
  const quote = await getJupiterQuote(inputTokenData.address, outputTokenData.address, amountInSmallestUnit)

  // Get swap transaction
  const transaction = await getJupiterSwapTransaction(quote, walletAddress)

  // Calculate estimated output
  const estimatedOutput = Number.parseInt(quote.outAmount) / Math.pow(10, outputTokenData.decimals)

  return {
    quote: {
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
    },
    transaction,
    estimatedOutput,
    priceImpact: quote.priceImpactPct,
  }
}
