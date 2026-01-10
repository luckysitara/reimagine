"use client"

import { useState, useEffect } from "react"
import { Zap, Settings2, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { TokenInfo, Category, Interval } from "@/lib/services/jupiter"
import { QuickBuyDialog } from "@/components/trading/quick-buy-dialog"
import { useQuickBuyStore } from "@/lib/store/quick-buy-store"

const TIME_INTERVALS: { label: string; value: Interval }[] = [
  { label: "5m", value: "5m" },
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
]

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "Top Traded", value: "toptraded" },
  { label: "Top Trending", value: "toptrending" },
  { label: "Top Organic", value: "toporganicscore" },
  { label: "New", value: "recent" },
]

interface QuickBuySettings {
  amount: number
  paymentToken: string
}

export function TokenDiscoveryPanel() {
  const { publicKey } = useWallet()
  const { settings, updateSettings } = useQuickBuyStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [activeCategory, setActiveCategory] = useState<Category>("toptraded")
  const [activeInterval, setActiveInterval] = useState<Interval>("24h")
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
  const [showQuickBuy, setShowQuickBuy] = useState(false)

  useEffect(() => {
    fetchTokens()
  }, [activeCategory, activeInterval])

  const fetchTokens = async () => {
    setIsLoading(true)
    try {
      const url = new URL("/api/jupiter/tokens-discovery", window.location.origin)
      url.searchParams.set("action", "category")
      url.searchParams.set("category", activeCategory)
      url.searchParams.set("interval", activeInterval)
      url.searchParams.set("limit", "50")

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      setTokens(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Failed to fetch tokens:", error)
      toast.error("Failed to load tokens")
      setTokens([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickBuy = async (token: TokenInfo) => {
    if (!publicKey) {
      toast.error("Please connect your wallet")
      return
    }

    // Use saved settings and execute the swap immediately
    try {
      const paymentTokenSymbol = settings.paymentToken as "SOL" | "USDC" | "USDT"
      const paymentTokenMap: Record<string, string> = {
        SOL: "So11111111111111111111111111111111111111112",
        USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
      }

      const paymentTokenAddress = paymentTokenMap[paymentTokenSymbol]
      if (!paymentTokenAddress) {
        toast.error("Invalid payment token configured")
        return
      }

      // Instead of opening a dialog, show a quick buy toast notification
      // and prepare for instant execution
      toast.loading(`Preparing to buy ${token.symbol} with ${settings.amount} ${paymentTokenSymbol}...`)

      // Store the quick buy intent for instant execution
      setSelectedToken(token)
      setShowQuickBuy(true)
    } catch (error) {
      console.error("[v0] Quick buy error:", error)
      toast.error("Failed to initiate quick buy")
    }
  }

  const handleSaveSettings = () => {
    updateSettings({
      amount: settings.amount,
      paymentToken: settings.paymentToken as "SOL" | "USDC" | "USDT",
    })
    toast.success("Quick buy settings saved")
    setSettingsOpen(false)
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
                Token Discovery
              </CardTitle>
              <CardDescription>Discover trending and top-performing tokens</CardDescription>
            </div>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Quick Buy Settings</DialogTitle>
                  <DialogDescription>Configure your quick buy defaults</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-buy-amount">Default Amount (SOL)</Label>
                    <Input
                      id="quick-buy-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.amount}
                      onChange={(e) =>
                        updateSettings({
                          amount: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-token">Payment Token</Label>
                    <select
                      id="payment-token"
                      value={settings.paymentToken}
                      onChange={(e) =>
                        updateSettings({
                          paymentToken: e.target.value as "SOL" | "USDC" | "USDT",
                        })
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs
                value={activeCategory}
                onValueChange={(value) => setActiveCategory(value as Category)}
                className="w-full lg:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex gap-1.5">
                {TIME_INTERVALS.map((interval) => (
                  <Button
                    key={interval.value}
                    size="sm"
                    variant={activeInterval === interval.value ? "default" : "outline"}
                    onClick={() => setActiveInterval(interval.value)}
                    className="text-xs font-medium"
                  >
                    {interval.label}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No tokens found</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] border border-border rounded-lg">
                <div className="w-full">
                  {/* Header Row */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/50 sticky top-0 text-xs font-semibold text-muted-foreground">
                    <div className="w-12"></div>
                    <div className="flex-1 min-w-[140px]">Token</div>
                    <div className="w-24 text-right">Price</div>
                    <div className="w-24 text-right">24h Change</div>
                    <div className="w-24 text-right">6h Vol</div>
                    <div className="w-20 text-right">Traders</div>
                    <div className="w-12"></div>
                  </div>

                  {/* Token Rows */}
                  {tokens.map((token) => {
                    const priceChange24h = token.stats24h?.priceChange || 0
                    const volume6h = token.stats24h?.buyVolume || 0
                    const traders = token.stats24h?.traderCount || 0

                    return (
                      <div
                        key={token.address}
                        className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-background/50 transition-colors"
                      >
                        {/* Token Logo */}
                        <div className="w-12 flex-shrink-0">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage
                              src={token.logoURI || ""}
                              alt={token.symbol}
                              onError={(e) => {
                                ;(e.currentTarget as HTMLImageElement).src =
                                  `/placeholder.svg?height=32&width=32&query=${token.symbol}`
                              }}
                            />
                            <AvatarFallback className="text-xs font-bold bg-muted">
                              {token.symbol.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Token Name & Symbol */}
                        <div className="flex-1 min-w-[140px]">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold">{token.symbol.toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{token.name}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="w-24 text-right">
                          <p className="text-xs font-semibold">
                            ${token.usdPrice ? token.usdPrice.toFixed(4) : "0.00"}
                          </p>
                        </div>

                        {/* 24h Change */}
                        <div className="w-24 text-right">
                          <p
                            className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                              priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {priceChange24h >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {Math.abs(priceChange24h).toFixed(2)}%
                          </p>
                        </div>

                        {/* 6h Volume */}
                        <div className="w-24 text-right">
                          <p className="text-xs font-semibold">
                            $
                            {volume6h > 1000000
                              ? (volume6h / 1000000).toFixed(1) + "M"
                              : (volume6h / 1000).toFixed(0) + "K"}
                          </p>
                        </div>

                        {/* Traders */}
                        <div className="w-20 text-right">
                          <p className="text-xs font-semibold">{traders.toLocaleString()}</p>
                        </div>

                        {/* Quick Buy Button */}
                        <div className="w-12 flex-shrink-0 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-accent hover:bg-accent/10"
                            onClick={() => handleQuickBuy(token)}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Buy Dialog */}
      {selectedToken && showQuickBuy && (
        <QuickBuyDialog isOpen={showQuickBuy} onClose={() => setShowQuickBuy(false)} token={selectedToken} />
      )}
    </div>
  )
}
