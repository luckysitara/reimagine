import { Connection, PublicKey } from "@solana/web3.js"
import { secureRPCClient } from "@/lib/utils/rpc-client"

function getRPCEndpoint(): string {
  if (typeof window !== "undefined") {
    throw new Error("Server-side RPC endpoint should not be accessed from client")
  }

  const endpoint = process.env.HELIUS_RPC_URL

  // During build time or when not configured, return a valid placeholder
  if (!endpoint) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[v0] HELIUS_RPC_URL not configured, using placeholder")
    }
    // Return valid placeholder URL for build-time (won't actually be used)
    return "https://mainnet.helius-rpc.com"
  }

  return endpoint
}

export interface TokenBalance {
  mint: string
  amount: number
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
  logoURI?: string
  valueUSD?: number
}

export interface PortfolioData {
  solBalance: number
  tokens: TokenBalance[]
  totalValueUSD: number
  change24h: number
  change24hPercent: number
}

export async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  try {
    if (typeof window !== "undefined") {
      // Client-side: use secure proxy
      const result = await secureRPCClient.getTokenAccountsByOwner(walletAddress, {
        programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      })

      const balances: TokenBalance[] = result.value
        .map((account: any) => {
          const parsedInfo = account.account.data.parsed.info
          return {
            mint: parsedInfo.mint,
            amount: Number.parseInt(parsedInfo.tokenAmount.amount),
            decimals: parsedInfo.tokenAmount.decimals,
            uiAmount: parsedInfo.tokenAmount.uiAmount,
          }
        })
        .filter((balance: TokenBalance) => balance.uiAmount > 0)

      console.log("[v0] Token balances fetched via secure proxy:", balances.length, "tokens")
      return balances
    } else {
      // Server-side: use direct connection with secure RPC URL
      const endpoint = getRPCEndpoint()
      if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
        throw new Error("Invalid RPC endpoint configuration")
      }

      const connection = new Connection(endpoint)
      const publicKey = new PublicKey(walletAddress)

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      })

      const balances: TokenBalance[] = tokenAccounts.value
        .map((account) => {
          const parsedInfo = account.account.data.parsed.info
          return {
            mint: parsedInfo.mint,
            amount: Number.parseInt(parsedInfo.tokenAmount.amount),
            decimals: parsedInfo.tokenAmount.decimals,
            uiAmount: parsedInfo.tokenAmount.uiAmount,
          }
        })
        .filter((balance) => balance.uiAmount > 0)

      console.log("[v0] Token balances fetched (server-side):", balances.length, "tokens")
      return balances
    }
  } catch (error) {
    console.error("[v0] Error fetching token balances:", error)
    throw error
  }
}

export async function enrichTokenData(balances: TokenBalance[]): Promise<TokenBalance[]> {
  try {
    if (balances.length === 0) {
      return []
    }

    const mintAddresses = balances.map((b) => b.mint).join(",")
    const encodedQuery = encodeURIComponent(mintAddresses)

    try {
      const response = await fetch(`/api/jupiter/search?query=${encodedQuery}`)

      if (!response.ok) {
        console.error("[v0] Jupiter API error:", response.status, response.statusText)
        // Return unmodified balances if enrichment fails
        return balances
      }

      const jupiterTokens = await response.json()

      // Handle case where API returns error object instead of array
      if (jupiterTokens.error) {
        console.error("[v0] Jupiter API returned error:", jupiterTokens.error)
        return balances
      }

      const tokenMap = new Map(
        (Array.isArray(jupiterTokens) ? jupiterTokens : []).map((token: any) => [token.address, token]),
      )

      return balances.map((balance) => {
        const tokenInfo = tokenMap.get(balance.mint)
        if (tokenInfo) {
          return {
            ...balance,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            logoURI: tokenInfo.logoURI,
          }
        }
        return balance
      })
    } catch (fetchError) {
      console.error("[v0] Failed to fetch token enrichment data:", fetchError)
      return balances
    }
  } catch (error) {
    console.error("[v0] Error enriching token data:", error)
    return balances
  }
}

export async function getPortfolioValue(walletAddress: string): Promise<PortfolioData> {
  try {
    let solBalanceUI: number

    if (typeof window !== "undefined") {
      // Client-side: use secure proxy
      const solBalance = await secureRPCClient.getBalance(walletAddress)
      solBalanceUI = solBalance / 1e9
    } else {
      // Server-side: use direct connection
      const endpoint = getRPCEndpoint()
      if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
        throw new Error("Invalid RPC endpoint configuration")
      }

      const connection = new Connection(endpoint)
      const publicKey = new PublicKey(walletAddress)
      const solBalance = await connection.getBalance(publicKey)
      solBalanceUI = solBalance / 1e9
    }

    // Get token balances
    let tokens = await getTokenBalances(walletAddress)

    // Enrich with metadata
    tokens = await enrichTokenData(tokens)

    let solPriceUSD = 100 // Fallback
    try {
      const priceUrl = "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
      const priceResponse = await fetch(priceUrl)
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        if (priceData.data && typeof priceData.data === "object") {
          solPriceUSD = priceData.data.So11111111111111111111111111111111111111112?.price || 100
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching SOL price:", error)
      // Continue with fallback price
    }

    const totalValueUSD = solBalanceUI * solPriceUSD

    return {
      solBalance: solBalanceUI,
      tokens,
      totalValueUSD,
      change24h: 0,
      change24hPercent: 0,
    }
  } catch (error) {
    console.error("[v0] Error getting portfolio value:", error)
    throw error
  }
}
