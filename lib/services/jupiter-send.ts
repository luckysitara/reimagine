/**
 * Jupiter Send API - Send tokens to users without wallets
 *
 * Create claim links and onboard new users
 */

import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface CreateSendParams {
  mint: string
  amount: string
  sender: string
  recipient?: string // Optional: if provided, claim link is for specific user
  message?: string
  expiresAt?: number // Unix timestamp
}

export interface SendLink {
  id: string
  claimUrl: string
  mint: string
  amount: string
  sender: string
  recipient?: string
  message?: string
  status: "pending" | "claimed" | "expired" | "cancelled"
  createdAt: number
  expiresAt?: number
  claimedAt?: number
  claimedBy?: string
}

export interface ClaimResult {
  signature: string
  amount: string
  mint: string
}

/**
 * Create a send link transaction
 */
export async function createSendLink(params: CreateSendParams): Promise<{ transaction: string; linkId: string }> {
  const response = await fetch(`${JUPITER_API_URLS.send}/create`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create send link: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get send link details
 */
export async function getSendLink(linkId: string): Promise<SendLink> {
  const response = await fetch(`${JUPITER_API_URLS.send}/link/${linkId}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get send link: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Claim tokens from a send link
 */
export async function claimSendLink(linkId: string, claimer: string): Promise<{ transaction: string }> {
  const response = await fetch(`${JUPITER_API_URLS.send}/claim`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ linkId, claimer }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to claim send link: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Cancel a send link (only sender can cancel)
 */
export async function cancelSendLink(linkId: string, sender: string): Promise<{ transaction: string }> {
  const response = await fetch(`${JUPITER_API_URLS.send}/cancel`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ linkId, sender }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to cancel send link: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get all send links created by a wallet
 */
export async function getSenderLinks(wallet: string): Promise<SendLink[]> {
  const response = await fetch(`${JUPITER_API_URLS.send}/sender/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get sender links: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get all send links received by a wallet
 */
export async function getRecipientLinks(wallet: string): Promise<SendLink[]> {
  const response = await fetch(`${JUPITER_API_URLS.send}/recipient/${wallet}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get recipient links: ${response.statusText}`)
  }

  return await response.json()
}
