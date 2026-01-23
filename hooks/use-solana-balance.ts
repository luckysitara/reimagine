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
        const balanceLamports = await connection.getBalance(publicKey)
        const balanceSOL = balanceLamports / LAMPORTS_PER_SOL
        console.log("[v0] Balance fetched via Solana connection:", balanceSOL, "SOL from", balanceLamports, "lamports")
        return balanceSOL
      } catch (err) {
        console.error("[v0] Failed to fetch balance:", err)
        throw err
      }
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      errorRetryCount: 5, // Increased retries
      errorRetryInterval: 2000, // 2s between retries (faster than before)
      dedupingInterval: 2000, // Dedupe requests within 2s
      focusThrottleInterval: 5000, // Throttle focus refetch
      onError: (err) => {
        console.warn("[v0] Balance fetch error (will retry):", err.message)
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
