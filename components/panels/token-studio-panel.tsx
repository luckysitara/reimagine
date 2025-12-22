"use client"

import type React from "react"

import { useState } from "react"
import { Zap, Loader2, CheckCircle2, ExternalLink, Sparkles } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Transaction } from "@solana/web3.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useConnection } from "@solana/wallet-adapter-react"

export function TokenStudioPanel() {
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [createdToken, setCreatedToken] = useState<{ mintAddress: string; signature: string } | null>(null)
  const { connection } = useConnection()

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: "9",
    supply: "",
    description: "",
    imageUrl: "",
  })

  const handleGenerateImage = async () => {
    if (!formData.description) {
      toast({
        title: "Description Required",
        description: "Please add a description to generate an image",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingImage(true)

    try {
      const response = await fetch("/api/token/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: formData.description }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      setFormData({ ...formData, imageUrl: data.imageUrl })

      toast({
        title: "Image Generated",
        description: "AI-generated token image ready",
      })
    } catch (error) {
      console.error("[v0] Image generation error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      setVisible(true)
      return
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet doesn't support transaction signing",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    setCreatedToken(null)

    try {
      const response = await fetch("/api/token/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          walletAddress: publicKey.toBase58(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to create token")
      }

      const transaction = Transaction.from(Buffer.from(data.transaction, "base64"))

      const signedTransaction = await signTransaction(transaction)

      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      toast({
        title: "Transaction Sent",
        description: "Confirming your token creation...",
      })

      await connection.confirmTransaction(signature, "confirmed")

      setCreatedToken({
        mintAddress: data.mintAddress,
        signature,
      })

      toast({
        title: "Token Created!",
        description: `${formData.symbol} has been successfully created`,
      })

      setFormData({
        name: "",
        symbol: "",
        decimals: "9",
        supply: "",
        description: "",
        imageUrl: "",
      })
    } catch (error) {
      console.error("[v0] Token creation error:", error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create token",
        variant: "destructive",
      })
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
        {createdToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Token Created Successfully!</h3>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mint Address</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono">
                    {createdToken.mintAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(createdToken.mintAddress)
                      toast({ title: "Copied to clipboard" })
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Transaction Signature</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono truncate">
                    {createdToken.signature}
                  </code>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://solscan.io/tx/${createdToken.signature}${
                        process.env.NEXT_PUBLIC_SOLANA_NETWORK !== "mainnet-beta" ? "?cluster=devnet" : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={() => setCreatedToken(null)} className="w-full">
              Create Another Token
            </Button>
          </div>
        ) : (
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
              <Label htmlFor="imageUrl">Token Image</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.png or leave empty"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !formData.description}
                >
                  {isGeneratingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </Button>
              </div>
              {formData.imageUrl && (
                <div className="mt-2 rounded-lg border border-border p-2">
                  <img
                    src={formData.imageUrl || "/placeholder.svg"}
                    alt="Token preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold">Token Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">
                    Solana {process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "Mainnet" : "Devnet"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Freeze Authority</span>
                  <span className="font-medium">Your Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mint Authority</span>
                  <span className="font-medium">Your Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Fee</span>
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
        )}
      </CardContent>
    </Card>
  )
}
