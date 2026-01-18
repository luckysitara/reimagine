import { create } from "zustand"
import { persist } from "zustand/middleware"

interface QuickBuySettings {
  amount: number
  paymentToken: "SOL" | "USDC" | "USDT"
  paymentTokenAddress?: string
}

interface QuickBuyStore {
  settings: QuickBuySettings
  updateSettings: (settings: Partial<QuickBuySettings>) => void
  isConfigured: () => boolean
}

// Token addresses mapping
const TOKEN_ADDRESSES: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
}

export const useQuickBuyStore = create<QuickBuyStore>()(
  persist(
    (set, get) => ({
      settings: {
        amount: 100,
        paymentToken: "SOL",
        paymentTokenAddress: TOKEN_ADDRESSES.SOL,
      },
      updateSettings: (newSettings) =>
        set((state) => {
          const updated = { ...state.settings, ...newSettings }
          // Ensure token address is set based on payment token
          if (newSettings.paymentToken && !newSettings.paymentTokenAddress) {
            updated.paymentTokenAddress = TOKEN_ADDRESSES[newSettings.paymentToken]
          }
          return { settings: updated }
        }),
      isConfigured: () => {
        const { settings } = get()
        return settings.amount > 0 && settings.paymentToken && settings.paymentTokenAddress
      },
    }),
    {
      name: "quick-buy-store",
    },
  ),
)
