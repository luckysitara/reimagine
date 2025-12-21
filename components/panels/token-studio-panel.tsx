"use client"

import type React from "react"

import { useState } from "react"
import { Zap, Upload, Loader2 } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function TokenStudioPanel() {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: "9",
    supply: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      setVisible(true)
      return
    }

    setIsCreating(true)

    try {
      // In production, integrate with Jupiter Studio API
      console.log("[v0] Creating token:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert("Token creation functionality requires Jupiter Studio API integration")
    } catch (error) {
      console.error("[v0] Token creation error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Token Studio</CardTitle>
            <CardDescription>Create your own SPL token on Solana</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Token Name</Label>
              <Input
                id="name"
                placeholder="My Token"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="MTK"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                placeholder="9"
                value={formData.decimals}
                onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                required
                min="0"
                max="9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supply">Total Supply</Label>
              <Input
                id="supply"
                type="number"
                placeholder="1000000"
                value={formData.supply}
                onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Token Logo</Label>
            <div className="flex items-center gap-2">
              <Input id="logo" type="file" accept="image/*" className="flex-1" />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Recommended: 512x512px PNG or JPG</p>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="text-sm font-semibold">Token Configuration</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Solana Mainnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Freeze Authority</span>
                <span className="font-medium">None</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mint Authority</span>
                <span className="font-medium">Your Wallet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creation Fee</span>
                <span className="font-medium">~0.01 SOL</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!publicKey || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Token...
              </>
            ) : !publicKey ? (
              "Connect Wallet to Create"
            ) : (
              "Create Token"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
