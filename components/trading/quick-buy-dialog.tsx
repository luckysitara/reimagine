"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, TrendingUp, ArrowDownUp } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { getJupiterQuote, executeSwap, type TokenInfo, type JupiterToken } from "@/lib/services/jupiter"
import { useQuickBuyStore } from "@/lib/store/quick-buy-store"
import { useSolanaBalance } from "@/hooks/use-solana-balance"

const PERCENTAGE_BUTTONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "100%", value: 1 },
]

const DEFAULT_TOKENS: Record<string, JupiterToken> = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  USDT: {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsw/logo.png",
  },
}

interface QuickBuyDialogProps {
  isOpen: boolean
  onClose: () => void
  token: TokenInfo
}

export function QuickBuyDialog({ isOpen, onClose, token }: QuickBuyDialogProps) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { balance } = useSolanaBalance()
  const { settings } = useQuickBuyStore()

  const [payToken, setPayToken] = useState<JupiterToken>(
    DEFAULT_TOKENS[settings.paymentToken as keyof typeof DEFAULT_TOKENS] || DEFAULT_TOKENS.SOL,
  )
  const [inputAmount, setInputAmount] = useState(settings.amount.toString())
  const [outputAmount, setOutputAmount] = useState("")
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && settings.amount && settings.amount > 0) {
      setInputAmount(settings.amount.toString())
      fetchQuoteWithAmount(settings.amount.toString())
    }
  }, [isOpen, settings.amount])

  const fetchQuoteWithAmount = async (amount: string) => {
    if (!amount || Number.parseFloat(amount) <= 0 || !publicKey) {
      setQuote(null)
      setOutputAmount("")
      return
    }

    setIsLoadingQuote(true)
    setQuoteError(null)

    try {
      const amountInSmallestUnit = Math.floor(Number.parseFloat(amount) * Math.pow(10, payToken.decimals))

      if (!token || !token.address) {
        setQuoteError("Invalid token configuration")
        return
      }

      const quoteResponse = await getJupiterQuote(
        payToken.address,
        token.address,
        amountInSmallestUnit,
        100,
        publicKey.toBase58(),
      )

      if (!quoteResponse || !quoteResponse.outAmount) {
        setQuote(null)
        setOutputAmount("")
        setQuoteError("Failed to get quote. Please try again.")
        return
      }

      setQuote(quoteResponse)
      const output = Number.parseInt(quoteResponse.outAmount) / Math.pow(10, token.decimals)
      setOutputAmount(output.toFixed(6))
      setQuoteError(null)
    } catch (error) {
      console.error("[v0] Quote error:", error)
      setQuote(null)
      setOutputAmount("")
      setQuoteError("Failed to fetch quote")
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const fetchQuote = async (amount: string) => {
    await fetchQuoteWithAmount(amount)
  }

  const handleAmountChange = (value: string) => {
    setInputAmount(value)
    if (value && Number.parseFloat(value) > 0) {
      fetchQuote(value)
    }
  }

  const handlePercentageClick = (percentage: number) => {
    if (!balance) {
      toast.error("Unable to determine wallet balance")
      return
    }

    const amount = balance * percentage
    handleAmountChange(amount.toString())
  }

  const handleBuy = async () => {
    if (!publicKey || !signTransaction || !quote) {
      toast.error("Please connect your wallet")
      return
    }

    setIsBuying(true)

    try {
      const result = await executeSwap(connection, quote.transaction, signTransaction, quote.requestId)

      if (result.success) {
        toast.success(`Bought ${outputAmount} ${token.symbol}`)
        setInputAmount("")
        setOutputAmount("")
        setQuote(null)
        onClose()
      } else {
        toast.error(result.error || "Buy failed")
      }
    } catch (error) {
      console.error("[v0] Buy error:", error)
      toast.error(error instanceof Error ? error.message : "Buy failed")
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={token.logoURI || "/placeholder.svg"} alt={token.symbol} />
              <AvatarFallback>{token.symbol[0]}</AvatarFallback>
            </Avatar>
            Quick Buy {token.symbol}
          </DialogTitle>
          <DialogDescription>
            Buy {token.name} with {payToken.symbol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pay Token Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pay With</Label>
            <select
              value={payToken.symbol}
              onChange={(e) => {
                const newPayToken = DEFAULT_TOKENS[e.target.value as keyof typeof DEFAULT_TOKENS] || DEFAULT_TOKENS.SOL
                setPayToken(newPayToken)
                setInputAmount("")
                setOutputAmount("")
                setQuote(null)
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          {/* Input Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-background/50"
              step="any"
              min="0"
            />
            {balance && balance > 0 && payToken.symbol === "SOL" && (
              <div className="flex gap-2 pt-2">
                {PERCENTAGE_BUTTONS.map((btn) => (
                  <Button
                    key={btn.label}
                    size="sm"
                    variant="outline"
                    onClick={() => handlePercentageClick(btn.value)}
                    className="flex-1 text-xs"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <div className="rounded-full border border-border p-2 bg-background">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Output Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">You Receive</Label>
            <Input type="number" placeholder="0.00" value={outputAmount} disabled className="bg-background/50" />
            <div className="text-xs text-muted-foreground">
              {token.symbol} @ ${token.usdPrice ? token.usdPrice.toFixed(6) : "?"}
            </div>
          </div>

          {/* Quote Info */}
          {quote && !isLoadingQuote && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400 text-xs">
                <div className="flex justify-between mt-1">
                  <span>Price Impact:</span>
                  <span className="font-mono">{quote.priceImpactPct}%</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {quoteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{quoteError}</AlertDescription>
            </Alert>
          )}

          {isLoadingQuote && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Getting quote...
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={!quote || isBuying || isLoadingQuote || !publicKey}
            className="w-full"
            size="lg"
          >
            {!publicKey ? (
              "Connect Wallet"
            ) : isBuying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buying...
              </>
            ) : (
              `Buy ${token.symbol}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
