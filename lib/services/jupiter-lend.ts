import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface LendingPool {
  address: string
  mint: string
  symbol: string
  apy: number
  totalDeposits: string
  availableLiquidity: string
  utilization: number
}

export interface UserLendingPosition {
  pool: string
  mint: string
  deposited: string
  earned: string
  apy: number
}

export async function getLendingPools(): Promise<LendingPool[]> {
  const response = await fetch(`${JUPITER_API_URLS.lend}/pools`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch lending pools: ${response.statusText}`)
  }

  return await response.json()
}

export async function depositToPool(poolAddress: string, amount: string, user: string): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.lend}/deposit`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ pool: poolAddress, amount, user }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Deposit failed: ${response.statusText}`)
  }

  return await response.json()
}

export async function withdrawFromPool(poolAddress: string, amount: string, user: string): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.lend}/withdraw`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ pool: poolAddress, amount, user }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Withdraw failed: ${response.statusText}`)
  }

  return await response.json()
}

export async function getUserLendingPositions(wallet: string): Promise<UserLendingPosition[]> {
  const response = await fetch(`${JUPITER_API_URLS.lend}/positions/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch lending positions: ${response.statusText}`)
  }

  return await response.json()
}
