"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import Icon from "react-native-vector-icons/Feather"
import { useWallet } from "../context/WalletContext"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import axios from "axios"

interface TokenBalance {
  mint: string
  symbol: string
  amount: number
  decimals: number
  price: number
}

const DashboardScreen = () => {
  const { selectedAccount, balance, disconnect } = useWallet()
  const [tokens, setTokens] = useState<TokenBalance[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connection] = useState(() => new Connection(clusterApiUrl("mainnet-beta"), "confirmed"))

  const fetchPortfolio = async () => {
    if (!selectedAccount) return

    setLoading(true)
    try {
      // Fetch SOL balance
      const solBalance = await connection.getBalance(selectedAccount)
      const solPrice = await fetchSolPrice()

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(selectedAccount, {
        programId: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfփhqreQwQnLYApT"),
      })

      const solValue = (solBalance / 1e9) * solPrice
      setTotalValue(solValue)

      // Parse token data
      const tokenList: TokenBalance[] = [
        {
          mint: "SOL",
          symbol: "SOL",
          amount: solBalance / 1e9,
          decimals: 9,
          price: solPrice,
        },
      ]

      setTokens(tokenList)
    } catch (error) {
      console.error("Error fetching portfolio:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSolPrice = async () => {
    try {
      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
      return response.data.solana.usd
    } catch {
      return 0
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [selectedAccount])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPortfolio()
    setRefreshing(false)
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  if (loading && tokens.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>${totalValue.toFixed(2)}</Text>

        <View style={styles.accountInfo}>
          <Icon name="key" size={14} color="#94a3b8" />
          <Text style={styles.accountText}>{selectedAccount?.toString().slice(0, 8)}...</Text>
        </View>

        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Icon name="log-out" size={16} color="#fff" />
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Tokens List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Assets</Text>
        {tokens.map((token, index) => (
          <TokenItem key={index} token={token} />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionButton icon="arrow-right-left" label="Swap" />
          <QuickActionButton icon="trending-up" label="Limit Order" />
          <QuickActionButton icon="zap" label="Copilot" />
        </View>
      </View>
    </ScrollView>
  )
}

const TokenItem = ({ token }: { token: TokenBalance }) => (
  <View style={styles.tokenItem}>
    <View style={styles.tokenInfo}>
      <View style={styles.tokenIconContainer}>
        <Text style={styles.tokenIcon}>{token.symbol[0]}</Text>
      </View>
      <View style={styles.tokenDetails}>
        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        <Text style={styles.tokenAmount}>{token.amount.toFixed(4)}</Text>
      </View>
    </View>
    <View style={styles.tokenPrice}>
      <Text style={styles.tokenValue}>${(token.amount * token.price).toFixed(2)}</Text>
      <Text style={styles.tokenPriceText}>${token.price.toFixed(2)}</Text>
    </View>
  </View>
)

const QuickActionButton = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={styles.actionButton}>
    <Icon name={icon} size={24} color="#3b82f6" />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  balanceCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderColor: "#334155",
    borderWidth: 1,
  },
  balanceLabel: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 16,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  accountText: {
    color: "#64748b",
    fontSize: 12,
    marginLeft: 6,
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  disconnectText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  tokenItem: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderColor: "#334155",
    borderWidth: 1,
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tokenIcon: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "700",
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  tokenAmount: {
    color: "#94a3b8",
    fontSize: 12,
  },
  tokenPrice: {
    alignItems: "flex-end",
  },
  tokenValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  tokenPriceText: {
    color: "#64748b",
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    borderColor: "#334155",
    borderWidth: 1,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
})

export default DashboardScreen
