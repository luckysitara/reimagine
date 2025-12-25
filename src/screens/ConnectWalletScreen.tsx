"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/Feather"
import { useWallet } from "../context/WalletContext"

const ConnectWalletScreen = () => {
  const { connect } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    try {
      await connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="zap" size={80} color="#3b82f6" />
        </View>

        <Text style={styles.title}>reimagine</Text>
        <Text style={styles.subtitle}>AI-Powered DeFi Trading on Solana</Text>

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="wallet" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.features}>
          <FeatureItem icon="arrow-right-left" title="Token Swap" description="Instant trades via Jupiter" />
          <FeatureItem icon="bar-chart-2" title="Portfolio" description="Track your assets" />
          <FeatureItem icon="trending-up" title="Limit Orders" description="Set price targets" />
          <FeatureItem icon="zap" title="AI Copilot" description="Smart trading assistant" />
        </View>
      </View>
    </View>
  )
}

const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={24} color="#3b82f6" />
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 16,
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 32,
    textAlign: "center",
  },
  connectButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    minWidth: 200,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#7f1d1d",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    minWidth: "100%",
  },
  errorText: {
    color: "#fca5a5",
    marginLeft: 8,
    flex: 1,
  },
  features: {
    width: "100%",
    marginTop: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomColor: "#1e293b",
    borderBottomWidth: 1,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDescription: {
    color: "#64748b",
    fontSize: 12,
  },
})

export default ConnectWalletScreen
