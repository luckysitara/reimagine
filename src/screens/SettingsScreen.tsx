"use client"

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from "react-native"
import Icon from "react-native-vector-icons/Feather"
import { useWallet } from "../context/WalletContext"

const SettingsScreen = () => {
  const { disconnect } = useWallet()
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(true)

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingRow icon="bell" label="Notifications" value={notifications} onValueChange={setNotifications} />
          <SettingRow icon="moon" label="Dark Mode" value={darkMode} onValueChange={setDarkMode} />
        </View>

        {/* Network */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <SettingOption icon="globe" label="Cluster" value="Mainnet" />
          <SettingOption icon="link" label="RPC Endpoint" value="api.mainnet-beta.solana.com" />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingOption icon="package" label="Version" value="1.0.0" />
          <SettingOption icon="info" label="Build" value="Mobile-1" />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDisconnect}>
            <Icon name="log-out" size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const SettingRow = ({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: string
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLabel}>
      <Icon name={icon} size={20} color="#3b82f6" />
      <Text style={styles.settingText}>{label}</Text>
    </View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#334155", true: "#3b82f6" }} />
  </View>
)

const SettingOption = ({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLabel}>
      <Icon name={icon} size={20} color="#3b82f6" />
      <View style={styles.settingInfo}>
        <Text style={styles.settingText}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
      </View>
    </View>
    <Icon name="chevron-right" size={20} color="#64748b" />
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
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingRow: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
  },
  settingLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  settingValue: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: "#7f1d1d",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#991b1b",
    borderWidth: 1,
  },
  dangerButtonText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
})

export default SettingsScreen
