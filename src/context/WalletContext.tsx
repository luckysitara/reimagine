"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { transact, type Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js"
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js"
import { toByteArray } from "react-native-quick-base64"

const APP_IDENTITY = {
  name: "reimagine",
  uri: "https://reimagine-defi.app",
  icon: "favicon.ico",
}

const APP_CLUSTER = "mainnet-beta"

interface WalletContextType {
  isConnected: boolean
  selectedAccount: PublicKey | null
  authToken: string | null
  balance: number | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (tx: any) => Promise<any>
  signAndSendTransaction: (tx: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<PublicKey | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [connection] = useState(() => new Connection(clusterApiUrl(APP_CLUSTER), "confirmed"))

  useEffect(() => {
    ;(async () => {
      try {
        const [cachedAuthToken, cachedBase64Address] = await Promise.all([
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("base64Address"),
        ])

        if (cachedBase64Address && cachedAuthToken) {
          const pubkeyAsByteArray = toByteArray(cachedBase64Address)
          const cachedPubkey = new PublicKey(pubkeyAsByteArray)
          setSelectedAccount(cachedPubkey)
          setAuthToken(cachedAuthToken)
          setIsConnected(true)

          // Fetch balance
          const fetchedBalance = await connection.getBalance(cachedPubkey)
          setBalance(fetchedBalance)
        }
      } catch (error) {
        console.error("Error restoring cached authorization:", error)
      }
    })()
  }, [connection])

  const authorizeSession = useCallback(
    async (wallet: Web3MobileWallet) => {
      const authorizationResult = await (authToken
        ? wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
        : wallet.authorize({
            cluster: `solana:${APP_CLUSTER}`,
            identity: APP_IDENTITY,
          }))

      return authorizationResult
    },
    [authToken],
  )

  const connect = useCallback(async () => {
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        const authorizationResult = await authorizeSession(wallet)
        const firstAccount = authorizationResult.accounts[0]

        // Cache the authorization details
        await AsyncStorage.setItem("authToken", authorizationResult.auth_token)
        await AsyncStorage.setItem("base64Address", firstAccount.address)

        const pubkeyAsByteArray = toByteArray(firstAccount.address)
        const pubkey = new PublicKey(pubkeyAsByteArray)

        setSelectedAccount(pubkey)
        setAuthToken(authorizationResult.auth_token)
        setIsConnected(true)

        // Fetch balance
        const fetchedBalance = await connection.getBalance(pubkey)
        setBalance(fetchedBalance)
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }, [authorizeSession, connection])

  const disconnect = useCallback(async () => {
    try {
      if (authToken) {
        await transact(async (wallet: Web3MobileWallet) => {
          await wallet.deauthorize({ auth_token: authToken })
        })
      }

      await AsyncStorage.multiRemove(["authToken", "base64Address"])
      setSelectedAccount(null)
      setAuthToken(null)
      setIsConnected(false)
      setBalance(null)
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      throw error
    }
  }, [authToken])

  const signTransaction = useCallback(async (transaction: any) => {
    return await transact(async (wallet: Web3MobileWallet) => {
      const signedTxs = await wallet.signTransactions({
        transactions: [transaction],
      })
      return signedTxs[0]
    })
  }, [])

  const signAndSendTransaction = useCallback(async (transaction: any) => {
    return await transact(async (wallet: Web3MobileWallet) => {
      const transactionSignatures = await wallet.signAndSendTransactions({
        transactions: [transaction],
      })
      return transactionSignatures[0]
    })
  }, [])

  const value: WalletContextType = {
    isConnected,
    selectedAccount,
    authToken,
    balance,
    connect,
    disconnect,
    signTransaction,
    signAndSendTransaction,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
