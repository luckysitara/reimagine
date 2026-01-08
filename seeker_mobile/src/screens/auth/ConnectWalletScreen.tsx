"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from "react-native"
import { useWallet } from "../../context/WalletContext"
import { AlertCircle } from "react-native-vector-icons/MaterialCommunityIcons"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "space-between",
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 20,
  },
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
    marginRight: 12,
    marginTop: 7,
  },
  featureText: {
    fontSize: 14,
    color: "#d1d5db",
    flex: 1,
  },
  connectButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#7f1d1d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  errorText: {
    color: "#fca5a5",
    marginLeft: 12,
    flex: 1,
    fontSize: 12,
  },
})

export const ConnectWalletScreen: React.FC = () => {
  const { connect, isLoading } = useWallet()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setError(null)
      await connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View />
      <View style={styles.content}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Seeker Mobile</Text>
        <Text style={styles.subtitle}>Your AI-powered Solana DeFi trading companion on Solana Seeker devices</Text>

        <View style={styles.features}>
          {[
            "Trade any token instantly with Jupiter",
            "Manage limit orders and DCA strategies",
            "View your portfolio analytics",
            "Use AI Copilot for natural language commands",
            "Secure wallet signing via Mobile Wallet Adapter",
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <TouchableOpacity
          style={[styles.connectButton, isLoading && { opacity: 0.7 }]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
