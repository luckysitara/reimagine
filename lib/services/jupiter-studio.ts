/**
 * Jupiter Studio API - Token Creation Platform
 *
 * Create and launch tokens with bonding curves, vesting, and LP locking
 */

import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface CreateTokenParams {
  name: string
  symbol: string
  description: string
  imageUrl?: string
  headerImageUrl?: string
  quoteMint: string // USDC, SOL, or JUP
  initialMarketCap: string // Initial MC in quote token
  migrationMarketCap: string // Migration MC in quote token
  creatorFeeBps: number // LP fees in basis points (0-1000)
  vestingAmount?: string
  vestingDuration?: number // in seconds
  vestingPeriods?: number
  cliffDuration?: number // in seconds
  antiSnipingEnabled?: boolean
  lpLockEnabled?: boolean
  creator: string // Wallet address
}

export interface PresignedUploadUrl {
  url: string
  fields: Record<string, string>
}

export interface TokenCreationResult {
  mint: string
  poolAddress: string
  bondingCurveAddress: string
  signature: string
}

export interface TokenFees {
  mint: string
  unclaimedFees: string
  claimableAt: number
}

/**
 * Get presigned URL for image upload
 */
export async function getPresignedImageUrl(fileName: string, contentType: string): Promise<PresignedUploadUrl> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/presigned-url`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ fileName, contentType }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to get presigned URL: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Upload image to presigned URL
 */
export async function uploadImageToPresignedUrl(presignedData: PresignedUploadUrl, file: File): Promise<string> {
  const formData = new FormData()

  // Add all fields from presigned data
  Object.entries(presignedData.fields).forEach(([key, value]) => {
    formData.append(key, value)
  })

  // Add the file last
  formData.append("file", file)

  const response = await fetch(presignedData.url, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`)
  }

  // Return the URL of the uploaded image
  return `${presignedData.url}/${presignedData.fields.key}`
}

/**
 * Create token metadata
 */
export async function createTokenMetadata(params: CreateTokenParams): Promise<{ metadataUri: string }> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/metadata`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.imageUrl,
      headerImage: params.headerImageUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create metadata: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Create token transaction
 */
export async function createTokenTransaction(
  params: CreateTokenParams & { metadataUri: string },
): Promise<{ transaction: string; mint: string }> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/create-token`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create token transaction: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get token creation status
 */
export async function getTokenCreationStatus(signature: string): Promise<TokenCreationResult> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/status/${signature}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get token status: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get unclaimed fees for a token
 */
export async function getUnclaimedFees(mint: string, creator: string): Promise<TokenFees> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/fees/${mint}?creator=${creator}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get fees: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Claim creator fees
 */
export async function claimCreatorFees(mint: string, creator: string): Promise<{ transaction: string }> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/claim-fees`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ mint, creator }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to claim fees: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get pool addresses for a token
 */
export async function getTokenPoolAddresses(mint: string): Promise<{
  poolAddress: string
  bondingCurveAddress: string
  lpMintAddress: string
}> {
  const response = await fetch(`${JUPITER_API_URLS.studio}/pool/${mint}`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to get pool addresses: ${response.statusText}`)
  }

  return await response.json()
}
