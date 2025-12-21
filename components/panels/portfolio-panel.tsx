"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Wallet, DollarSign, RefreshCw } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useSolanaBalance } from "@/hooks/use-solana-balance"
import { formatUSD, formatTokenAmount, formatPercentage } from "@/lib/utils/format"
import { getPortfolioValue, type PortfolioData } from "@/lib/services/helius"

export function PortfolioPanel() {
  const { publicKey } = useWallet()
  const { balance: solBalance } = useSolanaBalance()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadPortfolio = async () => {
    if (!publicKey) return

    setIsLoading(true)
    try {
      const data = await getPortfolioValue(publicKey.toBase58())
      setPortfolio(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("[v0] Failed to load portfolio:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (publicKey) {
      loadPortfolio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey])

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
          <CardDescription>Your Solana assets overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No Assets Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to view your Solana portfolio</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && !portfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
          <CardDescription>Loading your assets...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  const totalValueUSD = portfolio ? portfolio.totalValueUSD : solBalance * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>Your Solana assets overview</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={loadPortfolio} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Value
            </div>
            <p className="text-3xl font-bold">{formatUSD(totalValueUSD)}</p>
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="mr-1 h-3 w-3" />
              {formatPercentage(portfolio?.change24hPercent || 0)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              SOL Balance
            </div>
            <p className="text-3xl font-bold">{solBalance.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">{formatUSD(solBalance * 100)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Assets
            </div>
            <p className="text-3xl font-bold">{(portfolio?.tokens.length || 0) + 1}</p>
            <p className="text-xs text-muted-foreground">tokens</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Holdings</h3>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">Updated {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>

          <div className="space-y-2">
            {/* SOL Balance */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                    alt="SOL"
                  />
                  <AvatarFallback>SOL</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">SOL</div>
                  <div className="text-sm text-muted-foreground">Solana</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{solBalance.toFixed(4)}</div>
                <div className="text-sm text-muted-foreground">{formatUSD(solBalance * 100)}</div>
              </div>
            </div>

            {/* Token Holdings */}
            {portfolio?.tokens.map((token) => (
              <div
                key={token.mint}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {token.logoURI && (
                      <AvatarImage src={token.logoURI || "/placeholder.svg"} alt={token.symbol || "Token"} />
                    )}
                    <AvatarFallback>{token.symbol?.slice(0, 2) || "??"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{token.symbol || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{token.name || token.mint.slice(0, 8)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatTokenAmount(token.amount, token.decimals)}</div>
                  <div className="text-sm text-muted-foreground">
                    {token.valueUSD ? formatUSD(token.valueUSD) : "-"}
                  </div>
                </div>
              </div>
            ))}

            {portfolio && portfolio.tokens.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No token holdings found</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
