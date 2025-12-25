import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ActivityIndicator, View } from "react-native"
import { BottomTabNavigator } from "./navigation/BottomTabNavigator"
import { WalletProvider, useWallet } from "./context/WalletContext"
import { ConnectWalletScreen } from "./screens/auth/ConnectWalletScreen"

const AppContent: React.FC = () => {
  const { isConnected, isLoading } = useWallet()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return isConnected ? <BottomTabNavigator /> : <ConnectWalletScreen />
}

export const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WalletProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </WalletProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
