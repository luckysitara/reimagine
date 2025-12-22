import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface PortfolioToken {
  mint: string
  symbol: string
  decimals: number
  amount: string
  uiAmount: number
  valueUsd: number
  price: number
}

export interface PortfolioOverview {
  totalValueUsd: number
  tokens: PortfolioToken[]
  stakingPositions: StakingPosition[]
  defiPositions: DefiPosition[]
}

export interface StakingPosition {
  protocol: string
  mint: string
  amount: string
  valueUsd: number
  apy: number
}

export interface DefiPosition {
  protocol: string
  type: "lending" | "liquidity" | "farming"
  tokens: PortfolioToken[]
  valueUsd: number
  apy: number
}

export async function getPortfolioOverview(wallet: string): Promise<PortfolioOverview> {
  const response = await fetch(`${JUPITER_API_URLS.portfolio}/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.statusText}`)
  }

  return await response.json()
}

export async function getStakedJupiter(wallet: string): Promise<StakingPosition[]> {
  const response = await fetch(`${JUPITER_API_URLS.portfolio}/${wallet}/jup-stake`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch staked JUP: ${response.statusText}`)
  }

  return await response.json()
}
