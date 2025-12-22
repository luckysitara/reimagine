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
   * Make a JSON-RPC request to Solana via our secure proxy
   */
  async request(method: string, params: any[] = []): Promise<any> {
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
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "RPC request failed")
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || "RPC error")
    }

    return data.result
  }

  /**
   * Get balance for a wallet address
   */
  async getBalance(address: string): Promise<number> {
    return this.request("getBalance", [address])
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
