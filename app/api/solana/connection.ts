import { Connection } from "@solana/web3.js"

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    const endpoint =
      process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"

    console.log("[v0] Creating Solana connection for server-side operations")
    connection = new Connection(endpoint, "confirmed")
  }

  return connection
}
