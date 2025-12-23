"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, TrendingUp, AlertCircle, Radio } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

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
  "What's my portfolio worth?",
  "Analyze news for SOL token",
  "Get price of JUP token",
  "Enable autopilot mode",
]

export function SolanaCopilot() {
  const { publicKey } = useWallet()
  const [autopilotMode, setAutopilotMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI DeFi assistant. I can help you swap tokens, analyze your portfolio, get token news, and execute complex blockchain operations. What would you like to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [requestCount, setRequestCount] = useState<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setRequestCount(0)
    }, 60000) // Reset every 60 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

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

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>AI Copilot</CardTitle>
              <CardDescription>Your intelligent DeFi assistant</CardDescription>
            </div>
          </div>
          <Button variant={autopilotMode ? "default" : "outline"} size="sm" onClick={toggleAutopilot} className="gap-2">
            <Radio className={`h-4 w-4 ${autopilotMode ? "animate-pulse" : ""}`} />
            {autopilotMode ? "Autopilot ON" : "Autopilot OFF"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {autopilotMode && (
          <div className="px-6 pt-4">
            <Alert className="border-green-500/50 bg-green-500/10">
              <Radio className="h-4 w-4 animate-pulse text-green-500" />
              <AlertDescription className="text-sm">
                <strong>Autopilot Mode Active:</strong> Monitoring your portfolio, prices, and news for opportunities.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={message.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                    {message.role === "user" ? "U" : "AI"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] space-y-2 rounded-lg px-4 py-2 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>}

                  {message.toolCalls?.map((toolCall, idx) => (
                    <div key={idx} className="rounded-md border border-border bg-background p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="text-xs font-semibold">
                          Action: {toolCall.toolName}
                          {!toolCall.result && (
                            <Badge variant="outline" className="ml-2">
                              Running...
                            </Badge>
                          )}
                        </span>
                      </div>
                      {toolCall.result && (
                        <div className="mt-2 text-xs">
                          {toolCall.result.success ? (
                            <div className="text-green-600">✓ {toolCall.result.message || "Completed"}</div>
                          ) : (
                            <div className="text-red-600">✗ {toolCall.result.error || "Failed"}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-6">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Try asking:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start bg-transparent text-left"
                  onClick={() => handleExamplePrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask me to swap tokens, analyze news, or monitor your portfolio..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
