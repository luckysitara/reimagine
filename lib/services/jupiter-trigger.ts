import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface CreateLimitOrderParams {
  inputMint: string
  outputMint: string
  maker: string
  payer: string
  inAmount: string
  outAmount: string
  expiredAt?: number
}

export interface LimitOrder {
  publicKey: string
  account: {
    maker: string
    inputMint: string
    outputMint: string
    makingAmount: string
    takingAmount: string
    expiredAt: number
    state: "created" | "filled" | "cancelled" | "expired"
  }
}

export async function createLimitOrder(params: CreateLimitOrderParams): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.trigger}/createOrder`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      maker: params.maker,
      payer: params.payer,
      makingAmount: params.inAmount,
      takingAmount: params.outAmount,
      expiredAt: params.expiredAt,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(error.error || `Limit order creation failed: ${response.statusText}`)
    } catch {
      throw new Error(`Limit order creation failed: ${response.statusText} - ${text}`)
    }
  }

  return await response.json()
}

export async function cancelLimitOrder(orderPubkey: string, maker: string): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.trigger}/cancelOrder`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ maker, order: orderPubkey }),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(error.error || `Cancel order failed: ${response.statusText}`)
    } catch {
      throw new Error(`Cancel order failed: ${response.statusText} - ${text}`)
    }
  }

  return await response.json()
}

export async function getOpenOrders(wallet: string): Promise<LimitOrder[]> {
  try {
    const response = await fetch(`${JUPITER_API_URLS.trigger}/getTriggerOrders?user=${wallet}&orderStatus=active`, {
      headers: getJupiterHeaders(),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || error.message || `Failed to fetch open orders: ${response.statusText}`)
      }
      const text = await response.text()
      throw new Error(`Failed to fetch open orders: ${response.statusText} - ${text}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid response format from Jupiter API")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Get open orders error:", error)
    return []
  }
}

export async function getOrderHistory(wallet: string, page = 1, limit = 20): Promise<LimitOrder[]> {
  const response = await fetch(`${JUPITER_API_URLS.trigger}/getTriggerOrders?user=${wallet}&orderStatus=history`, {
    headers: getJupiterHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch order history: ${response.statusText}`)
  }

  return await response.json()
}
