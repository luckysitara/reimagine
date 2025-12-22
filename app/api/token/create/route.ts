import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { createToken, uploadTokenMetadata } from "@/lib/services/token-creation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, decimals, supply, description, walletAddress, imageUrl } = body

    if (!name || !symbol || decimals === undefined || supply === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const rpcUrl = process.env.HELIUS_RPC_URL

    if (!rpcUrl) {
      console.error("[v0] HELIUS_RPC_URL not configured")
      return NextResponse.json(
        { error: "RPC not configured. Please set HELIUS_RPC_URL in environment variables." },
        { status: 500 },
      )
    }

    const connection = new Connection(rpcUrl, "confirmed")

    let payer: PublicKey
    try {
      payer = new PublicKey(walletAddress)
    } catch (error) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    const metadata = await uploadTokenMetadata({
      name,
      symbol,
      description: description || "",
      imageUrl,
    })

    const { transaction, mintKeypair } = await createToken(connection, payer, {
      name,
      symbol,
      decimals: Number(decimals),
      supply: Number(supply),
      description,
      imageUrl,
    })

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = payer

    transaction.partialSign(mintKeypair)

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

    let errorMessage = "Failed to create token"
    let errorDetails = error instanceof Error ? error.message : "Unknown error"

    if (errorDetails.includes("insufficient")) {
      errorMessage = "Insufficient SOL balance"
      errorDetails = "You need at least 0.1 SOL to create a token"
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
