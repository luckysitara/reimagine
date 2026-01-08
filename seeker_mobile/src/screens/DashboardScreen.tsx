"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from "react-native"
import { useWallet } from "../context/WalletContext"
import { jupiterAPI } from "../context/ApiContext"

interface Token {
  mint: string
  symbol: string
  name: string
  decimals: number
  balance: number
  usdValue: number
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  balanceCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  balanceSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  tokenItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    alignItems: "center",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  tokenBalance: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  tokenValue: {
    textAlign: "right",
  },
  tokenValueAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  tokenValueUSD: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
})

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { walletAddress } = useWallet()
  const [tokens, setTokens] = useState<Token[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchPortfolio = async () => {
    if (!walletAddress) return
    try {
      setLoading(true)
      const data = await jupiterAPI.getPortfolio(walletAddress)
      setTokens(data.tokens || [])
      setTotalValue(data.totalUSDValue || 0)
    } catch (error) {
      console.error("Failed to fetch portfolio:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [walletAddress])

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPortfolio} />}
    >
      <View style={styles.header}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalValue.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>{tokens.length} tokens held</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Swap")}>
            <Text style={styles.actionButtonText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Copilot")}>
            <Text style={styles.actionButtonText}>Copilot</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Assets</Text>
      <FlatList
        scrollEnabled={false}
        data={tokens}
        keyExtractor={(item) => item.mint}
        renderItem={({ item }) => (
          <View style={styles.tokenItem}>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{item.symbol}</Text>
              <Text style={styles.tokenBalance}>
                {item.balance.toFixed(4)} {item.symbol}
              </Text>
            </View>
            <View style={styles.tokenValue}>
              <Text style={styles.tokenValueAmount}>${item.usdValue.toFixed(2)}</Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  )
}
