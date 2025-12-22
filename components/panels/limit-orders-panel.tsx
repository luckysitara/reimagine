"use client"

import { useState, useEffect } from "react"
import { Target, Plus, X, Loader2, TrendingUp } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { TokenSearchDialog } from "@/components/trading/token-search-dialog"
import { getJupiterTokenList, type JupiterToken } from "@/lib/services/jupiter"

interface LimitOrder {
  publicKey: string
  account: {
    maker: string
    inputMint: string
    outputMint: string
    makingAmount: string
    takingAmount: string
    expiredAt: number
    state: "created" | "filled" | "cancelled" | "expired"
  }
}

const DEFAULT_SOL = {
  address: "So11111111111111111111111111111111111111112",
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
}

const DEFAULT_USDC = {
  address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
}

export function LimitOrdersPanel() {
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()

  const [tokens, setTokens] = useState<JupiterToken[]>([])
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Create order form
  const [inputToken, setInputToken] = useState<JupiterToken>(DEFAULT_SOL)
  const [outputToken, setOutputToken] = useState<JupiterToken>(DEFAULT_USDC)
  const [inputAmount, setInputAmount] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [orderType, setOrderType] = useState<"above" | "below">("above")
  const [showInputTokenDialog, setShowInputTokenDialog] = useState(false)
  const [showOutputTokenDialog, setShowOutputTokenDialog] = useState(false)

  useEffect(() => {
    getJupiterTokenList().then(setTokens).catch(console.error)
  }, [])

  useEffect(() => {
    if (publicKey) {
      loadOrders()
    }
  }, [publicKey])

  const loadOrders = async () => {
    if (!publicKey) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/jupiter/limit-orders?wallet=${publicKey.toBase58()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to load limit orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    console.log("[v0] Create order clicked")

    if (!publicKey || !signTransaction) {
      console.log("[v0] No wallet connected, showing modal")
      setVisible(true)
      return
    }

    if (!inputAmount || !targetPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    if (Number.parseFloat(inputAmount) <= 0) {
      toast.error("Input amount must be greater than 0")
      return
    }

    if (Number.parseFloat(targetPrice) <= 0) {
      toast.error("Target price must be greater than 0")
      return
    }

    setIsCreating(true)
    console.log("[v0] Creating limit order with:", {
      inputToken: inputToken.symbol,
      outputToken: outputToken.symbol,
      inputAmount,
      targetPrice,
    })

    try {
      const inAmount = Math.floor(Number.parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))
      const outAmount = Math.floor(
        Number.parseFloat(targetPrice) * inAmount * Math.pow(10, outputToken.decimals - inputToken.decimals),
      )

      console.log("[v0] Calculated amounts:", { inAmount, outAmount })

      const response = await fetch("/api/jupiter/limit-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          maker: publicKey.toBase58(),
          payer: publicKey.toBase58(),
          makingAmount: inAmount.toString(),
          takingAmount: outAmount.toString(),
          expiredAt: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days expiry
        }),
      })

      const data = await response.json()
      console.log("[v0] API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create limit order")
      }

      toast.success("Limit order created successfully! Refreshing order list...")
      setShowCreateDialog(false)
      setInputAmount("")
      setTargetPrice("")

      setTimeout(() => {
        loadOrders()
      }, 2000)
    } catch (error) {
      console.error("[v0] Create order error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create limit order")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelOrder = async (order: LimitOrder) => {
    if (!publicKey) return

    try {
      const response = await fetch("/api/jupiter/limit-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          orderPubkey: order.publicKey,
          maker: publicKey.toBase58(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel order")
      }

      toast.success("Order cancelled successfully!")
      loadOrders()
    } catch (error) {
      console.error("Cancel order error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to cancel order")
    }
  }

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Limit Orders</CardTitle>
          <CardDescription>Set price targets and execute trades automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Connect Your Wallet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to create and manage limit orders</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Limit Orders</CardTitle>
              <CardDescription>Set price targets and execute trades automatically</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Active Orders</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create your first limit order to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.publicKey} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="font-semibold">
                          {order.account.makingAmount} → {order.account.takingAmount}
                        </span>
                      </div>
                      <Badge variant={order.account.state === "created" ? "default" : "secondary"}>
                        {order.account.state}
                      </Badge>
                    </div>
                    {order.account.state === "created" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancelOrder(order)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Expires: {new Date(order.account.expiredAt * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Limit Order</DialogTitle>
            <DialogDescription>
              Set a price target to automatically execute your trade when the market reaches your desired rate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Buy when price goes above</SelectItem>
                  <SelectItem value="below">Sell when price goes below</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>You Pay</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="w-32 gap-2 bg-transparent"
                  onClick={() => setShowInputTokenDialog(true)}
                >
                  {inputToken.logoURI && (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={inputToken.logoURI || "/placeholder.svg"} />
                      <AvatarFallback>{inputToken.symbol[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  {inputToken.symbol}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Target Price ({outputToken.symbol} per {inputToken.symbol})
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>You Receive</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={
                    inputAmount && targetPrice
                      ? (Number.parseFloat(inputAmount) * Number.parseFloat(targetPrice)).toFixed(6)
                      : ""
                  }
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="w-32 gap-2 bg-transparent"
                  onClick={() => setShowOutputTokenDialog(true)}
                >
                  {outputToken.logoURI && (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={outputToken.logoURI || "/placeholder.svg"} />
                      <AvatarFallback>{outputToken.symbol[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  {outputToken.symbol}
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateOrder}
              disabled={!inputAmount || !targetPrice || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                "Create Limit Order"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TokenSearchDialog
        open={showInputTokenDialog}
        onOpenChange={setShowInputTokenDialog}
        onSelectToken={setInputToken}
        tokens={tokens}
        excludeToken={outputToken.address}
      />

      <TokenSearchDialog
        open={showOutputTokenDialog}
        onOpenChange={setShowOutputTokenDialog}
        onSelectToken={setOutputToken}
        tokens={tokens}
        excludeToken={inputToken.address}
      />
    </>
  )
}
