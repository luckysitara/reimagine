import axios, { type AxiosInstance } from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://solana-reimagine.vercel.app/api"

interface ApiContextType {
  axiosInstance: AxiosInstance
}

export const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

export const jupiterAPI = {
  // Quote endpoint
  getQuote: async (inputMint: string, outputMint: string, amount: number) => {
    const response = await apiInstance.get("/jupiter/quote", {
      params: { inputMint, outputMint, amount },
    })
    return response.data
  },

  // Swap endpoint
  executeSwap: async (payload: any) => {
    const response = await apiInstance.post("/jupiter/swap", payload)
    return response.data
  },

  // Token list
  getTokens: async () => {
    const response = await apiInstance.get("/jupiter/tokens")
    return response.data
  },

  // Search tokens
  searchTokens: async (query: string) => {
    const response = await apiInstance.get("/jupiter/search", {
      params: { q: query },
    })
    return response.data
  },

  // Limit orders
  createLimitOrder: async (payload: any) => {
    const response = await apiInstance.post("/jupiter/limit-orders", payload)
    return response.data
  },

  getLimitOrders: async (walletAddress: string) => {
    const response = await apiInstance.get("/jupiter/limit-orders", {
      params: { wallet: walletAddress },
    })
    return response.data
  },

  // Portfolio
  getPortfolio: async (walletAddress: string) => {
    const response = await apiInstance.get("/jupiter/portfolio", {
      params: { wallet: walletAddress },
    })
    return response.data
  },

  // Price data
  getTokenPrice: async (mint: string) => {
    const response = await apiInstance.get("/jupiter/price", {
      params: { tokens: mint },
    })
    return response.data
  },

  // DCA
  createDCA: async (payload: any) => {
    const response = await apiInstance.post("/jupiter/dca", payload)
    return response.data
  },

  // Send tokens
  sendToken: async (payload: any) => {
    const response = await apiInstance.post("/jupiter/send", payload)
    return response.data
  },
}

export const agentAPI = {
  chat: async (message: string, walletAddress: string) => {
    const response = await apiInstance.post("/agent", {
      message,
      walletAddress,
    })
    return response.data
  },

  streamChat: async (message: string, walletAddress: string) => {
    const response = await apiInstance.post("/agent", {
      message,
      walletAddress,
      stream: true,
    })
    return response
  },
}
