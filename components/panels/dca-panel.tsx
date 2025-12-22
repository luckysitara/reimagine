"use client"

import { useState, useEffect } from "react"
import { Repeat, Plus, X, Loader2 } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { TokenSearchDialog } from "@/components/trading/token-search-dialog"
import { getJupiterTokenList, type JupiterToken } from "@/lib/services/jupiter"

interface DCAAccount {
  publicKey: string
  account: {
    user: string
    inputMint: string
    outputMint: string
    inDeposited: string
    inUsed: string
    inAmountPerCycle: string
    cycleFrequency: number
    nextCycleAt: number
    createdAt: number
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

const FREQUENCY_OPTIONS = [
  { label: "Every Hour", value: "3600" },
  { label: "Every 4 Hours", value: "14400" },
  { label: "Daily", value: "86400" },
  { label: "Weekly", value: "604800" },
  { label: "Monthly", value: "2592000" },
]

export function DCAPanel() {
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()

  const [tokens, setTokens] = useState<JupiterToken[]>([])
  const [dcaAccounts, setDcaAccounts] = useState<DCAAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Create DCA form
  const [inputToken, setInputToken] = useState<JupiterToken>(DEFAULT_SOL)
  const [outputToken, setOutputToken] = useState<JupiterToken>(DEFAULT_USDC)
  const [totalAmount, setTotalAmount] = useState("")
  const [amountPerCycle, setAmountPerCycle] = useState("")
  const [frequency, setFrequency] = useState("86400")
  const [showInputTokenDialog, setShowInputTokenDialog] = useState(false)
  const [showOutputTokenDialog, setShowOutputTokenDialog] = useState(false)

  useEffect(() => {
    getJupiterTokenList().then(setTokens).catch(console.error)
  }, [])

  useEffect(() => {
    if (publicKey) {
      loadDCAAccounts()
    }
  }, [publicKey])

  const loadDCAAccounts = async () => {
    if (!publicKey) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/jupiter/dca?wallet=${publicKey.toBase58()}`)
      if (response.ok) {
        const data = await response.json()
        setDcaAccounts(data)
      }
    } catch (error) {
      console.error("Failed to load DCA accounts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDCA = async () => {
    console.log("[v0] Create DCA clicked")

    if (!publicKey || !signTransaction) {
      console.log("[v0] No wallet connected, showing modal")
      setVisible(true)
      return
    }

    if (!totalAmount || !amountPerCycle) {
      toast.error("Please fill in all required fields")
      return
    }

    if (Number.parseFloat(totalAmount) <= 0) {
      toast.error("Total amount must be greater than 0")
      return
    }

    if (Number.parseFloat(amountPerCycle) <= 0) {
      toast.error("Amount per cycle must be greater than 0")
      return
    }

    if (Number.parseFloat(amountPerCycle) > Number.parseFloat(totalAmount)) {
      toast.error("Amount per cycle cannot exceed total amount")
      return
    }

    setIsCreating(true)
    console.log("[v0] Creating DCA with:", {
      inputToken: inputToken.symbol,
      outputToken: outputToken.symbol,
      totalAmount,
      amountPerCycle,
      frequency,
    })

    try {
      const inAmount = Math.floor(Number.parseFloat(totalAmount) * Math.pow(10, inputToken.decimals))
      const inAmountPerCycle = Math.floor(Number.parseFloat(amountPerCycle) * Math.pow(10, inputToken.decimals))

      console.log("[v0] Calculated amounts:", { inAmount, inAmountPerCycle })

      const response = await fetch("/api/jupiter/dca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          payer: publicKey.toBase58(),
          inAmount: inAmount.toString(),
          inAmountPerCycle: inAmountPerCycle.toString(),
          cycleFrequency: Number.parseInt(frequency),
        }),
      })

      const data = await response.json()
      console.log("[v0] API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create DCA")
      }

      toast.success("DCA order created successfully!")
      setShowCreateDialog(false)
      setTotalAmount("")
      setAmountPerCycle("")
      loadDCAAccounts()
    } catch (error) {
      console.error("[v0] Create DCA error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create DCA")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseDCA = async (dca: DCAAccount) => {
    if (!publicKey) return

    try {
      const response = await fetch("/api/jupiter/dca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          dcaPubkey: dca.publicKey,
          user: publicKey.toBase58(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to close DCA")
      }

      toast.success("DCA order closed successfully!")
      loadDCAAccounts()
    } catch (error) {
      console.error("Close DCA error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to close DCA")
    }
  }

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DCA (Dollar Cost Averaging)</CardTitle>
          <CardDescription>Automate recurring token purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Repeat className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Connect Your Wallet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to create and manage DCA orders</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalCycles =
    totalAmount && amountPerCycle ? Math.floor(Number.parseFloat(totalAmount) / Number.parseFloat(amountPerCycle)) : 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DCA (Dollar Cost Averaging)</CardTitle>
              <CardDescription>Automate recurring token purchases</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create DCA
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
          ) : dcaAccounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Repeat className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Active DCA Orders</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create your first DCA order to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dcaAccounts.map((dca) => {
                const remaining = Number(dca.account.inDeposited) - Number(dca.account.inUsed)
                const progress = (Number(dca.account.inUsed) / Number(dca.account.inDeposited)) * 100

                return (
                  <div key={dca.publicKey} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{dca.account.inAmountPerCycle} per cycle</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleCloseDCA(dca)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span>{remaining.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next cycle:</span>
                        <span>{new Date(dca.account.nextCycleAt * 1000).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create DCA Order</DialogTitle>
            <DialogDescription>
              Automate recurring purchases to dollar-cost average into your chosen token over time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>From Token</Label>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setShowInputTokenDialog(true)}
              >
                {inputToken.logoURI && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={inputToken.logoURI || "/placeholder.svg"} />
                    <AvatarFallback>{inputToken.symbol[0]}</AvatarFallback>
                  </Avatar>
                )}
                {inputToken.symbol} - {inputToken.name}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>To Token</Label>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent"
                onClick={() => setShowOutputTokenDialog(true)}
              >
                {outputToken.logoURI && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={outputToken.logoURI || "/placeholder.svg"} />
                    <AvatarFallback>{outputToken.symbol[0]}</AvatarFallback>
                  </Avatar>
                )}
                {outputToken.symbol} - {outputToken.name}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Total Amount ({inputToken.symbol})</Label>
              <Input
                type="number"
                placeholder="100"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount Per Cycle ({inputToken.symbol})</Label>
              <Input
                type="number"
                placeholder="10"
                value={amountPerCycle}
                onChange={(e) => setAmountPerCycle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {totalCycles > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cycles:</span>
                  <span className="font-medium">{totalCycles}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    ~{Math.floor((totalCycles * Number.parseInt(frequency)) / 86400)} days
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCreateDCA}
              disabled={!totalAmount || !amountPerCycle || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating DCA...
                </>
              ) : (
                "Create DCA Order"
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
