"use client"

import { useState, useEffect } from "react"
import { ArrowDownUp, Loader2, AlertCircle, TrendingUp } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { TokenSearchDialog } from "@/components/trading/token-search-dialog"
import {
  getJupiterTokenList,
  getJupiterQuote,
  executeSwap,
  type JupiterToken,
  type JupiterQuote,
} from "@/lib/services/jupiter"
import { useSolanaBalance } from "@/hooks/use-solana-balance"

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

const PERCENTAGE_BUTTONS = [
  { label: "10%", value: 0.1 },
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "100%", value: 1 },
]

export function TradingPanel() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const { balance } = useSolanaBalance()

  const [tokens, setTokens] = useState<JupiterToken[]>([])
  const [inputToken, setInputToken] = useState<JupiterToken>(DEFAULT_SOL)
  const [outputToken, setOutputToken] = useState<JupiterToken>(DEFAULT_USDC)
  const [inputAmount, setInputAmount] = useState("")
  const [inputUSDValue, setInputUSDValue] = useState("")
  const [outputAmount, setOutputAmount] = useState("")
  const [quote, setQuote] = useState<JupiterQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showInputTokenDialog, setShowInputTokenDialog] = useState(false)
  const [showOutputTokenDialog, setShowOutputTokenDialog] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const allTokens = await getJupiterTokenList()
        console.log("[v0] Loaded tokens:", allTokens.length)
        if (allTokens.length > 0) {
          setTokens(allTokens)
        }
      } catch (err) {
        console.error("[v0] Failed to load tokens:", err)
        toast.error("Failed to load token list")
        setTokens([DEFAULT_SOL, DEFAULT_USDC])
      }
    }

    loadTokens()
  }, [])

  useEffect(() => {
    const fetchPrices = async () => {
      if (!inputToken || !outputToken) return

      setLoadingPrices(true)
      try {
        const [inputPrice, outputPrice] = await Promise.all([
          fetch(`/api/token-price?symbol=${inputToken.symbol}`).then((r) => r.json()),
          fetch(`/api/token-price?symbol=${outputToken.symbol}`).then((r) => r.json()),
        ])

        const prices: Record<string, number> = {}
        if (inputPrice?.priceUSD) prices[inputToken.symbol] = inputPrice.priceUSD
        if (outputPrice?.priceUSD) prices[outputToken.symbol] = outputPrice.priceUSD

        setTokenPrices(prices)
      } catch (err) {
        console.error("[v0] Failed to fetch prices:", err)
      } finally {
        setLoadingPrices(false)
      }
    }

    fetchPrices()
  }, [inputToken, outputToken])

  useEffect(() => {
    if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      setQuote(null)
      setOutputAmount("")
      setInputUSDValue("")
      setQuoteError(null)
      return
    }

    const amount = Number.parseFloat(inputAmount)
    const price = tokenPrices[inputToken.symbol] || 0
    if (price > 0) {
      setInputUSDValue((amount * price).toFixed(2))
    }

    if (!publicKey) {
      setQuote(null)
      setOutputAmount("")
      setQuoteError("Connect your wallet to get quotes")
      return
    }

    const timer = setTimeout(() => {
      fetchQuote()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAmount, inputToken, outputToken, publicKey, tokenPrices])

  const fetchQuote = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet to get quotes")
      return
    }

    try {
      setIsLoadingQuote(true)
      setQuoteError(null)
      const amount = Math.floor(Number.parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))

      const quoteResponse = await getJupiterQuote(
        inputToken.address,
        outputToken.address,
        amount,
        100,
        publicKey.toBase58(),
      )

      if (!quoteResponse || !quoteResponse.outAmount) {
        setQuote(null)
        setOutputAmount("")
        setQuoteError("Failed to get quote. Please try again.")
        setIsLoadingQuote(false)
        return
      }

      setQuote(quoteResponse)
      const output = Number.parseInt(quoteResponse.outAmount) / Math.pow(10, outputToken.decimals)
      setOutputAmount(output.toFixed(6))
      setQuoteError(null)
    } catch (error) {
      console.error("[v0] Quote error:", error)
      setQuote(null)
      setOutputAmount("")

      if (error instanceof Error) {
        if (error.message.includes("Insufficient")) {
          setQuoteError(`Insufficient ${inputToken.symbol} balance`)
        } else if (error.message.includes("liquidity")) {
          setQuoteError(`No liquidity for ${inputToken.symbol}/${outputToken.symbol}`)
        } else {
          setQuoteError(error.message)
        }
      }
      setIsLoadingQuote(false)
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleUSDInput = (usdAmount: string) => {
    setInputUSDValue(usdAmount)

    if (!usdAmount || Number.parseFloat(usdAmount) <= 0) {
      setInputAmount("")
      return
    }

    const price = tokenPrices[inputToken.symbol] || 0
    if (price > 0) {
      const tokenAmount = Number.parseFloat(usdAmount) / price
      setInputAmount(tokenAmount.toString())
    } else {
      toast.error(`Price not available for ${inputToken.symbol}`)
    }
  }

  const handlePercentageClick = (percentage: number) => {
    if (!balance) {
      toast.error("Unable to determine wallet balance")
      return
    }

    const amount = balance * percentage
    setInputAmount(amount.toString())
  }

  const handleSwap = async () => {
    if (!publicKey || !signTransaction || !quote) {
      toast.error("Please connect your wallet")
      return
    }

    setIsSwapping(true)

    try {
      const result = await executeSwap(connection, quote.transaction, signTransaction, quote.requestId)

      if (result.success) {
        toast.success(`Swap successful! Signature: ${result.signature?.slice(0, 8)}...`)
        setInputAmount("")
        setOutputAmount("")
        setInputUSDValue("")
        setQuote(null)
      } else {
        toast.error(result.error || "Swap failed")
      }
    } catch (error) {
      console.error("[v0] Swap error:", error)
      toast.error(error instanceof Error ? error.message : "Swap failed")
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowDownUp className="h-5 w-5 text-accent" />
            Swap Tokens
          </CardTitle>
          <CardDescription>Exchange tokens instantly on Jupiter DEX</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Input Token Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">You Pay</Label>

              {/* Token Selection */}
              <button
                onClick={() => setShowInputTokenDialog(true)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {inputToken.logoURI && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={inputToken.logoURI || "/placeholder.svg"} />
                        <AvatarFallback>{inputToken.symbol[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-mono text-sm font-semibold">{inputToken.symbol}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Balance: {balance?.toFixed(4)}</span>
                </div>
              </button>

              {/* Input Amount - Token Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Token Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="bg-background/50"
                  step="any"
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">USD Value</Label>
                <Input
                  type="number"
                  placeholder="0.00 USD"
                  value={inputUSDValue}
                  onChange={(e) => handleUSDInput(e.target.value)}
                  className="bg-background/50"
                  step="any"
                  min="0"
                />
              </div>

              {balance && balance > 0 && (
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

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  const temp = inputToken
                  setInputToken(outputToken)
                  setOutputToken(temp)
                  setInputAmount("")
                  setOutputAmount("")
                  setInputUSDValue("")
                  setQuote(null)
                }}
                className="rounded-full"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Output Token Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">You Receive</Label>

              <button
                onClick={() => setShowOutputTokenDialog(true)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {outputToken.logoURI && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={outputToken.logoURI || "/placeholder.svg"} />
                      <AvatarFallback>{outputToken.symbol[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-mono text-sm font-semibold">{outputToken.symbol}</span>
                </div>
              </button>

              <Input type="number" placeholder="0.00" value={outputAmount} disabled className="bg-background/50" />
            </div>

            {/* Quote Details */}
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

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={!quote || isSwapping || isLoadingQuote || !publicKey}
              className="w-full"
              size="lg"
            >
              {!publicKey ? (
                "Connect Wallet"
              ) : isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : (
                `Swap ${inputToken.symbol} for ${outputToken.symbol}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Search Dialogs */}
      <TokenSearchDialog
        isOpen={showInputTokenDialog}
        onClose={() => setShowInputTokenDialog(false)}
        onSelect={(token) => {
          setInputToken(token)
          setShowInputTokenDialog(false)
          setInputAmount("")
          setOutputAmount("")
          setInputUSDValue("")
        }}
        tokens={tokens}
        excludeAddress={outputToken.address}
      />

      <TokenSearchDialog
        isOpen={showOutputTokenDialog}
        onClose={() => setShowOutputTokenDialog(false)}
        onSelect={(token) => {
          setOutputToken(token)
          setShowOutputTokenDialog(false)
          setInputAmount("")
          setOutputAmount("")
          setInputUSDValue("")
        }}
        tokens={tokens}
        excludeAddress={inputToken.address}
      />
    </div>
  )
}
