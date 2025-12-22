import { JUPITER_API_URLS, getJupiterHeaders } from "../constants/api-urls"

export interface CreateDCAParams {
  inputMint: string
  outputMint: string
  payer: string
  amount: string
  cycleFrequency: number
  numberOfOrders: number
  minOutAmountPerCycle?: string
  maxOutAmountPerCycle?: string
  startAt?: number
}

export interface DCAAccount {
  publicKey: string
  account: {
    user: string
    inputMint: string
    outputMint: string
    inDeposited: string
    inUsed: string
    inAmountPerCycle: string
    cycleFrequency: number
    nextCycleAt: number
    createdAt: number
  }
}

export async function createDCAOrder(params: CreateDCAParams): Promise<{ tx: string }> {
  const requestBody = {
    user: params.payer,
    payer: params.payer,
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    params: {
      recurringType: "time",
      amount: params.amount,
      frequency: params.cycleFrequency,
      numberOfOrders: params.numberOfOrders,
    },
  }

  console.log("[v0] Sending DCA request:", requestBody)

  const response = await fetch(`${JUPITER_API_URLS.recurring}/createOrder`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(`DCA creation failed: ${response.statusText} - ${JSON.stringify(error)}`)
    } catch {
      throw new Error(`DCA creation failed: ${response.statusText} - ${text}`)
    }
  }

  return await response.json()
}

export async function closeDCAOrder(dcaPubkey: string, user: string): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.recurring}/cancelOrder`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ user, order: dcaPubkey }),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(error.error || `Close DCA failed: ${response.statusText}`)
    } catch {
      throw new Error(`Close DCA failed: ${response.statusText} - ${text}`)
    }
  }

  return await response.json()
}

export async function withdrawDCA(dcaPubkey: string, user: string, withdrawAmount: string): Promise<{ tx: string }> {
  const response = await fetch(`${JUPITER_API_URLS.recurring}/withdraw`, {
    method: "POST",
    headers: getJupiterHeaders(),
    body: JSON.stringify({ user, order: dcaPubkey, amount: withdrawAmount }),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const error = JSON.parse(text)
      throw new Error(error.error || `Withdraw DCA failed: ${response.statusText}`)
    } catch {
      throw new Error(`Withdraw DCA failed: ${response.statusText} - ${text}`)
    }
  }

  return await response.json()
}

export async function getDCAAccounts(wallet: string): Promise<DCAAccount[]> {
  try {
    const response = await fetch(
      `${JUPITER_API_URLS.recurring}/getRecurringOrders?user=${wallet}&orderStatus=active&recurringType=time`,
      {
        headers: getJupiterHeaders(),
      },
    )

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || error.message || `Failed to fetch DCA accounts: ${response.statusText}`)
      }
      const text = await response.text()
      throw new Error(`Failed to fetch DCA accounts: ${response.statusText} - ${text}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid response format from Jupiter API")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Get DCA accounts error:", error)
    return []
  }
}
