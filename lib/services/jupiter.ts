import { type Connection, VersionedTransaction } from "@solana/web3.js"
import { Buffer } from "buffer"
import { secureRPCClient } from "@/lib/utils/rpc-client"
import { getAbsoluteUrl, getJupiterHeaders, JUPITER_API_URLS } from "@/lib/constants/api-urls"

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1"

const JUPITER_API_KEY = typeof window === "undefined" ? process.env.JUPITER_API_KEY : undefined

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

export interface QuoteResponse {
  inAmount: string
  outAmount: string
  routePlan?: any[]
  priceImpactPct: string
}

export interface SwapResult {
  success: boolean
  signature?: string
  error?: string
  outputAmount?: string
}

export async function getJupiterTokenList(): Promise<JupiterToken[]> {
  try {
    const response = await fetch(getAbsoluteUrl("/api/jupiter/tokens"), {
      headers: {
        "Cache-Control": "max-age=300",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Token list error:", errorData)
      return getCommonTokensFallback()
    }

    const data = await response.json()

    let tokens: JupiterToken[] = []
    if (Array.isArray(data)) {
      tokens = data.filter((token: any) => token.address && token.symbol && token.decimals !== undefined)
    } else if (typeof data === "object" && data !== null) {
      tokens = Object.values(data)
        .filter(
          (token: any) =>
            token && typeof token === "object" && token.address && token.symbol && token.decimals !== undefined,
        )
        .slice(0, 2000)
    }

    const commonTokens = getCommonTokensFallback()
    const tokenMap = new Map<string, JupiterToken>()

    commonTokens.forEach((t) => tokenMap.set(t.address.toLowerCase(), t))
    tokens.forEach((t) => tokenMap.set(t.address.toLowerCase(), t))

    return Array.from(tokenMap.values())
  } catch (error) {
    console.error("[v0] Jupiter token list fetch error:", error)
    return getCommonTokensFallback()
  }
}

function getCommonTokensFallback(): JupiterToken[] {
  return [
    {
      address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw/logo.png",
    },
    {
      address: "DezXAZ8z7PnrnRJjoBRwWQVzEjVAn81VolNAH3vtN2g",
      symbol: "BONK",
      name: "Bonk",
      decimals: 5,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjoBRwWQVzEjVAn81VolNAH3vtN2g/logo.png",
    },
    {
      address: "JUPyiwrYJFskUPiHa7hKeAlrjUzNcfCP5AJbNbLAXUc",
      symbol: "JUP",
      name: "Jupiter",
      decimals: 6,
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hKeAlrjUzNcfCP5AJbNbLAXUc/logo.png",
    },
  ]
}

export async function findTokenBySymbol(symbol: string, ignoreCache = false): Promise<JupiterToken | null> {
  try {
    const tokens = await getJupiterTokenList()

    if (tokens.length === 0) {
      console.error("[v0] No tokens available for lookup")
      return null
    }

    const upperSymbol = symbol.toUpperCase().trim()

    // 1. Exact symbol match (case-insensitive)
    let token = tokens.find(
      (t) => t.symbol.toUpperCase() === upperSymbol || t.address.toLowerCase() === symbol.toLowerCase(),
    )
    if (token) {
      console.log("[v0] Found token by exact match:", token.symbol, token.address)
      return token
    }

    // 2. Check common token mints directly (for tokens that might not be in the full list)
    const commonTokenMints: Record<string, JupiterToken> = {
      SOL: {
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        decimals: 9,
      },
      USDC: {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
      },
      USDT: {
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
      },
      BONK: {
        address: "DezXAZ8z7PnrnRJjoBRwWQVzEjVAn81VolNAH3vtN2g",
        symbol: "BONK",
        name: "Bonk",
        decimals: 5,
      },
      JUP: {
        address: "JUPyiwrYJFskUPiHa7hKeAlrjUzNcfCP5AJbNbLAXUc",
        symbol: "JUP",
        name: "Jupiter",
        decimals: 6,
      },
    }

    if (commonTokenMints[upperSymbol]) {
      console.log("[v0] Found token from common mints cache:", upperSymbol)
      return commonTokenMints[upperSymbol]
    }

    // 3. Partial match
    token = tokens.find((t) => t.symbol.toUpperCase().includes(upperSymbol))
    if (token) {
      console.log("[v0] Found token by partial match:", token.symbol)
      return token
    }

    // 4. Name match
    token = tokens.find((t) => t.name.toUpperCase().includes(upperSymbol))
    if (token) {
      console.log("[v0] Found token by name match:", token.symbol)
      return token
    }

    console.warn("[v0] Token not found:", symbol, "checked", tokens.length, "tokens")
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
    const recentFees = await secureRPCClient.request("getRecentPrioritizationFees", [[]])
    const fees = recentFees || []

    if (fees.length === 0) {
      return 5000 // Default fallback: 0.000005 SOL in lamports
    }

    // Get median fee from recent transactions
    const sortedFees = fees.map((f: any) => f.prioritizationFee).sort((a: number, b: number) => a - b)
    const medianFee = sortedFees[Math.floor(sortedFees.length / 2)] || 5000

    console.log("[v0] Estimated gas fee:", medianFee, "lamports")
    return medianFee
  } catch (error) {
    console.error("[v0] Gas fee estimation error:", error)
    return 5000 // Default: 0.000005 SOL in lamports (~2.5 cents)
  }
}

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 100,
  userPublicKey?: string,
): Promise<QuoteResponse | null> {
  try {
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      console.error("[v0] Invalid quote amount:", amount)
      return null
    }

    const response = await fetch(
      `/api/jupiter/quote?` +
        `inputMint=${inputMint}&` +
        `outputMint=${outputMint}&` +
        `amount=${Math.floor(amount)}&` +
        `slippageBps=${slippageBps}${userPublicKey ? `&userPublicKey=${userPublicKey}` : ""}`,
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Quote error:", errorData)
      return null
    }

    const data = await response.json()

    if (data.error) {
      console.error("[v0] Quote error:", data.error)
      return null
    }

    return data
  } catch (error) {
    let msg = "Unknown error"
    if (error instanceof Error) {
      msg = error.message
    } else if (error instanceof String) {
      msg = String(error)
    }
    console.error("[v0] getJupiterQuote error:", msg)
    return null
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

export type Interval = "5m" | "1h" | "6h" | "24h"
export type Category = "toptraded" | "toptrending" | "toporganicscore" | "recent"

export interface TokenInfo extends JupiterToken {
  holderCount?: number
  organicScore?: number
  organicScoreLabel?: string
  usdPrice?: number
  mcap?: number
  fdv?: number
  liquidity?: number
  firstPool?: {
    id: string
    createdAt: string
  }
  stats24h?: {
    priceChange: number
    buyVolume: number
    traderCount: number
  }
}

/**
 * Search tokens by symbol, name, or mint address
 * Supports comma-separated values for multiple searches
 */
export async function searchTokensAdvanced(query: string): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/search?query=${encodeURIComponent(query)}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Token search error:", response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Token search error:", error)
    return []
  }
}

/**
 * Get tokens by category with time interval
 * Categories: toptraded, toptrending, toporganicscore, recent
 * Intervals: 5m, 1h, 6h, 24h
 */
export async function getTokensByCategory(category: Category, interval: Interval, limit = 50): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/${category}/${interval}?limit=${limit}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Category tokens error:", response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Category tokens error:", error)
    return []
  }
}

/**
 * Get recently created tokens (first pool creation)
 * Useful for discovering new tokens
 */
export async function getRecentTokens(limit = 30): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/recent?limit=${limit}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Recent tokens error:", response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Recent tokens error:", error)
    return []
  }
}

/**
 * Get tokens by tag (verified or lst)
 */
export async function getTokensByTag(tag: "verified" | "lst"): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/tag?query=${tag}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Tag tokens error:", response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Tag tokens error:", error)
    return []
  }
}

/**
 * Get trending/cooking content for tokens
 * Returns content for tokens that are currently trending
 */
export async function getCookingContent(): Promise<any> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/content/cooking`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Cooking content error:", response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Cooking content error:", error)
    return null
  }
}

/**
 * Get content for specific mints
 */
export async function getContentByMints(mints: string[]): Promise<any> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.tokensV2}/content?mints=${mints.join(",")}`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      console.error("[v0] Content by mints error:", response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Content by mints error:", error)
    return null
  }
}
