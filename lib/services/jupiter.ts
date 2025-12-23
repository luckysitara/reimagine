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
  error?: string
  errorMessage?: string
  errorCode?: number
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch token list: ${response.statusText}`)
    }
    const tokens = await response.json()
    return Array.isArray(tokens) ? tokens : []
  } catch (error) {
    console.error("[v0] Jupiter token list error:", error)
    throw error
  }
}

export async function searchJupiterTokens(query: string): Promise<JupiterToken[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(`/api/jupiter/search?query=${encodedQuery}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Jupiter search failed: ${response.statusText}`)
    }

    const tokens = await response.json()
    return Array.isArray(tokens) ? tokens : []
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
    if (!taker) {
      throw new Error("Wallet address is required. Please connect your wallet to get quotes.")
    }

    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      taker,
    })

    const url = `/api/jupiter/order?${params.toString()}`

    console.log("[v0] Fetching Jupiter Ultra order from:", url)

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error || errorData.details?.errorMessage || `HTTP ${response.status}`

      if (errorMsg.includes("Insufficient funds")) {
        throw new Error(
          "Insufficient balance for this swap. Please reduce the amount or add more funds to your wallet.",
        )
      }

      throw new Error(errorMsg)
    }

    const order = await response.json()
    console.log("[v0] Jupiter Ultra order received - has transaction:", !!order.transaction)

    if (order.error || order.errorMessage) {
      const errorMsg = order.errorMessage || order.error

      if (errorMsg.includes("Insufficient funds") || order.errorCode === 1) {
        throw new Error("Insufficient balance for this swap (including fees). Please reduce the amount.")
      }

      throw new Error(errorMsg)
    }

    if (!order.transaction) {
      console.error("[v0] Order response missing transaction field. Response keys:", Object.keys(order))
      throw new Error("No valid swap route found for this token pair. The tokens may not have sufficient liquidity.")
    }

    return order
  } catch (error) {
    console.error("[v0] Jupiter order error:", error)
    throw error
  }
}

export async function getJupiterSwapTransaction(quoteResponse: JupiterQuote, userPublicKey: string): Promise<string> {
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
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const order = await response.json()

    if (!order.transaction) {
      console.error("[v0] Order missing transaction field:", order)
      throw new Error("Jupiter API response is missing the transaction field")
    }

    return order
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
      console.error("[v0] Execute failed with status:", response.status, error)
      throw new Error(
        `Execute failed: ${response.status === 400 ? "Invalid transaction or insufficient funds" : error}`,
      )
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
    if (!swapTransaction || swapTransaction.trim() === "") {
      console.error("[v0] Empty transaction string provided")
      throw new Error("Transaction data is empty or missing")
    }

    console.log("[v0] Deserializing transaction (length:", swapTransaction.length, ")...")

    let transactionBuf: Buffer
    try {
      transactionBuf = Buffer.from(swapTransaction, "base64")
      if (transactionBuf.length === 0) {
        throw new Error("Transaction buffer is empty after base64 decode")
      }
      console.log("[v0] Transaction buffer size:", transactionBuf.length, "bytes")
    } catch (bufferError) {
      console.error("[v0] Failed to decode base64 transaction:", bufferError)
      throw new Error("Invalid base64 transaction data")
    }

    let transaction: VersionedTransaction

    try {
      transaction = VersionedTransaction.deserialize(transactionBuf)
      console.log("[v0] Transaction deserialized successfully")
    } catch (deserializeError) {
      console.error("[v0] Transaction deserialization failed:", deserializeError)
      console.error("[v0] Transaction buffer preview (first 50 bytes):", transactionBuf.slice(0, 50).toString("hex"))
      throw new Error(
        "Failed to deserialize transaction. The transaction data may be corrupted or in an invalid format.",
      )
    }

    console.log("[v0] Requesting signature from wallet...")

    let signedTransaction: VersionedTransaction
    try {
      signedTransaction = await signTransaction(transaction)
      console.log("[v0] Transaction signed successfully")
    } catch (signError) {
      console.error("[v0] Transaction signing failed:", signError)
      if (signError instanceof Error && signError.message.includes("User rejected")) {
        throw new Error("Transaction cancelled by user")
      }
      throw new Error("Failed to sign transaction")
    }

    const signedTransactionBase64 = Buffer.from(signedTransaction.serialize()).toString("base64")

    if (requestId) {
      console.log("[v0] Executing via Ultra API with requestId:", requestId)

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
        console.error("[v0] Ultra API execute failed:", error)
        throw new Error(`Ultra API execute failed: ${error}`)
      }

      const result = await executeResponse.json()
      console.log("[v0] Ultra API execute result:", result)

      return {
        success: true,
        signature: result.signature || result.txid,
      }
    }

    console.log("[v0] Sending transaction directly to Solana network...")

    const rawTransaction = signedTransaction.serialize()
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    })

    console.log("[v0] Transaction sent:", signature)

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
    } else if (errorMessage.includes("Insufficient") || errorMessage.includes("insufficient")) {
      return { success: false, error: "Insufficient balance for transaction (including network fees)" }
    } else if (errorMessage.includes("deserialize") || errorMessage.includes("buffer")) {
      return { success: false, error: "Invalid transaction format from Jupiter API" }
    } else if (errorMessage.includes("missing") || errorMessage.includes("empty")) {
      return { success: false, error: "Transaction data is missing from API response" }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
