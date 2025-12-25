import { View, Text, StyleSheet, ScrollView } from "react-native"
import Icon from "react-native-vector-icons/Feather"

const PortfolioScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Icon name="bar-chart-2" size={32} color="#3b82f6" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Portfolio Analytics</Text>
          <Text style={styles.cardDescription}>View your portfolio performance and asset allocation</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <View style={styles.placeholder}>
            <Icon name="pie-chart" size={48} color="#64748b" />
            <Text style={styles.placeholderText}>Portfolio chart coming soon</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.placeholder}>
            <Icon name="trending-up" size={48} color="#64748b" />
            <Text style={styles.placeholderText}>Performance metrics coming soon</Text>
          </View>
        </View>
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
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardDescription: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 12,
  },
})

export default PortfolioScreen
