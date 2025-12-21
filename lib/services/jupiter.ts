import { type Connection, VersionedTransaction } from "@solana/web3.js"
import { Buffer } from "buffer"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"
const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6"

const JUPITER_API_KEY = process.env.JUPITER_API_KEY

// Helper to add API key header if available
function getJupiterHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  if (JUPITER_API_KEY) {
    headers["x-api-key"] = JUPITER_API_KEY
  }
  return headers
}

export interface JupiterToken {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  tags?: string[]
}

export interface JupiterQuote {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  priceImpactPct: string
  routePlan: Array<{
    swapInfo: {
      ammKey: string
      label?: string
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      feeAmount: string
      feeMint: string
    }
    percent: number
  }>
}

export interface SwapResult {
  success: boolean
  signature?: string
  error?: string
  outputAmount?: string
}

export async function getJupiterTokenList(): Promise<JupiterToken[]> {
  try {
    const response = await fetch("/api/jupiter/tokens")
    if (!response.ok) throw new Error("Failed to fetch token list")
    const tokens = await response.json()
    return tokens
  } catch (error) {
    console.error("[v0] Jupiter token list error:", error)
    throw error
  }
}

export async function searchJupiterTokens(query: string): Promise<JupiterToken[]> {
  try {
    const response = await fetch(`/api/jupiter/search?query=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error(`Jupiter search failed: ${response.statusText}`)
    }

    const tokens = await response.json()
    return tokens
  } catch (error) {
    console.error("[v0] Jupiter search error:", error)
    throw error
  }
}

export async function getJupiterHoldings(walletAddress: string) {
  try {
    const response = await fetch(`${JUPITER_ULTRA_API}/holdings/${walletAddress}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Jupiter holdings failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Jupiter holdings error:", error)
    throw error
  }
}

export async function getJupiterShield(mints: string[]) {
  try {
    const mintsParam = mints.join(",")
    const response = await fetch(`${JUPITER_ULTRA_API}/shield?mints=${mintsParam}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Jupiter shield failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Jupiter shield error:", error)
    throw error
  }
}

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 100, // 1% default slippage
): Promise<JupiterQuote> {
  try {
    const url =
      `${JUPITER_QUOTE_API}/quote?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `slippageBps=${slippageBps}&` +
      `onlyDirectRoutes=false&` +
      `asLegacyTransaction=false`

    console.log("[v0] Fetching Jupiter quote:", url)

    const response = await fetch(url)
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Quote failed: ${error}`)
    }

    const quote = await response.json()
    console.log("[v0] Jupiter quote received:", quote)
    return quote
  } catch (error) {
    console.error("[v0] Jupiter quote error:", error)
    throw error
  }
}

export async function getJupiterSwapTransaction(quoteResponse: JupiterQuote, userPublicKey: string): Promise<string> {
  try {
    const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Swap transaction failed: ${error}`)
    }

    const { swapTransaction } = await response.json()
    return swapTransaction
  } catch (error) {
    console.error("[v0] Jupiter swap transaction error:", error)
    throw error
  }
}

export async function getJupiterOrder(
  inputMint: string,
  outputMint: string,
  amount: number,
  taker: string,
  slippageBps = 100,
) {
  try {
    const url =
      `${JUPITER_ULTRA_API}/order?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `taker=${taker}&` +
      `slippageBps=${slippageBps}`

    const response = await fetch(url, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Order failed: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Jupiter order error:", error)
    throw error
  }
}

export async function executeJupiterOrder(signedTransaction: string, requestId: string) {
  try {
    const response = await fetch(`${JUPITER_ULTRA_API}/execute`, {
      method: "POST",
      headers: getJupiterHeaders(),
      body: JSON.stringify({
        signedTransaction,
        requestId,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Execute failed: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Jupiter execute error:", error)
    throw error
  }
}

export async function executeSwap(
  connection: Connection,
  swapTransaction: string,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
): Promise<SwapResult> {
  try {
    // Deserialize the transaction
    const transactionBuf = Buffer.from(swapTransaction, "base64")
    const transaction = VersionedTransaction.deserialize(transactionBuf)

    console.log("[v0] Transaction deserialized, requesting signature...")

    // Sign the transaction
    const signedTransaction = await signTransaction(transaction)

    console.log("[v0] Transaction signed, sending...")

    // Send the transaction
    const rawTransaction = signedTransaction.serialize()
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 3,
    })

    console.log("[v0] Transaction sent:", signature)

    // Confirm the transaction
    const latestBlockhash = await connection.getLatestBlockhash()
    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed",
    )

    console.log("[v0] Transaction confirmed:", signature)

    return {
      success: true,
      signature,
    }
  } catch (error: unknown) {
    console.error("[v0] Swap execution error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("User rejected")) {
      return { success: false, error: "Transaction cancelled by user" }
    } else if (errorMessage.includes("insufficient")) {
      return { success: false, error: "Insufficient balance for transaction" }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
