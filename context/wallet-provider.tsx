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
    if (typeof window !== "undefined") {
      // Client-side: use the proxy with full URL
      const proxyEndpoint = `${window.location.origin}/api/solana/rpc`
      console.log("[v0] Using secure Helius RPC proxy for wallet operations")
      return proxyEndpoint
    }

    // Server-side/build-time: use a valid placeholder URL that will be replaced
    // This prevents the "Endpoint URL must start with http: or https:" error during build
    return "https://api.mainnet-beta.solana.com"
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    [],
  )

  const onError = (error: any) => {
    console.error("[v0] Wallet error:", error)
    // Don't show confusing errors to users - they'll see specific messages when they try to connect
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
