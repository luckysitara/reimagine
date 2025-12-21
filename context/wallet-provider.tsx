"use client"

import type React from "react"
import { useMemo } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare"
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"

import "@solana/wallet-adapter-react-ui/styles.css"

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet

  const endpoint = useMemo(() => {
    const heliusEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL

    if (!heliusEndpoint) {
      console.error("[v0] NEXT_PUBLIC_HELIUS_RPC_URL not configured! Please set the environment variable.")
      throw new Error("NEXT_PUBLIC_HELIUS_RPC_URL environment variable is required")
    }

    console.log("[v0] Using Helius RPC for wallet operations")
    return heliusEndpoint
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
