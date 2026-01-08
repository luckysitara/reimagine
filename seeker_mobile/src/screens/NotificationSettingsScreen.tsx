"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

interface NotificationPreferences {
  orderAlerts: boolean
  priceAlerts: boolean
  recommendations: boolean
  enabled: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderAlerts: true,
  priceAlerts: true,
  recommendations: true,
  enabled: true,
}

const NOTIFICATION_STORAGE_KEY = "@reimagine_notifications"

export function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  useFocusEffect(
    React.useCallback(() => {
      loadPreferences()
    }, []),
  )

  const loadPreferences = async () => {
    try {
      // In a real app, use AsyncStorage or device-specific notification API
      // For now, use in-memory state
      setIsLoading(false)
    } catch (error) {
      console.log("[v0] Failed to load notification preferences:", error)
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    // Save to AsyncStorage in real implementation
  }

  const handleEnableNotifications = () => {
    // In real Seeker app, request native Android notification permissions
    // using react-native-permissions
    setHasPermission(true)
    handlePreferenceChange("enabled", true)
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>Manage how you receive alerts</Text>
      </View>

      {!hasPermission && (
        <View style={styles.card}>
          <View style={styles.enableContainer}>
            <Text style={styles.enableTitle}>Enable Notifications</Text>
            <Text style={styles.enableDescription}>
              Get alerts for order fills, price targets, and AI recommendations
            </Text>
            <View
              style={[styles.button, { backgroundColor: "#3B82F6", marginTop: 16 }]}
              onTouchEnd={handleEnableNotifications}
            >
              <Text style={styles.buttonText}>Enable Notifications</Text>
            </View>
          </View>
        </View>
      )}

      {hasPermission && (
        <>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Order Alerts</Text>
                <Text style={styles.settingDescription}>Get notified when your limit orders fill</Text>
              </View>
              <Switch
                value={preferences.orderAlerts}
                onValueChange={(value) => handlePreferenceChange("orderAlerts", value)}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={preferences.orderAlerts ? "#3B82F6" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Price Alerts</Text>
                <Text style={styles.settingDescription}>Get notified when tokens reach target prices</Text>
              </View>
              <Switch
                value={preferences.priceAlerts}
                onValueChange={(value) => handlePreferenceChange("priceAlerts", value)}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={preferences.priceAlerts ? "#3B82F6" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>AI Recommendations</Text>
                <Text style={styles.settingDescription}>Get notified of trading opportunities and recommendations</Text>
              </View>
              <Switch
                value={preferences.recommendations}
                onValueChange={(value) => handlePreferenceChange("recommendations", value)}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={preferences.recommendations ? "#3B82F6" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={[styles.card, styles.successCard]}>
            <Text style={styles.successText}>✓ Ready to receive notifications</Text>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  enableContainer: {
    flex: 1,
  },
  enableTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  enableDescription: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
  },
  successCard: {
    backgroundColor: "#1a4d2e",
    borderColor: "#2d9e4f",
  },
  successText: {
    fontSize: 14,
    color: "#4ade80",
    fontWeight: "500",
  },
})
