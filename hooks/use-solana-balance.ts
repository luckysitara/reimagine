"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import useSWR from "swr"

export function useSolanaBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const {
    data: balance,
    error,
    mutate,
  } = useSWR(
    publicKey ? ["balance", publicKey.toBase58()] : null,
    async () => {
      if (!publicKey) return 0

      try {
        const lamports = await connection.getBalance(publicKey)
        return lamports / LAMPORTS_PER_SOL
      } catch (err) {
        console.error("[v0] Failed to fetch balance:", err)
        // Return 0 instead of throwing to prevent UI breaks
        // The error will still be captured by SWR's error state
        throw err
      }
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000, // Wait 5s between retries
      onError: (err) => {
        console.error("[v0] Balance fetch error:", err)
      },
    },
  )

  return {
    balance: balance || 0,
    isLoading: !error && balance === undefined,
    isError: error,
    refresh: mutate,
  }
}
