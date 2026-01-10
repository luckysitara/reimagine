import { create } from "zustand"
import { persist } from "zustand/middleware"

interface QuickBuySettings {
  amount: number
  paymentToken: "SOL" | "USDC" | "USDT"
}

interface QuickBuyStore {
  settings: QuickBuySettings
  updateSettings: (settings: Partial<QuickBuySettings>) => void
}

export const useQuickBuyStore = create<QuickBuyStore>()(
  persist(
    (set) => ({
      settings: {
        amount: 100,
        paymentToken: "SOL",
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "quick-buy-store",
    },
  ),
)
