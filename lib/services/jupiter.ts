import { type Connection, VersionedTransaction } from "@solana/web3.js"
import { Buffer } from "buffer"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"

const JUPITER_API_KEY = typeof window === "undefined" ? process.env.JUPITER_API_KEY : undefined

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
  slippageBps: number
  priceImpactPct: string
  requestId: string
  transaction: string
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
  slippageBps = 100,
  taker?: string,
): Promise<JupiterQuote> {
  try {
    // Ultra API requires taker address, use a fallback if not provided
    const takerAddress = taker || "11111111111111111111111111111111"

    const url =
      `/api/jupiter/order?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `slippageBps=${slippageBps}&` +
      `taker=${takerAddress}`

    console.log("[v0] Fetching Jupiter Ultra order:", url)

    const response = await fetch(url)
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Order failed: ${error}`)
    }

    const order = await response.json()
    console.log("[v0] Jupiter Ultra order received:", order)
    return order
  } catch (error) {
    console.error("[v0] Jupiter order error:", error)
    throw error
  }
}

export async function getJupiterSwapTransaction(quoteResponse: JupiterQuote, userPublicKey: string): Promise<string> {
  // Ultra API already includes the transaction in the order response
  return quoteResponse.transaction
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
      `/api/jupiter/order?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `taker=${taker}&` +
      `slippageBps=${slippageBps}`

    console.log("[v0] Fetching Jupiter Ultra order:", url)

    const response = await fetch(url)

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
    const response = await fetch(`/api/jupiter/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
  requestId?: string,
): Promise<SwapResult> {
  try {
    console.log("[v0] Deserializing transaction...")

    // Deserialize the transaction from base64
    const transactionBuf = Buffer.from(swapTransaction, "base64")
    let transaction: VersionedTransaction

    try {
      transaction = VersionedTransaction.deserialize(transactionBuf)
    } catch (deserializeError) {
      console.error("[v0] Transaction deserialization failed:", deserializeError)
      throw new Error("Failed to deserialize transaction. The transaction data may be corrupted.")
    }

    console.log("[v0] Transaction deserialized successfully, requesting signature...")

    // Sign the transaction using wallet
    let signedTransaction: VersionedTransaction
    try {
      signedTransaction = await signTransaction(transaction)
    } catch (signError) {
      console.error("[v0] Transaction signing failed:", signError)
      if (signError instanceof Error && signError.message.includes("User rejected")) {
        throw new Error("Transaction cancelled by user")
      }
      throw new Error("Failed to sign transaction")
    }

    console.log("[v0] Transaction signed successfully")

    // Serialize the signed transaction to base64
    const signedTransactionBase64 = Buffer.from(signedTransaction.serialize()).toString("base64")

    // If we have a requestId, use the Ultra API execute endpoint
    if (requestId) {
      console.log("[v0] Executing via Ultra API...")

      const executeResponse = await fetch("/api/jupiter/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTransaction: signedTransactionBase64,
          requestId,
        }),
      })

      if (!executeResponse.ok) {
        const error = await executeResponse.text()
        throw new Error(`Ultra API execute failed: ${error}`)
      }

      const result = await executeResponse.json()
      console.log("[v0] Ultra API execute result:", result)

      return {
        success: true,
        signature: result.signature || result.txid,
      }
    }

    // Otherwise, send directly to the network
    console.log("[v0] Sending transaction to network...")

    const rawTransaction = signedTransaction.serialize()
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    })

    console.log("[v0] Transaction sent:", signature)

    // Confirm the transaction
    const latestBlockhash = await connection.getLatestBlockhash("confirmed")
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

    if (errorMessage.includes("User rejected") || errorMessage.includes("cancelled")) {
      return { success: false, error: "Transaction cancelled by user" }
    } else if (errorMessage.includes("insufficient")) {
      return { success: false, error: "Insufficient balance for transaction" }
    } else if (errorMessage.includes("deserialize")) {
      return { success: false, error: "Invalid transaction format" }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
