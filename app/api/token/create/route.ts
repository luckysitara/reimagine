import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { createToken, uploadTokenMetadata } from "@/lib/services/token-creation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, decimals, supply, description, walletAddress } = body

    if (!name || !symbol || decimals === undefined || supply === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL

    if (!rpcUrl) {
      return NextResponse.json({ error: "HELIUS_RPC_URL not configured on server" }, { status: 500 })
    }

    const connection = new Connection(rpcUrl, "confirmed")
    const payer = new PublicKey(walletAddress)

    // Upload metadata (placeholder for now)
    const metadata = await uploadTokenMetadata({
      name,
      symbol,
      description: description || "",
    })

    console.log("[v0] Creating token with params:", { name, symbol, decimals, supply })

    // Create token transaction
    const { transaction, mintKeypair } = await createToken(connection, payer, {
      name,
      symbol,
      decimals: Number(decimals),
      supply: Number(supply),
      description,
    })

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payer

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    return NextResponse.json({
      success: true,
      transaction: Buffer.from(serializedTransaction).toString("base64"),
      mintAddress: mintKeypair.publicKey.toBase58(),
      message: `Token ${symbol} created successfully!`,
      metadataUri: metadata.uri,
    })
  } catch (error) {
    console.error("[v0] Token creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
