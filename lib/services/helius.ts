import { Connection, PublicKey } from "@solana/web3.js"

const RPC_ENDPOINT =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"
    : process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"

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
    const connection = new Connection(RPC_ENDPOINT)
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

    console.log("[v0] Token balances fetched:", balances.length, "tokens")

    return balances
  } catch (error) {
    console.error("[v0] Error fetching token balances:", error)
    throw error
  }
}

export async function enrichTokenData(balances: TokenBalance[]): Promise<TokenBalance[]> {
  try {
    const mintAddresses = balances.map((b) => b.mint).join(",")
    const response = await fetch(`/api/jupiter/search?query=${mintAddresses}`)

    if (!response.ok) {
      console.error("[v0] Jupiter API error:", response.statusText)
      return balances
    }

    const jupiterTokens = await response.json()
    const tokenMap = new Map(jupiterTokens.map((token: any) => [token.address, token]))

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
  } catch (error) {
    console.error("[v0] Error enriching token data:", error)
    return balances
  }
}

export async function getPortfolioValue(walletAddress: string): Promise<PortfolioData> {
  try {
    const connection = new Connection(RPC_ENDPOINT)
    const publicKey = new PublicKey(walletAddress)

    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey)
    const solBalanceUI = solBalance / 1e9

    // Get token balances
    let tokens = await getTokenBalances(walletAddress)

    // Enrich with metadata
    tokens = await enrichTokenData(tokens)

    // In production, fetch real prices from Coingecko or Jupiter
    // For now, using mock prices
    const solPriceUSD = 100 // Mock price
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
