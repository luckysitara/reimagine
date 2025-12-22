/**
 * Jupiter Lock API - Token vesting and locking
 *
 * View and manage locked/vesting tokens
 */

import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface VestingSchedule {
  address: string
  mint: string
  beneficiary: string
  totalAmount: string
  releasedAmount: string
  startTime: number
  endTime: number
  cliffTime: number
  vestingPeriods: number
  nextUnlockTime: number
  nextUnlockAmount: string
  status: "active" | "completed" | "cancelled"
}

export interface LockedTokens {
  address: string
  mint: string
  owner: string
  amount: string
  lockUntil: number
  releaseType: "linear" | "cliff" | "periodic"
  status: "locked" | "unlocked"
}

/**
 * Get all vesting schedules for a beneficiary
 */
export async function getVestingSchedules(wallet: string): Promise<VestingSchedule[]> {
  const response = await fetch(`${JUPITER_API_URLS.lock}/vesting/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get vesting schedules: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get all locked tokens for a wallet
 */
export async function getLockedTokens(wallet: string): Promise<LockedTokens[]> {
  const response = await fetch(`${JUPITER_API_URLS.lock}/locked/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get locked tokens: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Claim vested tokens
 */
export async function claimVestedTokens(vestingAddress: string, beneficiary: string): Promise<{ transaction: string }> {
  const response = await fetch(`${JUPITER_API_URLS.lock}/claim`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ vestingAddress, beneficiary }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to claim vested tokens: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get unlock schedule summary
 */
export async function getUnlockSchedule(wallet: string): Promise<{
  totalLocked: string
  totalVesting: string
  nextUnlock: {
    amount: string
    time: number
  }
  upcomingUnlocks: Array<{
    amount: string
    time: number
    source: string
  }>
}> {
  const response = await fetch(`${JUPITER_API_URLS.lock}/schedule/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get unlock schedule: ${response.statusText}`)
  }

  return await response.json()
}
