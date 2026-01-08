"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { ConnectionScreen } from "./connection-screen"
import type React from "react"

interface ProtectedAppProps {
  children: React.ReactNode
}

export function ProtectedApp({ children }: ProtectedAppProps) {
  const { connected } = useWallet()

  if (!connected) {
    return <ConnectionScreen />
  }

  return <>{children}</>
}
