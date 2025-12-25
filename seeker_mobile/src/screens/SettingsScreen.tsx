"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native"
import { useWallet } from "../context/WalletContext"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  walletCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2d3748",
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "monospace",
    marginBottom: 12,
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disconnectButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginTop: 40,
  },
})

export const SettingsScreen: React.FC = () => {
  const { walletAddress, disconnect } = useWallet()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [biometrics, setBiometrics] = useState(true)

  const handleDisconnect = () => {
    Alert.alert("Disconnect Wallet", "Are you sure you want to disconnect?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        onPress: async () => {
          await disconnect()
        },
        style: "destructive",
      },
    ])
  }

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Connected Wallet</Text>
          <Text style={styles.walletAddress}>{walletAddress ? shortenAddress(walletAddress) : "Not connected"}</Text>
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={[styles.settingItem]}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: "#2d3748", true: "#3b82f6" }} />
          </View>
          <View style={[styles.settingItem]}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#2d3748", true: "#3b82f6" }}
            />
          </View>
          <View style={[styles.settingItem, styles.settingItemLast]}>
            <Text style={styles.settingLabel}>Biometric Security</Text>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: "#2d3748", true: "#3b82f6" }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.card}>
          <View style={[styles.settingItem, styles.settingItemLast]}>
            <Text style={styles.settingLabel}>Network</Text>
            <Text style={{ color: "#9ca3af", fontSize: 12 }}>Mainnet</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={[styles.settingItem, styles.settingItemLast]}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={{ color: "#9ca3af", fontSize: 12 }}>1.0.0</Text>
          </View>
        </View>
      </View>

      <Text style={styles.versionText}>Seeker Mobile v1.0.0</Text>
    </ScrollView>
  )
}
