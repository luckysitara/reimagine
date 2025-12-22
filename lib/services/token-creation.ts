import { type Connection, Keypair, type PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
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
  imageUrl?: string
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

  const mintKeypair = Keypair.generate()
  const mintPublicKey = mintKeypair.publicKey

  const lamports = await getMinimumBalanceForRentExemptMint(connection)

  const transaction = new Transaction()

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintPublicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
  )

  transaction.add(createInitializeMintInstruction(mintPublicKey, decimals, payer, payer, TOKEN_PROGRAM_ID))

  const associatedTokenAccount = await getAssociatedTokenAddress(mintPublicKey, payer)

  transaction.add(createAssociatedTokenAccountInstruction(payer, associatedTokenAccount, payer, mintPublicKey))

  if (supply > 0) {
    const amount = BigInt(supply) * BigInt(Math.pow(10, decimals))

    transaction.add(createMintToInstruction(mintPublicKey, associatedTokenAccount, payer, amount))
  }

  return { transaction, mintKeypair }
}

export async function uploadTokenMetadata(params: {
  name: string
  symbol: string
  description: string
  imageUrl?: string
}): Promise<{ uri: string }> {
  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: params.imageUrl || "",
  }

  return {
    uri: `data:application/json;base64,${btoa(JSON.stringify(metadata))}`,
  }
}
