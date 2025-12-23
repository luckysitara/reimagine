"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, AlertCircle, Radio, CheckCircle, XCircle } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Connection, VersionedTransaction } from "@solana/web3.js"
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

const EXAMPLE_PROMPTS = [
  "Swap 1 SOL for USDC",
  "Clear all my small tokens",
  "What's my portfolio worth?",
  "Create limit order for SOL",
  "Set up weekly DCA",
  "Create new token",
  "Analyze news for SOL",
  "Show my active orders",
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
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [requestCount, setRequestCount] = useState<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const interval = setInterval(() => {
      setRequestCount(0)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

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

      return signature
    } catch (error) {
      console.error(`[v0] Transaction signing error:`, error)
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to sign transaction",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    if (requestCount >= 10 && timeSinceLastRequest < 60000) {
      setError(
        "You're sending messages too quickly. Please wait a moment before trying again to avoid hitting rate limits.",
      )
      return
    }

    if (timeSinceLastRequest < 2000) {
      setError("Please wait a moment before sending another message.")
      return
    }

    setLastRequestTime(now)
    setRequestCount((prev) => prev + 1)

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

  const renderToolResult = (toolCall: any, idx: number) => {
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
      return (
        <div key={idx} className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-semibold">{toolCall.toolName} failed</span>
          </div>
          <p className="mt-2 text-xs text-destructive">{result.error}</p>
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

    // Handle different tool result types with specialized UI
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

    // Default tool result display
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
    <Card className="flex h-auto max-h-[90vh] flex-col md:h-[600px]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>AI Copilot</CardTitle>
              <CardDescription>Your intelligent DeFi assistant</CardDescription>
            </div>
          </div>
          <Button
            variant={autopilotMode ? "default" : "outline"}
            size="sm"
            onClick={toggleAutopilot}
            className="gap-2 whitespace-nowrap"
          >
            <Radio className={`h-4 w-4 ${autopilotMode ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">{autopilotMode ? "Autopilot ON" : "Autopilot OFF"}</span>
            <span className="inline sm:hidden">{autopilotMode ? "ON" : "OFF"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
        {error && (
          <div className="px-3 pt-4 sm:px-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {!publicKey && (
          <div className="border-t px-3 py-3 sm:px-6 sm:py-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Connect your wallet to unlock all features</AlertDescription>
            </Alert>
          </div>
        )}

        {messages.length <= 2 && (
          <div className="border-t px-3 py-3 sm:px-6 sm:py-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking:</p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExamplePrompt(prompt)}
                  className="rounded-md border border-border bg-background px-2 py-2 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-3 sm:px-6">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-6 w-6 border sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs sm:text-sm">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-xs sm:max-w-md lg:max-w-lg space-y-2 rounded-lg px-3 py-2 sm:px-4 sm:py-2 text-sm ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.content && <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>}

                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.toolCalls.map((toolCall, idx) => renderToolResult(toolCall, idx))}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-6 w-6 border sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs sm:text-sm">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading &&
              messages[messages.length - 1]?.role === "assistant" &&
              !messages[messages.length - 1]?.content && (
                <div className="flex gap-2 sm:gap-3">
                  <Avatar className="h-6 w-6 border sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:px-4 sm:py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

        <div className="border-t px-3 py-3 sm:px-6 sm:py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
