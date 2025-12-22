import { Connection } from "@solana/web3.js"

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    const endpoint = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL

    if (!endpoint) {
      // During build or when env vars are not set, throw a clear error
      throw new Error(
        "HELIUS_RPC_URL environment variable is required. Please configure it in your deployment settings.",
      )
    }

    if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
      throw new Error(`Invalid RPC endpoint URL: ${endpoint}. Must start with http:// or https://`)
    }

    console.log("[v0] Creating Solana connection with Helius RPC")
    connection = new Connection(endpoint, "confirmed")
  }

  return connection
}
