"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import Icon from "react-native-vector-icons/Feather"

const LimitOrdersScreen = () => {
  const [token, setToken] = useState("SOL")
  const [targetPrice, setTargetPrice] = useState("")
  const [amount, setAmount] = useState("")
  const [orders, setOrders] = useState<any[]>([])

  const handleCreateOrder = () => {
    if (!targetPrice || !amount) {
      Alert.alert("Error", "Please enter all fields")
      return
    }

    const newOrder = {
      id: Date.now(),
      token,
      targetPrice,
      amount,
      createdAt: new Date().toLocaleDateString(),
    }

    setOrders([...orders, newOrder])
    setToken("SOL")
    setTargetPrice("")
    setAmount("")
    Alert.alert("Success", "Limit order created")
  }

  const handleCancelOrder = (id: number) => {
    setOrders(orders.filter((order) => order.id !== id))
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Create Order Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create Limit Order</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Token</Text>
            <View style={styles.tokenInput}>
              <Text style={styles.tokenText}>{token}</Text>
              <Icon name="chevron-down" size={20} color="#3b82f6" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Target Price</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Order</Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {orders.length > 0 && (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderToken}>{order.token}</Text>
                  <Text style={styles.orderDetails}>
                    {order.amount} @ ${order.targetPrice}
                  </Text>
                  <Text style={styles.orderDate}>{order.createdAt}</Text>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelOrder(order.id)}>
                  <Icon name="x" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.empty}>
            <Icon name="inbox" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No active orders</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderColor: "#334155",
    borderWidth: 1,
  },
  formTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  tokenInput: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: "#334155",
    borderWidth: 1,
  },
  tokenText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    borderColor: "#334155",
    borderWidth: 1,
  },
  createButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  ordersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  orderItem: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderToken: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  orderDetails: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4,
  },
  orderDate: {
    color: "#64748b",
    fontSize: 11,
  },
  cancelButton: {
    padding: 8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 12,
  },
})

export default LimitOrdersScreen
