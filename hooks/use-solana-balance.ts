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
      const lamports = await connection.getBalance(publicKey)
      return lamports / LAMPORTS_PER_SOL
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    },
  )

  return {
    balance: balance || 0,
    isLoading: !error && balance === undefined,
    isError: error,
    refresh: mutate,
  }
}
