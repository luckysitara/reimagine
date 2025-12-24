import { type Connection, VersionedTransaction } from "@solana/web3.js"
import { Buffer } from "buffer"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"

const JUPITER_API_KEY = typeof window === "undefined" ? process.env.JUPITER_API_KEY : undefined

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
    const response = await fetch("/api/jupiter/tokens", {
      headers: {
        "Cache-Control": "max-age=300",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Token list error:", errorData)
      return []
    }

    const data = await response.json()

    // Handle both array and object responses
    if (Array.isArray(data)) {
      return data.filter((token: any) => token.address && token.symbol && token.decimals !== undefined)
    }

    if (typeof data === "object" && data !== null) {
      return Object.values(data)
        .filter(
          (token: any) =>
            token && typeof token === "object" && token.address && token.symbol && token.decimals !== undefined,
        )
        .slice(0, 2000)
    }

    console.warn("[v0] Token list in unexpected format:", typeof data)
    return []
  } catch (error) {
    console.error("[v0] Jupiter token list fetch error:", error)
    return []
  }
}

export async function findTokenBySymbol(symbol: string): Promise<JupiterToken | null> {
  try {
    const tokens = await getJupiterTokenList()

    if (tokens.length === 0) {
      console.error("[v0] No tokens available for lookup")
      return null
    }

    const upperSymbol = symbol.toUpperCase().trim()

    // 1. Exact symbol match
    let token = tokens.find(
      (t) => t.symbol.toUpperCase() === upperSymbol || t.address.toLowerCase() === symbol.toLowerCase(),
    )
    if (token) {
      console.log("[v0] Found token by exact match:", token.symbol)
      return token
    }

    // 2. Partial match
    token = tokens.find((t) => t.symbol.toUpperCase().includes(upperSymbol))
    if (token) {
      console.log("[v0] Found token by partial match:", token.symbol)
      return token
    }

    // 3. Name match
    token = tokens.find((t) => t.name.toUpperCase().includes(upperSymbol))
    if (token) {
      console.log("[v0] Found token by name match:", token.symbol)
      return token
    }

    console.warn("[v0] Token not found:", symbol)
    return null
  } catch (error) {
    console.error("[v0] Token lookup error:", error)
    return null
  }
}

export async function searchJupiterTokens(query: string): Promise<JupiterToken[]> {
  try {
    const tokens = await getJupiterTokenList()

    if (tokens.length === 0) {
      return []
    }

    const upperQuery = query.toUpperCase().trim()

    return tokens
      .filter(
        (token) =>
          token.symbol.toUpperCase().includes(upperQuery) ||
          token.name.toUpperCase().includes(upperQuery) ||
          token.address.toLowerCase() === query.toLowerCase(),
      )
      .slice(0, 50)
  } catch (error) {
    console.error("[v0] Search error:", error)
    return []
  }
}

export async function estimateGasFee(): Promise<number> {
  try {
    // Get recent transaction prices
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getRecentPrioritizationFees",
        params: [[]], // Get fees for all transactions
      }),
    })

    if (!response.ok) {
      return 5000 // Default fallback: 0.000005 SOL
    }

    const data = await response.json()
    const fees = data.result || []

    if (fees.length === 0) {
      return 5000
    }

    // Get median fee
    const sortedFees = fees.map((f: any) => f.prioritizationFee).sort((a: number, b: number) => a - b)
    const medianFee = sortedFees[Math.floor(sortedFees.length / 2)] || 5000

    return medianFee
  } catch (error) {
    console.error("[v0] Gas fee estimation error:", error)
    return 5000 // Default: 0.000005 SOL in lamports
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

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0")
    }

    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      taker,
    })

    const url = `/api/jupiter/order?${params.toString()}`

    console.log("[v0] Fetching Jupiter quote:", {
      inputMint: inputMint.slice(0, 8),
      outputMint: outputMint.slice(0, 8),
      amount,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error || errorData.details?.errorMessage || `HTTP ${response.status}`

      console.error("[v0] Jupiter quote error:", errorMsg)

      if (errorMsg.includes("Insufficient") || errorMsg.includes("insufficient")) {
        throw new Error(
          "Insufficient balance for this swap. Please reduce the amount or add more funds to your wallet.",
        )
      }

      if (errorMsg.includes("no route") || errorMsg.includes("No swap route") || errorMsg.includes("liquidity")) {
        throw new Error(`No liquidity available for this token pair. Try a different pair or smaller amount.`)
      }

      throw new Error(errorMsg || "Failed to get quote from Jupiter")
    }

    const order = await response.json()

    if (order.error || order.errorMessage) {
      const errorMsg = order.errorMessage || order.error

      if (errorMsg.includes("Insufficient") || order.errorCode === 1) {
        throw new Error("Insufficient balance for this swap (including network fees).")
      }

      throw new Error(errorMsg)
    }

    if (!order.transaction || order.transaction.length === 0) {
      console.error("[v0] Order response missing valid transaction. Response:", Object.keys(order).join(", "))
      throw new Error("No valid swap route found. Try reducing the amount or selecting a different token pair.")
    }

    console.log("[v0] Quote received successfully")
    return order
  } catch (error) {
    console.error("[v0] getJupiterQuote error:", error)
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
      return {
        success: false,
        error: "Transaction cancelled by user",
      }
    } else if (errorMessage.includes("Insufficient") || errorMessage.includes("insufficient")) {
      return {
        success: false,
        error: "Insufficient balance for transaction (including network fees)",
      }
    } else if (errorMessage.includes("deserialize") || errorMessage.includes("buffer")) {
      return {
        success: false,
        error: "Invalid transaction format from Jupiter API",
      }
    } else if (errorMessage.includes("missing") || errorMessage.includes("empty")) {
      return {
        success: false,
        error: "Transaction data is missing from API response",
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
