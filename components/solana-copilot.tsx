"use client"

import type React from "react"

import { useState } from "react"
import { Send, Sparkles, Loader2, TrendingUp } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  toolCalls?: Array<{
    toolName: string
    args: Record<string, unknown>
  }>
}

const EXAMPLE_PROMPTS = [
  "Swap 1 SOL for USDC",
  "What's my portfolio worth?",
  "Show me the best yield opportunities",
  "Stake 10 SOL with Marinade",
]

export function SolanaCopilot() {
  const { publicKey } = useWallet()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI DeFi assistant. I can help you swap tokens, analyze your portfolio, and execute complex blockchain operations. What would you like to do?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          walletAddress: publicKey?.toBase58(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to get response")
      }

      const data = await response.json()

      if (!data.text) {
        throw new Error("Invalid response from AI")
      }

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text,
          toolCalls: data.toolCalls,
        },
      ])
    } catch (error) {
      console.error("[v0] Copilot error:", error)

      let errorMessage = "Sorry, I encountered an error. "

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage += "The request took too long. Please try again."
        } else if (error.message.includes("API key")) {
          errorMessage += "AI service not configured properly. Please check environment variables."
        } else {
          errorMessage += error.message
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>AI Copilot</CardTitle>
            <CardDescription>Your intelligent DeFi assistant</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
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
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      {message.toolCalls.map((tool, toolIndex) => (
                        <div key={toolIndex} className="rounded-md border border-border bg-background p-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-xs font-semibold">Action: {tool.toolName}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {Object.entries(tool.args).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  className="justify-start text-left bg-transparent"
                  onClick={() => handleExamplePrompt(prompt)}
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
              placeholder="Ask me to swap tokens, check prices, or analyze your portfolio..."
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
