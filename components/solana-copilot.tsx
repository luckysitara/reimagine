"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, AlertCircle, CheckCircle } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { secureRPCClient } from "@/lib/utils/rpc-client"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: Array<{
    toolName: string
    args: Record<string, unknown>
    result?: any
  }>
}

interface ToolCall {
  toolName: string
  args: Record<string, unknown>
  result?: any
}

const EXAMPLE_PROMPTS = [
  "Swap 1 SOL for USDC",
  "Clear all my small tokens to SOL",
  "Create limit order: buy 100 USDC of SOL at $140",
  "Set up DCA: invest 10 SOL into BONK weekly",
  "Create a new token called MyToken",
  "What's my portfolio worth?",
  "Analyze news for SOL",
]

const STORAGE_KEY = "copilot_chat_history"
const INITIAL_WELCOME = {
  id: "welcome",
  role: "assistant" as const,
  content:
    "Hello! I'm your AI DeFi assistant. I can help you swap tokens, create limit/DCA orders, launch new tokens, analyze your portfolio, monitor news, and more. What would you like to do?",
}

export function SolanaCopilot() {
  const { publicKey, signTransaction } = useWallet()
  const [autopilotMode, setAutopilotMode] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoaded, setMessagesLoaded] = useState(false)

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
            console.log("[v0] Loaded chat history:", parsed.length, "messages")
          } else {
            setMessages([INITIAL_WELCOME])
          }
        } else {
          setMessages([INITIAL_WELCOME])
        }
      } catch (error) {
        console.error("[v0] Failed to load chat history:", error)
        setMessages([INITIAL_WELCOME])
      }
      setMessagesLoaded(true)
    }

    loadChatHistory()
  }, [])

  useEffect(() => {
    if (messagesLoaded && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        console.log("[v0] Saved chat history to localStorage")
      } catch (error) {
        console.error("[v0] Failed to save chat history:", error)
      }
    }
  }, [messages, messagesLoaded])

  useEffect(() => {
    if (!publicKey) {
      setWalletBalance(null)
      return
    }

    const fetchBalance = async () => {
      try {
        if (!publicKey) {
          setWalletBalance(0)
          return
        }
        const balanceLamports = await secureRPCClient.getBalance(publicKey.toBase58())
        const balanceSOL = Number(balanceLamports) / LAMPORTS_PER_SOL
        console.log("[v0] Fetched wallet balance:", balanceSOL, "SOL from", balanceLamports, "lamports")
        setWalletBalance(Number.isNaN(balanceSOL) ? 0 : balanceSOL)
      } catch (error) {
        console.error("[v0] Failed to fetch balance:", error)
        setWalletBalance(0)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)

    return () => clearInterval(interval)
  }, [publicKey])

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return

      const container = scrollContainerRef.current
      const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50

      setShowScrollButton(!isScrolledToBottom && container.scrollHeight > container.clientHeight)
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!messagesLoaded || !scrollContainerRef.current) return

    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          }
        }, 100)
      }
    }

    scrollToBottom()
  }, [messages, messagesLoaded])

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      setShowScrollButton(false)
    }
  }, [])

  const checkBalanceForSwap = async (
    inputToken: string,
    amount: number,
  ): Promise<{ valid: boolean; message?: string }> => {
    if (!publicKey) {
      return { valid: false, message: "Please connect your wallet" }
    }

    if (walletBalance === null) {
      return { valid: false, message: "Unable to fetch wallet balance. Please try again." }
    }

    // If swapping SOL, we need the amount + gas fee
    if (inputToken.toUpperCase() === "SOL") {
      const estimatedGasSOL = 0.00025 // ~2500 lamports
      const totalNeeded = amount + estimatedGasSOL

      if (walletBalance < totalNeeded) {
        return {
          valid: false,
          message: `Insufficient balance. You have ${walletBalance.toFixed(
            3,
          )} SOL but need ${totalNeeded.toFixed(3)} SOL (${amount} + ${estimatedGasSOL} for gas)`,
        }
      }
    }

    return { valid: true }
  }

  const handleSignTransaction = async (transactionBase64: string, toolName: string) => {
    if (!signTransaction || !publicKey) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet to sign transactions",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`[v0] Signing ${toolName} transaction...`)

      const transactionBuf = Buffer.from(transactionBase64, "base64")
      const transaction = VersionedTransaction.deserialize(transactionBuf)

      const signedTransaction = await signTransaction(transaction)

      const signature = await secureRPCClient.sendTransaction(
        Buffer.from(signedTransaction.serialize()).toString("base64"),
      )

      console.log(`[v0] Transaction sent:`, signature)

      toast({
        title: "Transaction Submitted",
        description: `${toolName} transaction is being confirmed...`,
      })

      let confirmed = false
      for (let i = 0; i < 30; i++) {
        try {
          const tx = await secureRPCClient.getTransaction(signature)
          if (tx) {
            confirmed = true
            break
          }
        } catch (e) {
          // Transaction not confirmed yet
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      if (confirmed) {
        toast({
          title: "Success!",
          description: `${toolName} confirmed on-chain`,
        })
      } else {
        toast({
          title: "Transaction Pending",
          description: `${toolName} submitted. Please check Explorer for status.`,
        })
      }

      const newBalance = await secureRPCClient.getBalance(publicKey.toBase58())
      setWalletBalance(newBalance / LAMPORTS_PER_SOL)

      return signature
    } catch (error) {
      console.error(`[v0] Transaction signing error:`, error)
      const errorMessage = error instanceof Error ? error.message : "Failed to sign transaction"

      if (errorMessage.includes("User rejected")) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction signature",
          variant: "destructive",
        })
      } else if (errorMessage.includes("insufficient funds")) {
        toast({
          title: "Insufficient Balance",
          description: "Your wallet doesn't have enough SOL to cover transaction fees",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Transaction Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    if (!publicKey) {
      setError("Please connect your wallet to use the copilot")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      toolCalls: [],
    }

    setMessages((prev) => [...prev, assistantMessage])

    let retryCount = 0
    const maxRetries = 2

    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout

        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            walletAddress: publicKey?.toBase58(),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!response.ok) {
          if (response.status === 429 && retryCount < maxRetries) {
            const retryDelay = 2000 * Math.pow(2, retryCount)
            console.log(`[v0] Rate limited, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            retryCount++
            continue
          }

          try {
            const errorData = await response.json()
            throw new Error(errorData.error || `Server error: ${response.status}`)
          } catch {
            throw new Error(`Failed to get response: ${response.status}`)
          }
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response stream")
        }

        let buffer = ""
        let hasReceivedData = false

        while (true) {
          try {
            const { done, value } = await reader.read()

            if (done) {
              if (!hasReceivedData) {
                setError("No response from AI assistant")
              }
              break
            }

            hasReceivedData = true
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))

                  if (data.error) {
                    setError(data.error)
                    console.error("[v0] Error from stream:", data.error)
                    break
                  }

                  if (data.type === "text_chunk") {
                    setMessages((prev) => {
                      const updated = [...prev]
                      const last = updated[updated.length - 1]
                      if (last && last.role === "assistant") {
                        last.content += data.content
                      }
                      return updated
                    })
                  } else if (data.type === "tool_call") {
                    console.log("[v0] Tool call detected:", data.toolName)
                    setMessages((prev) => {
                      const updated = [...prev]
                      const last = updated[updated.length - 1]
                      if (last && last.role === "assistant") {
                        last.toolCalls = last.toolCalls || []
                        last.toolCalls.push({
                          toolName: data.toolName,
                          args: data.args,
                        })
                      }
                      return updated
                    })
                  } else if (data.type === "tool_result") {
                    setMessages((prev) => {
                      const updated = [...prev]
                      const last = updated[updated.length - 1]
                      if (last && last.role === "assistant" && last.toolCalls) {
                        const tool = last.toolCalls.find((t) => t.toolName === data.toolName)
                        if (tool) {
                          tool.result = data.result
                        }
                      }
                      return updated
                    })
                  } else if (data.type === "done") {
                    console.log("[v0] Response complete")
                  }
                } catch (parseError) {
                  console.error("[v0] Failed to parse stream data:", parseError)
                }
              }
            }
          } catch (readError) {
            if (readError instanceof Error && readError.name === "AbortError") {
              throw new Error("Request timeout. Please try again.")
            }
            throw readError
          }
        }

        if (hasReceivedData) {
          break // Success, exit retry loop
        }
      } catch (error) {
        console.error("[v0] Request error:", error)

        if (error instanceof Error) {
          if (error.message.includes("AbortError") || error.message.includes("timeout")) {
            setError("Request timeout. The AI is taking too long to respond. Please try again.")
          } else if (error.message.includes("rate limit")) {
            setError("Rate limited. Please wait a moment before sending another message.")
          } else if (error.message.includes("No response stream")) {
            if (retryCount < maxRetries) {
              const delay = 1000 * Math.pow(2, retryCount)
              console.log(`[v0] Retrying in ${delay}ms...`)
              await new Promise((resolve) => setTimeout(resolve, delay))
              retryCount++
              continue
            }
            setError("Failed to connect to AI service. Please try again.")
          } else {
            setError(error.message || "Failed to get response from AI")
          }
        } else {
          setError("An unexpected error occurred")
        }
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(false)
  }

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt)
  }

  const toggleAutopilot = () => {
    setAutopilotMode(!autopilotMode)
    if (!autopilotMode) {
      setInput("Enable autopilot mode and monitor my portfolio for opportunities")
    }
  }

  const renderToolResult = (toolCall: ToolCall, idx: number) => {
    const result = toolCall.result

    if (!result) {
      return null
    }

    if (!result.success) {
      const isBalanceError = result.error?.toLowerCase().includes("insufficient")

      return (
        <div
          key={idx}
          className={`rounded-md border p-3 ${isBalanceError ? "border-red-500/50 bg-red-500/10" : "border-destructive/50 bg-destructive/10"}`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 ${isBalanceError ? "text-red-500" : "text-destructive"}`} />
            <span className="text-xs font-semibold">{toolCall.toolName} failed</span>
          </div>
          <p className={`mt-2 text-xs ${isBalanceError ? "text-red-400" : "text-destructive"}`}>{result.error}</p>

          {isBalanceError && walletBalance !== null && (
            <div className="mt-3 rounded bg-background/50 p-2 text-xs">
              <p className="text-gray-400">Current balance: {walletBalance.toFixed(3)} SOL</p>
              <p className="mt-1 text-xs text-gray-500">
                To proceed, please add more SOL to your wallet and try again.
              </p>
            </div>
          )}
        </div>
      )
    }

    if (result.type === "multi_swap") {
      return (
        <div key={idx} className="space-y-3 rounded-md border border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{result.message}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Swaps:</span>
              <span className="font-mono">{result.totalSwaps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Total:</span>
              <span className="font-mono">
                {result.totalEstimatedOutput.toFixed(6)} {result.outputToken}
              </span>
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Swap Breakdown:</p>
            {result.swaps?.map((swap: any, swapIdx: number) => (
              <div key={swapIdx} className="rounded bg-background/50 p-2">
                <div className="flex justify-between text-xs">
                  <span className="font-mono">
                    {swap.inputAmount} {swap.inputToken}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">
                    {swap.estimatedOutput.toFixed(6)} {swap.outputToken}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Impact: {swap.priceImpact}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 px-2 text-[10px]"
                    onClick={() => handleSignTransaction(swap.transaction, `Swap ${swap.inputToken}`)}
                  >
                    Sign This Swap
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                for (const swap of result.swaps || []) {
                  await handleSignTransaction(swap.transaction, `Swap ${swap.inputToken}`)
                }
              }}
            >
              Sign All Swaps
            </Button>
          </div>
        </div>
      )
    }

    if (result.type === "limit_order" || result.type === "dca_order" || result.type === "token_creation") {
      return (
        <div key={idx} className="space-y-2 rounded-md border border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{result.message}</span>
          </div>

          {result.type === "limit_order" && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sell:</span>
                <span className="font-mono">
                  {result.inputAmount} {result.inputToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Price:</span>
                <span className="font-mono">
                  {result.targetPrice} {result.outputToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span>{result.expiresIn}</span>
              </div>
            </div>
          )}

          {result.type === "dca_order" && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Cycle:</span>
                <span className="font-mono">
                  {result.amountPerCycle} {result.inputToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency:</span>
                <span>{result.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cycles:</span>
                <span>{result.cycles}</span>
              </div>
            </div>
          )}

          {result.type === "token_creation" && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-mono">{result.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span className="font-mono">{result.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supply:</span>
                <span className="font-mono">{result.supply}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Fee:</span>
                <span className="font-mono">~{(0.1).toFixed(4)} SOL</span>
              </div>
              {result.mintAddress && (
                <div className="mt-2 rounded bg-background p-2">
                  <span className="text-muted-foreground">Mint:</span>
                  <p className="break-all font-mono text-xs">{result.mintAddress}</p>
                </div>
              )}
            </div>
          )}

          {result.transaction && (
            <Button
              size="sm"
              onClick={() => handleSignTransaction(result.transaction, toolCall.toolName)}
              className="mt-2 w-full"
            >
              Sign & Submit Transaction
            </Button>
          )}
        </div>
      )
    }

    if (result.transaction && !result.type) {
      return (
        <div key={idx} className="space-y-2 rounded-md border border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{toolCall.toolName}</span>
          </div>

          {result.estimatedOutput && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You Pay:</span>
                <span className="font-mono">
                  {result.inputAmount} {result.inputToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You Receive:</span>
                <span className="font-mono">
                  {result.estimatedOutput.toFixed(6)} {result.outputToken}
                </span>
              </div>
              {result.priceImpact && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact:</span>
                  <span className={`font-mono ${Number.parseFloat(result.priceImpact) > 1 ? "text-orange-500" : ""}`}>
                    {result.priceImpact}%
                  </span>
                </div>
              )}
              {result.estimatedGasFee && (
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span className="text-muted-foreground">Gas Fee:</span>
                  <span className="font-mono text-amber-400">~{result.estimatedGasFee.toFixed(6)} SOL</span>
                </div>
              )}
            </div>
          )}

          <Button
            size="sm"
            onClick={() => handleSignTransaction(result.transaction, toolCall.toolName)}
            className="mt-2 w-full"
          >
            Sign & Submit Swap
          </Button>
        </div>
      )
    }

    return (
      <div key={idx} className="rounded-md border border-border bg-background p-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-xs font-semibold">{toolCall.toolName}</span>
        </div>
        <div className="mt-2 text-xs text-green-600">{result.message || "Completed successfully"}</div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full rounded-lg border border-border bg-background overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b border-border px-3 md:px-4 py-2 md:py-3">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg truncate">AI Copilot</CardTitle>
            <CardDescription className="text-xs">Your intelligent DeFi assistant</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {walletBalance !== null && (
              <div className="flex flex-col items-end">
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {Number.isNaN(walletBalance) ? "0.0000" : walletBalance.toFixed(4)}
                </span>
                <span className="text-xs text-muted-foreground">SOL</span>
              </div>
            )}
            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${publicKey ? "bg-green-500" : "bg-red-500"}`} />
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div ref={scrollContainerRef} className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <div className="space-y-2 md:space-y-3 px-2 md:px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 md:py-12 min-h-[250px] md:min-h-[300px]">
                <div className="mb-3 md:mb-4">
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                  </div>
                </div>
                <p className="text-sm md:text-base font-semibold text-foreground">Start Trading</p>
                <p className="text-xs text-muted-foreground mt-2 px-3 max-w-xs">
                  Ask me to swap tokens, create orders, or analyze your portfolio
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-2 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm flex-shrink-0 max-w-[90%] sm:max-w-[80%] md:max-w-[70%] ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.toolCalls.map((tool, idx) => (
                            <div key={idx}>{renderToolResult(tool, idx)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 md:px-4 py-2 md:py-3 rounded-lg bg-muted text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                    <span className="text-xs md:text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 && !isLoading && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Try asking:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {EXAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(prompt)
                        const event = new KeyboardEvent("keydown", { key: "Enter" })
                        setTimeout(() => handleSubmit(event as any), 0)
                      }}
                      className="p-2 text-left text-xs rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex-shrink-0 border-t border-border bg-red-500/10 p-2 md:p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 border-t border-border bg-background p-2 md:p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError(null)
              }}
              placeholder={isMobile ? "Ask..." : "Ask me to swap tokens, create orders..."}
              className="flex-1 text-xs md:text-sm h-8 md:h-9"
              disabled={isLoading || !publicKey}
            />
            <Button
              onClick={(e) => handleSubmit(e as any)}
              disabled={isLoading || !publicKey || !input.trim()}
              size="sm"
              className="flex-shrink-0"
            >
              <Send className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
