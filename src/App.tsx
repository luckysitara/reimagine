import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Icon from "react-native-vector-icons/Feather"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { WalletProvider } from "./context/WalletContext"
import DashboardScreen from "./screens/DashboardScreen"
import TokenSwapScreen from "./screens/TokenSwapScreen"
import PortfolioScreen from "./screens/PortfolioScreen"
import CopilotScreen from "./screens/CopilotScreen"
import SettingsScreen from "./screens/SettingsScreen"
import ConnectWalletScreen from "./screens/ConnectWalletScreen"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "reimagine" }} />
  </Stack.Navigator>
)

const SwapStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen name="Swap" component={TokenSwapScreen} options={{ title: "Token Swap" }} />
  </Stack.Navigator>
)

const PortfolioStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: "Portfolio" }} />
  </Stack.Navigator>
)

const CopilotStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen name="Copilot" component={CopilotScreen} options={{ title: "AI Copilot" }} />
  </Stack.Navigator>
)

const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "#0f172a" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
  </Stack.Navigator>
)

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#0f172a",
        borderTopColor: "#1e293b",
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "#64748b",
      tabBarIcon: ({ color, size }) => {
        let iconName = "home"
        if (route.name === "DashboardStack") iconName = "home"
        else if (route.name === "SwapStack") iconName = "arrow-right-left"
        else if (route.name === "PortfolioStack") iconName = "bar-chart-2"
        else if (route.name === "CopilotStack") iconName = "zap"
        else if (route.name === "SettingsStack") iconName = "settings"

        return <Icon name={iconName} size={size} color={color} />
      },
      tabBarLabel: route.name
        .replace("Stack", "")
        .replace(/([A-Z])/g, " $1")
        .trim(),
    })}
  >
    <Tab.Screen name="DashboardStack" component={DashboardStack} options={{ title: "Home" }} />
    <Tab.Screen name="SwapStack" component={SwapStack} options={{ title: "Swap" }} />
    <Tab.Screen name="PortfolioStack" component={PortfolioStack} options={{ title: "Portfolio" }} />
    <Tab.Screen name="CopilotStack" component={CopilotStack} options={{ title: "Copilot" }} />
    <Tab.Screen name="SettingsStack" component={SettingsStack} options={{ title: "Settings" }} />
  </Tab.Navigator>
)

const RootNavigator = ({ isConnected }: { isConnected: boolean }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
    {!isConnected ? (
      <Stack.Screen name="ConnectWallet" component={ConnectWalletScreen} options={{ animationEnabled: false }} />
    ) : (
      <Stack.Screen name="MainApp" component={MainTabs} options={{ animationEnabled: false }} />
    )}
  </Stack.Navigator>
)

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const AppContent = () => {
  const { isConnected } = require("./context/WalletContext").useWallet()

  return (
    <NavigationContainer>
      <RootNavigator isConnected={isConnected} />
    </NavigationContainer>
  )
}

export default App
