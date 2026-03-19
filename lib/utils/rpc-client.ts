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
      // The result can be a number (lamports) or an object { context: { ... }, value: number }
      const lamports = (typeof result === "object" && result !== null && "value" in result)
        ? result.value
        : result

      // Ensure we return a number, not a string or undefined
      const balance = typeof lamports === "string" ? Number.parseInt(lamports, 10) : Number(lamports)
      if (Number.isNaN(balance)) {
        console.warn("[v0] Invalid balance returned:", result, "for address:", address)
        return 0
      }
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
    const result = await this.request("getAccountInfo", [address, { encoding: "jsonParsed" }])
    return result && typeof result === "object" && "value" in result ? result.value : result
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
  async confirmTransaction(
    strategy: string | { signature: string; blockhash: string; lastValidBlockHeight: number },
  ): Promise<any> {
    const signature = typeof strategy === "string" ? strategy : strategy.signature
    
    // Poll for confirmation since there's no direct RPC 'confirmTransaction'
    let status = null
    const start = Date.now()
    const timeout = 60000 // 60 seconds

    while (Date.now() - start < timeout) {
      const result = await this.request("getSignatureStatuses", [[signature], { searchTransactionHistory: true }])
      status = result && result.value ? result.value[0] : null

      if (status && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) {
        return status
      }
      
      if (status && status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`)
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error("Transaction confirmation timeout")
  }

  /**
   * Get latest blockhash
   */
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    const result = await this.request("getLatestBlockhash", [{ commitment: "finalized" }])
    return result && typeof result === "object" && "value" in result ? result.value : result
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
