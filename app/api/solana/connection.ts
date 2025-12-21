import { Connection } from "@solana/web3.js"

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    const endpoint = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL

    if (!endpoint) {
      throw new Error("HELIUS_RPC_URL or NEXT_PUBLIC_HELIUS_RPC_URL environment variable is required")
    }

    console.log("[v0] Creating Solana connection with Helius RPC for server-side operations")
    connection = new Connection(endpoint, "confirmed")
  }

  return connection
}
