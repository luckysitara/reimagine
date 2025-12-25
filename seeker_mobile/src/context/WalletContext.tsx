"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as MobileWalletAdapterClient from "@solana-mobile/mobile-wallet-adapter-client"

interface WalletContextType {
  walletAddress: string | null
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (transaction: any) => Promise<any>
  signAndSendTransaction: (transaction: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const cachedAuth = await AsyncStorage.getItem("mwa_auth")
        if (cachedAuth) {
          const auth = JSON.parse(cachedAuth)
          setWalletAddress(auth.publicKey)
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Failed to restore wallet:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeWallet()
  }, [])

  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      const client = new MobileWalletAdapterClient.DefaultWalletAdapterClient()

      const result = await client.transact(async (wallet) => {
        const authResult = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: {
            uri: "https://solana-reimagine.vercel.app",
            icon: "https://solana-reimagine.vercel.app/icon.svg",
            name: "Seeker Mobile",
          },
        })

        const authData = {
          publicKey: authResult.publicKey.toBase58(),
          authToken: authResult.authToken,
        }
        await AsyncStorage.setItem("mwa_auth", JSON.stringify(authData))

        setWalletAddress(authResult.publicKey.toBase58())
        setIsConnected(true)
        return authResult
      })
    } catch (error) {
      console.error("Wallet connection failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("mwa_auth")
      setWalletAddress(null)
      setIsConnected(false)
    } catch (error) {
      console.error("Disconnection failed:", error)
    }
  }, [])

  const signTransaction = useCallback(
    async (transaction: any) => {
      if (!isConnected) throw new Error("Wallet not connected")
      const client = new MobileWalletAdapterClient.DefaultWalletAdapterClient()
      return client.transact((wallet) => wallet.signTransactions([transaction]))
    },
    [isConnected],
  )

  const signAndSendTransaction = useCallback(
    async (transaction: any) => {
      if (!isConnected) throw new Error("Wallet not connected")
      const client = new MobileWalletAdapterClient.DefaultWalletAdapterClient()
      return client.transact((wallet) => wallet.signAndSendTransactions([transaction]))
    },
    [isConnected],
  )

  return (
    <WalletContext.Provider
      value={{ walletAddress, isConnected, isLoading, connect, disconnect, signTransaction, signAndSendTransaction }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
