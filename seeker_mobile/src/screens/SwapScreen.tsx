"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from "react-native"
import { useWallet } from "../context/WalletContext"
import { jupiterAPI } from "../context/ApiContext"

interface Token {
  mint: string
  symbol: string
  name: string
  decimals: number
  balance: number
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputSection: {
    marginBottom: 12,
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    marginBottom: 12,
  },
  tokenSelectorText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0f0f0f",
    color: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    fontSize: 14,
  },
  quoteInfo: {
    backgroundColor: "#0f0f0f",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    marginVertical: 16,
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quoteLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  quoteValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  swapButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  swapButtonDisabled: {
    backgroundColor: "#4b5563",
    opacity: 0.5,
  },
  swapButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  searchInput: {
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
})

export const SwapScreen: React.FC = () => {
  const { walletAddress } = useWallet()
  const [inputToken, setInputToken] = useState<Token | null>(null)
  const [outputToken, setOutputToken] = useState<Token | null>(null)
  const [inputAmount, setInputAmount] = useState("")
  const [outputAmount, setOutputAmount] = useState("")
  const [tokens, setTokens] = useState<Token[]>([])
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [selectingFor, setSelectingFor] = useState<"input" | "output">("input")

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const data = await jupiterAPI.getTokens()
        setTokens(data)
        if (data.length > 0) setInputToken(data[0])
        if (data.length > 1) setOutputToken(data[1])
      } catch (error) {
        console.error("Failed to fetch tokens:", error)
      }
    }
    fetchTokens()
  }, [])

  const fetchQuote = async (amount: string) => {
    if (!inputToken || !outputToken || !amount) return

    try {
      setLoading(true)
      const data = await jupiterAPI.getQuote(
        inputToken.mint,
        outputToken.mint,
        Number.parseFloat(amount) * Math.pow(10, inputToken.decimals),
      )
      setQuote(data)
      setOutputAmount((data.outAmount / Math.pow(10, outputToken.decimals)).toString())
    } catch (error) {
      console.error("Failed to fetch quote:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote(inputAmount)
  }, [inputAmount, inputToken, outputToken])

  const handleSwap = async () => {
    if (!inputToken || !outputToken || !quote) return

    try {
      setLoading(true)
      const response = await jupiterAPI.executeSwap({
        walletAddress,
        inputToken: inputToken.mint,
        outputToken: outputToken.mint,
        amount: inputAmount,
        quote: quote,
      })

      if (response.success) {
        setInputAmount("")
        setOutputAmount("")
      }
    } catch (error) {
      console.error("Swap failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>You Pay</Text>
        <TouchableOpacity
          style={styles.tokenSelector}
          onPress={() => {
            setSelectingFor("input")
            setShowTokenModal(true)
          }}
        >
          <Text style={styles.tokenSelectorText}>{inputToken?.symbol || "Select Token"}</Text>
          <Text style={{ color: "#6b7280" }}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
          value={inputAmount}
          onChangeText={setInputAmount}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>You Receive</Text>
        <TouchableOpacity
          style={styles.tokenSelector}
          onPress={() => {
            setSelectingFor("output")
            setShowTokenModal(true)
          }}
        >
          <Text style={styles.tokenSelectorText}>{outputToken?.symbol || "Select Token"}</Text>
          <Text style={{ color: "#6b7280" }}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Output amount"
          placeholderTextColor="#6b7280"
          value={outputAmount}
          editable={false}
        />
      </View>

      {quote && (
        <View style={styles.quoteInfo}>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Exchange Rate</Text>
            <Text style={styles.quoteValue}>
              1 {inputToken?.symbol} = {quote.priceImpactPct}% impact
            </Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Platform Fee</Text>
            <Text style={styles.quoteValue}>{quote.platformFee || "0.00"}%</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.swapButton, (!quote || loading) && styles.swapButtonDisabled]}
        onPress={handleSwap}
        disabled={!quote || loading}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.swapButtonText}>Swap Now</Text>}
      </TouchableOpacity>

      <Modal visible={showTokenModal} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
          <TextInput style={styles.searchInput} placeholder="Search tokens..." placeholderTextColor="#6b7280" />
          <FlatList
            data={tokens}
            keyExtractor={(item) => item.mint}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (selectingFor === "input") setInputToken(item)
                  else setOutputToken(item)
                  setShowTokenModal(false)
                }}
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" }}
              >
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>{item.symbol}</Text>
                <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  )
}
