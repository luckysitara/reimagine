"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native"
import { useWallet } from "../context/WalletContext"
import { jupiterAPI } from "../context/ApiContext"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 16,
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
  input: {
    backgroundColor: "#0f0f0f",
    color: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    fontSize: 14,
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
  createButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  ordersContainer: {
    marginTop: 24,
  },
  ordersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  orderItem: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  orderPair: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  orderDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  orderValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
})

export const LimitOrdersScreen: React.FC = () => {
  const { walletAddress } = useWallet()
  const [inputToken, setInputToken] = useState("")
  const [outputToken, setOutputToken] = useState("")
  const [amount, setAmount] = useState("")
  const [triggerPrice, setTriggerPrice] = useState("")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!walletAddress) return
      try {
        const data = await jupiterAPI.getLimitOrders(walletAddress)
        setOrders(data.orders || [])
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      }
    }
    fetchOrders()
  }, [walletAddress])

  const handleCreateOrder = async () => {
    if (!inputToken || !outputToken || !amount || !triggerPrice) {
      alert("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      const response = await jupiterAPI.createLimitOrder({
        walletAddress,
        inputToken,
        outputToken,
        amount,
        triggerPrice,
      })

      if (response.success) {
        setInputToken("")
        setOutputToken("")
        setAmount("")
        setTriggerPrice("")
        setShowModal(false)
        // Refresh orders
        const data = await jupiterAPI.getLimitOrders(walletAddress)
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      alert("Failed to create limit order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
        <Text style={styles.createButtonText}>+ Create Limit Order</Text>
      </TouchableOpacity>

      {orders.length > 0 && (
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>Your Orders</Text>
          <FlatList
            scrollEnabled={false}
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <Text style={styles.orderPair}>
                  {item.inputToken} → {item.outputToken}
                </Text>
                <View style={styles.orderDetail}>
                  <Text style={styles.orderLabel}>Amount</Text>
                  <Text style={styles.orderValue}>
                    {item.amount} {item.inputToken}
                  </Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.orderLabel}>Trigger Price</Text>
                  <Text style={styles.orderValue}>${item.triggerPrice}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.orderLabel}>Status</Text>
                  <Text style={[styles.orderValue, { color: item.status === "active" ? "#10b981" : "#9ca3af" }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <Modal visible={showModal} animationType="slide" transparent={false}>
        <ScrollView style={[styles.container, { backgroundColor: "#0f0f0f" }]}>
          <View style={styles.card}>
            <Text style={styles.label}>Input Token</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SOL, USDC"
              placeholderTextColor="#6b7280"
              value={inputToken}
              onChangeText={setInputToken}
            />

            <Text style={styles.label}>Output Token</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SOL, USDC"
              placeholderTextColor="#6b7280"
              value={outputToken}
              onChangeText={setOutputToken}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount to swap"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Trigger Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Price trigger"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              value={triggerPrice}
              onChangeText={setTriggerPrice}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && { opacity: 0.7 }]}
            onPress={handleCreateOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create Order</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowModal(false)} style={{ paddingVertical: 16 }}>
            <Text style={{ color: "#9ca3af", textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  )
}
