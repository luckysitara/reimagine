/**
 * Secure RPC Client for Solana
 *
 * This client proxies all RPC requests through our API route to keep
 * the Helius API key secure on the server side. Never exposes credentials
 * to the client.
 */

export class SecureRPCClient {
  private proxyEndpoint = "/api/solana/rpc"

  /**
   * Make a JSON-RPC request to Solana via our secure proxy with retry logic
   */
  async request(method: string, params: any[] = [], retries = 3): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(this.proxyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method,
            params,
          }),
          signal: AbortSignal.timeout(50000), // 50 second timeout to match server timeout
        })

        // Handle 503 Service Unavailable - retry with backoff
        if (response.status === 503) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
          console.warn(`[v0] RPC unavailable (503), retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries})`)
          
          if (attempt < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            continue
          }
          
          lastError = new Error("RPC endpoint temporarily unavailable")
          continue
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }))
          throw new Error(error.error || `HTTP ${response.status}: RPC request failed`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message || "RPC error")
        }

        return data.result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[v0] RPC request attempt ${attempt + 1}/${retries} failed:`, lastError.message)

        // Don't retry on 400/401/403 errors (client/auth errors)
        if (lastError.message.includes("HTTP 400") || lastError.message.includes("HTTP 401") || lastError.message.includes("HTTP 403")) {
          throw lastError
        }

        // Don't retry if this was the last attempt
        if (attempt >= retries - 1) {
          break
        }

        // Wait before retry with exponential backoff
        const waitTime = Math.min(500 * Math.pow(2, attempt), 5000)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    throw lastError || new Error("RPC request failed after retries")
  }

  /**
   * Get balance for a wallet address
   */
  async getBalance(address: string): Promise<number> {
    try {
      const result = await this.request("getBalance", [address])
      
      // Handle different response formats from RPC endpoints
      let balance: number
      
      if (typeof result === "object" && result !== null && "value" in result) {
        // Handle object response with value property (some RPC endpoints return this)
        balance = typeof result.value === "string" ? Number.parseInt(result.value, 10) : Number(result.value)
      } else if (typeof result === "string") {
        // Handle string response
        balance = Number.parseInt(result, 10)
      } else {
        // Handle direct number response
        balance = Number(result)
      }
      
      if (Number.isNaN(balance)) {
        console.warn("[v0] Invalid balance returned:", result, "for address:", address)
        return 0
      }
      
      console.log("[v0] RPC balance for", address.slice(0, 8) + "...:", balance, "lamports")
      return balance
    } catch (error) {
      console.error("[v0] Error fetching balance for", address, ":", error)
      throw error
    }
  }

  /**
   * Get token accounts by owner
   */
  async getTokenAccountsByOwner(owner: string, filter: { mint?: string; programId?: string }): Promise<any> {
    return this.request("getTokenAccountsByOwner", [owner, filter, { encoding: "jsonParsed" }])
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<any> {
    return this.request("getAccountInfo", [address, { encoding: "jsonParsed" }])
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    transaction: string,
    options?: { skipPreflight?: boolean; maxRetries?: number },
  ): Promise<string> {
    return this.request("sendTransaction", [transaction, options])
  }

  /**
   * Get transaction
   */
  async getTransaction(signature: string): Promise<any> {
    return this.request("getTransaction", [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }])
  }

  /**
   * Confirm transaction
   */
  async confirmTransaction(signature: string): Promise<any> {
    return this.request("confirmTransaction", [signature, "confirmed"])
  }

  /**
   * Get latest blockhash
   */
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return this.request("getLatestBlockhash", [{ commitment: "finalized" }])
  }

  /**
   * Simulate transaction
   */
  async simulateTransaction(transaction: string): Promise<any> {
    return this.request("simulateTransaction", [transaction, { encoding: "base64" }])
  }
}

// Export singleton instance
export const secureRPCClient = new SecureRPCClient()
