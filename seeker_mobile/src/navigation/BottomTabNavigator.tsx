import type React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { DashboardScreen } from "../screens/DashboardScreen"
import { SwapScreen } from "../screens/SwapScreen"
import { PortfolioScreen } from "../screens/PortfolioScreen"
import { CopilotScreen } from "../screens/CopilotScreen"
import { LimitOrdersScreen } from "../screens/LimitOrdersScreen"
import { SettingsScreen } from "../screens/SettingsScreen"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

const Tab = createBottomTabNavigator()

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#2d3748",
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: "#1a1a2e",
          borderBottomColor: "#2d3748",
          borderBottomWidth: 1,
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />

      <Tab.Screen
        name="Swap"
        component={SwapScreen}
        options={{
          title: "Token Swap",
          tabBarLabel: "Swap",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="swap-horizontal" size={24} color={color} />,
        }}
      />

      <Tab.Screen
        name="LimitOrders"
        component={LimitOrdersScreen}
        options={{
          title: "Limit Orders",
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-list" size={24} color={color} />,
        }}
      />

      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          title: "Portfolio",
          tabBarLabel: "Portfolio",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-pie" size={24} color={color} />,
        }}
      />

      <Tab.Screen
        name="Copilot"
        component={CopilotScreen}
        options={{
          title: "AI Copilot",
          tabBarLabel: "Copilot",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="robot" size={24} color={color} />,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
