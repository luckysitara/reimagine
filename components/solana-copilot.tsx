"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, AlertCircle, Radio, CheckCircle, ChevronDown } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Connection, VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

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

export function SolanaCopilot() {
  const { publicKey, signTransaction } = useWallet()
  const [autopilotMode, setAutopilotMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI DeFi assistant. I can help you swap tokens, create limit/DCA orders, launch new tokens, analyze your portfolio, monitor news, and more. What would you like to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!publicKey) {
      setWalletBalance(null)
      return
    }

    const fetchBalance = async () => {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"
        const connection = new Connection(rpcUrl, "confirmed")
        const balance = await connection.getBalance(publicKey)
        setWalletBalance(balance / LAMPORTS_PER_SOL)
        console.log("[v0] Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL")
      } catch (error) {
        console.error("[v0] Failed to fetch balance:", error)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [publicKey])

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollViewportRef.current) return

      const viewport = scrollViewportRef.current
      const isScrolledToBottom = Math.abs(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight) < 10

      setShowScrollButton(!isScrolledToBottom)
    }

    const viewport = scrollViewportRef.current
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll)
      return () => viewport.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollViewportRef.current) {
        const viewport = scrollViewportRef.current
        viewport.scrollTop = viewport.scrollHeight
      }
    }

    // Use requestAnimationFrame for smooth scrolling
    const timer = requestAnimationFrame(() => {
      scrollToBottom()
    })

    return () => cancelAnimationFrame(timer)
  }, [messages])

  const scrollToBottom = () => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current
      viewport.scrollTop = viewport.scrollHeight
      setShowScrollButton(false)
    }
  }

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

      const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"
      const connection = new Connection(rpcUrl, "confirmed")

      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })

      console.log(`[v0] Transaction sent:`, signature)

      toast({
        title: "Transaction Submitted",
        description: `${toolName} transaction is being confirmed...`,
      })

      const latestBlockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      })

      toast({
        title: "Success!",
        description: `${toolName} confirmed on-chain`,
      })

      const newBalance = await connection.getBalance(publicKey)
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
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            walletAddress: publicKey?.toBase58(),
          }),
        })

        if (!response.ok) {
          if (response.status === 429 && retryCount < maxRetries) {
            const retryDelay = 2000 * Math.pow(2, retryCount)
            console.log(`[v0] Rate limited, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            retryCount++
            continue
          }

          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to get response")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response stream")
        }

        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                setError(data.error)
                break
              }

              if (data.type === "text_chunk") {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last.role === "assistant") {
                    last.content += data.content
                  }
                  return updated
                })
              } else if (data.type === "tool_call") {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last.role === "assistant") {
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
                  if (last.role === "assistant" && last.toolCalls) {
                    const tool = last.toolCalls.find((t) => t.toolName === data.toolName)
                    if (tool) {
                      tool.result = data.result
                    }
                  }
                  return updated
                })
              } else if (data.type === "done") {
                break
              }
            }
          }
        }

        break
      } catch (err: any) {
        console.error(`[v0] Copilot error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err)

        if (retryCount < maxRetries && !err.message?.toLowerCase().includes("api")) {
          const retryDelay = 2000 * Math.pow(2, retryCount)
          console.log(`[v0] Retrying in ${retryDelay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          retryCount++
          continue
        }

        setError(err.message || "An error occurred")
        setMessages((prev) => prev.filter((m) => m.content || m.toolCalls?.length))
        break
      } finally {
        if (retryCount > maxRetries) {
          setIsLoading(false)
        }
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
      return (
        <div key={idx} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-xs font-semibold">Running {toolCall.toolName}...</span>
          </div>
        </div>
      )
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
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">{result.message}</span>
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
    <Card className="flex flex-col h-full w-full bg-dark-surface border-dark-border">
      <CardHeader className="pb-2 md:pb-3 lg:pb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg lg:text-xl truncate">AI Copilot</CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">
                {walletBalance !== null
                  ? `Balance: ${walletBalance.toFixed(3)} SOL`
                  : "Your intelligent DeFi assistant"}
              </CardDescription>
            </div>
          </div>
          <Button
            variant={autopilotMode ? "default" : "outline"}
            size="sm"
            onClick={toggleAutopilot}
            className="gap-2 flex-shrink-0 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
          >
            <Radio className={`h-3 w-3 sm:h-4 sm:w-4 ${autopilotMode ? "animate-pulse" : ""}`} />
            <span className="hidden xs:inline">{autopilotMode ? "Autopilot ON" : "Autopilot OFF"}</span>
            <span className="xs:hidden">{autopilotMode ? "ON" : "OFF"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 md:gap-3 lg:gap-4 overflow-hidden p-0">
        {error && (
          <div className="px-3 sm:px-4 md:px-6 pt-2 md:pt-3 lg:pt-4 flex-shrink-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {autopilotMode && (
          <div className="px-3 sm:px-4 md:px-6 flex-shrink-0">
            <Alert className="border-green-500/50 bg-green-500/10">
              <Radio className="h-4 w-4 animate-pulse text-green-500" />
              <AlertDescription className="text-xs sm:text-sm">
                <strong>Autopilot Mode Active:</strong> Monitoring your portfolio and prices for opportunities.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="flex-1 relative">
          <div className="h-full overflow-hidden">
            <div className="px-3 sm:px-4 md:px-6 space-y-3 md:space-y-4" ref={scrollViewportRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback
                      className={message.role === "user" ? "bg-primary text-primary-foreground text-xs" : "text-xs"}
                    >
                      {message.role === "user" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] space-y-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.content && <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>}

                    {message.toolCalls?.map((toolCall, idx) => renderToolResult(toolCall, idx))}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 sm:gap-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">AI</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 sm:px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div className="h-2" />
            </div>
          </div>
        </ScrollArea>

        {showScrollButton && (
          <div className="px-3 sm:px-4 md:px-6 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={scrollToBottom}
              className="w-full gap-2 text-xs sm:text-sm bg-transparent"
            >
              <ChevronDown className="h-4 w-4" />
              Scroll to bottom
            </Button>
          </div>
        )}

        {messages.length === 1 && (
          <div className="px-3 sm:px-4 md:px-6 flex-shrink-0">
            <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">Try asking:</p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 auto-rows-max">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start bg-transparent text-left text-xs sm:text-sm h-auto py-2 px-3 whitespace-normal"
                  onClick={() => handleExamplePrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-dark-border p-2 sm:p-3 md:p-4 flex-shrink-0 bg-dark-bg">
          <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !publicKey}
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || !publicKey}
              size="icon"
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!publicKey && <p className="text-xs text-amber-500 mt-2">Please connect your wallet to use the copilot</p>}
        </div>
      </CardContent>
    </Card>
  )
}
