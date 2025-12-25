"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from "react-native"
import { useWallet } from "../context/WalletContext"
import { jupiterAPI } from "../context/ApiContext"

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
  statsCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  chartPlaceholder: {
    backgroundColor: "#1a1a2e",
    height: 250,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  chartText: {
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  holdingItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  holdingPercent: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  holdingValue: {
    textAlign: "right",
  },
  holdingUSD: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  holdingPercentage: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
})

export const PortfolioScreen: React.FC = () => {
  const { walletAddress } = useWallet()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!walletAddress) return
      try {
        setLoading(true)
        const data = await jupiterAPI.getPortfolio(walletAddress)
        setPortfolio(data)
      } catch (error) {
        console.error("Failed to fetch portfolio:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [walletAddress])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Value</Text>
            <Text style={styles.statValue}>${portfolio?.totalValue.toFixed(2) || "0.00"}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>24h Change</Text>
            <Text style={[styles.statValue, { color: portfolio?.change24h >= 0 ? "#10b981" : "#ef4444" }]}>
              {portfolio?.change24h >= 0 ? "+" : ""}
              {portfolio?.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>Portfolio Chart</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Holdings</Text>
      <FlatList
        scrollEnabled={false}
        data={portfolio?.holdings || []}
        keyExtractor={(item) => item.mint}
        renderItem={({ item }) => (
          <View style={styles.holdingItem}>
            <View style={styles.holdingInfo}>
              <Text style={styles.holdingSymbol}>{item.symbol}</Text>
              <Text style={styles.holdingPercent}>{item.allocation}% allocation</Text>
            </View>
            <View style={styles.holdingValue}>
              <Text style={styles.holdingUSD}>${item.value.toFixed(2)}</Text>
              <Text style={styles.holdingPercentage}>
                {item.percentChange >= 0 ? "+" : ""}
                {item.percentChange.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  )
}
