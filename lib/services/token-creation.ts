import { type Connection, Keypair, type PublicKey, Transaction } from "@solana/web3.js"
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token"

export interface TokenCreationParams {
  name: string
  symbol: string
  decimals: number
  supply: number
  description?: string
  logoFile?: File
}

export interface TokenCreationResult {
  success: boolean
  mintAddress?: string
  signature?: string
  error?: string
}

export async function createToken(
  connection: Connection,
  payer: PublicKey,
  params: TokenCreationParams,
): Promise<{ transaction: Transaction; mintKeypair: Keypair }> {
  const { decimals, supply } = params

  // Generate new mint keypair
  const mintKeypair = Keypair.generate()
  const mintPublicKey = mintKeypair.publicKey

  // Get minimum balance for rent exemption
  const lamports = await getMinimumBalanceForRentExemptMint(connection)

  // Create transaction
  const transaction = new Transaction()

  // Add system program instruction to create new account
  transaction.add({
    fromPubkey: payer,
    newAccountPubkey: mintPublicKey,
    space: MINT_SIZE,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  } as any)

  // Add instruction to initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mintPublicKey,
      decimals,
      payer, // mint authority
      payer, // freeze authority (set to null if not needed)
      TOKEN_PROGRAM_ID,
    ),
  )

  // Get associated token account address
  const associatedTokenAccount = await getAssociatedTokenAddress(mintPublicKey, payer)

  // Add instruction to create associated token account
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer, // payer
      associatedTokenAccount, // associated token account
      payer, // owner
      mintPublicKey, // mint
    ),
  )

  // Add instruction to mint initial supply
  if (supply > 0) {
    const amount = supply * Math.pow(10, decimals)
    transaction.add(
      createMintToInstruction(
        mintPublicKey, // mint
        associatedTokenAccount, // destination
        payer, // authority
        amount, // amount
      ),
    )
  }

  return { transaction, mintKeypair }
}

export async function uploadTokenMetadata(params: {
  name: string
  symbol: string
  description: string
  logoFile?: File
}): Promise<{ uri: string }> {
  // In production, upload to IPFS or Arweave
  // For now, return a placeholder
  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: params.logoFile ? "https://placeholder.svg/icon" : "",
  }

  // TODO: Implement actual upload to decentralized storage
  console.log("[v0] Token metadata prepared:", metadata)

  return {
    uri: `data:application/json;base64,${btoa(JSON.stringify(metadata))}`,
  }
}
