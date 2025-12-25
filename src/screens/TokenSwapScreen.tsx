"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from "react-native"
import Icon from "react-native-vector-icons/Feather"
import { useWallet } from "../context/WalletContext"

const TokenSwapScreen = () => {
  const { selectedAccount } = useWallet()
  const [fromToken, setFromToken] = useState("SOL")
  const [toToken, setToToken] = useState("USDC")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSwap = async () => {
    if (!fromAmount || !selectedAccount) {
      Alert.alert("Error", "Please enter an amount")
      return
    }

    setLoading(true)
    try {
      // Call the backend API to execute swap
      const response = await fetch("/api/jupiter/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMint: fromToken === "SOL" ? "11111111111111111111111111111111" : fromToken,
          outputMint: toToken === "USDC" ? "EPjFWaLb3odcccccccccccccccccccccccccccccccccc" : toToken,
          amount: Math.floor(Number.parseFloat(fromAmount) * 1e9),
          userPublicKey: selectedAccount.toString(),
        }),
      })

      const data = await response.json()
      if (data.outAmount) {
        setToAmount((Number.parseInt(data.outAmount) / 1e6).toFixed(2))
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get quote")
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteSwap = async () => {
    Alert.alert("Swap", `Swap ${fromAmount} ${fromToken} for ${toAmount} ${toToken}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => {} },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* From Token */}
        <View style={styles.section}>
          <Text style={styles.label}>You Pay</Text>
          <View style={styles.inputGroup}>
            <View style={styles.tokenSelector}>
              <Text style={styles.tokenSelectorText}>{fromToken}</Text>
              <Icon name="chevron-down" size={20} color="#3b82f6" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.balance}>Balance: 10.5 SOL</Text>
        </View>

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapButtonInner}>
            <Icon name="arrow-down" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={styles.section}>
          <Text style={styles.label}>You Receive</Text>
          <View style={styles.inputGroup}>
            <View style={styles.tokenSelector}>
              <Text style={styles.tokenSelectorText}>{toToken}</Text>
              <Icon name="chevron-down" size={20} color="#3b82f6" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={toAmount}
              editable={false}
            />
          </View>
        </View>

        {/* Quote Button */}
        {fromAmount && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSwap}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Quote</Text>}
          </TouchableOpacity>
        )}

        {/* Swap Button */}
        {toAmount && (
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleExecuteSwap}>
            <Text style={styles.buttonText}>Execute Swap</Text>
          </TouchableOpacity>
        )}

        {/* Details */}
        {toAmount && (
          <View style={styles.details}>
            <DetailRow
              label="Exchange Rate"
              value={`1 ${fromToken} = ${(Number.parseFloat(toAmount) / Number.parseFloat(fromAmount)).toFixed(2)} ${toToken}`}
            />
            <DetailRow label="Fee" value="0.25%" />
            <DetailRow
              label="Minimum Received"
              value={`${(Number.parseFloat(toAmount) * 0.99).toFixed(2)} ${toToken}`}
            />
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputGroup: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 12,
    borderRightColor: "#334155",
    borderRightWidth: 1,
  },
  tokenSelectorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 16,
  },
  balance: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 6,
  },
  swapButtonContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  swapButtonInner: {
    width: 44,
    height: 44,
    backgroundColor: "#3b82f6",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  details: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: "#334155",
    borderBottomWidth: 1,
  },
  detailLabel: {
    color: "#94a3b8",
    fontSize: 14,
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
})

export default TokenSwapScreen
