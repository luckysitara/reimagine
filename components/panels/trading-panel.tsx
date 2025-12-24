"use client"

import { useState, useEffect } from "react"
import { ArrowDownUp, Settings, Loader2, AlertCircle } from "lucide-react"
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

export function TradingPanel() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const { balance } = useSolanaBalance()

  const [tokens, setTokens] = useState<JupiterToken[]>([])
  const [walletTokens, setWalletTokens] = useState<JupiterToken[]>([])
  const [inputToken, setInputToken] = useState<JupiterToken>(DEFAULT_SOL)
  const [outputToken, setOutputToken] = useState<JupiterToken>(DEFAULT_USDC)
  const [inputAmount, setInputAmount] = useState("")
  const [outputAmount, setOutputAmount] = useState("")
  const [quote, setQuote] = useState<JupiterQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showInputTokenDialog, setShowInputTokenDialog] = useState(false)
  const [showOutputTokenDialog, setShowOutputTokenDialog] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  useEffect(() => {
    getJupiterTokenList()
      .then((allTokens) => {
        setTokens(allTokens)
        setWalletTokens([DEFAULT_SOL])
      })
      .catch((err) => {
        console.error("[v0] Failed to load tokens:", err)
        toast.error("Failed to load token list")
      })
  }, [])

  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (!publicKey) {
        setWalletTokens([DEFAULT_SOL])
        return
      }

      try {
        const response = await fetch(`/api/portfolio?wallet=${publicKey.toBase58()}`)
        if (!response.ok) {
          console.error("[v0] Failed to fetch wallet tokens")
          setWalletTokens([DEFAULT_SOL])
          return
        }

        const data = await response.json()
        const walletTokensList: JupiterToken[] = [
          DEFAULT_SOL,
          ...(data.tokens || []).map((token: any) => ({
            address: token.mint,
            symbol: token.symbol || "UNKNOWN",
            name: token.name || "Unknown Token",
            decimals: token.decimals || 6,
            logoURI: token.logoURI,
          })),
        ]

        setWalletTokens(walletTokensList)
      } catch (error) {
        console.error("[v0] Error fetching wallet tokens:", error)
        setWalletTokens([DEFAULT_SOL])
      }
    }

    fetchWalletTokens()
  }, [publicKey])

  useEffect(() => {
    if (!inputAmount || Number.parseFloat(inputAmount) <= 0) {
      setQuote(null)
      setOutputAmount("")
      setQuoteError(null)
      return
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
  }, [inputAmount, inputToken, outputToken, publicKey])

  const fetchQuote = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet to get quotes")
      return
    }

    try {
      setIsLoadingQuote(true)
      setQuoteError(null)
      const amount = Math.floor(Number.parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))

      console.log("[v0] Fetching Jupiter Ultra order for:", {
        input: inputToken.symbol,
        output: outputToken.symbol,
        amount,
        wallet: publicKey.toBase58(),
      })

      const quoteResponse = await getJupiterQuote(
        inputToken.address,
        outputToken.address,
        amount,
        100,
        publicKey.toBase58(),
      )

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
          setQuoteError(`Insufficient ${inputToken.symbol} balance. Please reduce the amount or add more funds.`)
        } else if (error.message.includes("liquidity")) {
          setQuoteError(`No liquidity available for this ${inputToken.symbol}/${outputToken.symbol} pair.`)
        } else if (error.message.includes("swap route")) {
          setQuoteError(`No swap route found. Try a different token pair or smaller amount.`)
        } else {
          setQuoteError(error.message)
        }
      } else {
        setQuoteError("Failed to get quote. Please try again.")
      }
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleSwap = async () => {
    if (!publicKey || !signTransaction) {
      setVisible(true)
      return
    }

    if (!quote) {
      toast.error("No quote available")
      return
    }

    try {
      setIsSwapping(true)
      toast.loading("Preparing swap transaction...")

      console.log("[v0] Starting swap with quote:", {
        inputMint: quote.inputMint,
        outputMint: quote.outputMint,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        hasTransaction: !!quote.transaction,
        requestId: quote.requestId,
      })

      toast.loading("Waiting for wallet signature...")

      const result = await executeSwap(connection, quote.transaction, signTransaction, quote.requestId)

      if (result.success) {
        toast.success("Swap successful!", {
          description: (
            <a
              href={`https://solscan.io/tx/${result.signature}${
                process.env.NEXT_PUBLIC_SOLANA_NETWORK !== "mainnet-beta" ? "?cluster=devnet" : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Solscan
            </a>
          ),
        })
        setInputAmount("")
        setOutputAmount("")
        setQuote(null)
        setQuoteError(null)
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

  const handleFlipTokens = () => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setInputAmount(outputAmount)
    setOutputAmount("")
    setQuote(null)
    setQuoteError(null)
  }

  const priceImpact = quote ? Number.parseFloat(quote.priceImpactPct) : 0
  const priceImpactColor = priceImpact < 1 ? "text-success" : priceImpact < 3 ? "text-warning" : "text-destructive"

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>Trade any Solana token instantly</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quoteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{quoteError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>You Pay</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                className="flex-1"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
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
            <p className="text-xs text-muted-foreground">
              Balance: {inputToken.symbol === "SOL" ? balance.toFixed(4) : "0"} {inputToken.symbol}
            </p>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleFlipTokens}>
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>You Receive</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="0.00" className="flex-1" value={outputAmount} readOnly />
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
            <p className="text-xs text-muted-foreground">
              Balance: {outputToken.symbol === "SOL" ? balance.toFixed(4) : "0"} {outputToken.symbol}
            </p>
          </div>

          {quote && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">
                  1 {inputToken.symbol} ≈{" "}
                  {(Number.parseFloat(outputAmount) / Number.parseFloat(inputAmount)).toFixed(4)} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-medium ${priceImpactColor}`}>{Math.abs(priceImpact).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">~0.00005 SOL</span>
              </div>
              {Math.abs(priceImpact) > 3 && (
                <Alert variant="default" className="mt-2 border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs">
                    High price impact! Consider reducing the amount.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSwap}
            disabled={!publicKey || !quote || isSwapping || isLoadingQuote || !!quoteError}
          >
            {isSwapping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : isLoadingQuote ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : !publicKey ? (
              "Connect Wallet to Swap"
            ) : quoteError ? (
              "Cannot Swap"
            ) : !quote ? (
              "Enter Amount"
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </Card>

      <TokenSearchDialog
        open={showInputTokenDialog}
        onOpenChange={setShowInputTokenDialog}
        onSelectToken={setInputToken}
        tokens={walletTokens}
        excludeToken={outputToken.address}
        title="Select Token to Pay"
      />

      <TokenSearchDialog
        open={showOutputTokenDialog}
        onOpenChange={setShowOutputTokenDialog}
        onSelectToken={setOutputToken}
        tokens={tokens}
        excludeToken={inputToken.address}
        title="Select Token to Receive"
      />
    </>
  )
}
