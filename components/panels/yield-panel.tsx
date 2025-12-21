"use client"

import { TrendingUp, Droplets, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface YieldOpportunity {
  protocol: string
  pool: string
  tokenA: string
  tokenB: string
  apy: number
  tvl: number
  risk: "Low" | "Medium" | "High"
  logoA?: string
  logoB?: string
}

const YIELD_OPPORTUNITIES: YieldOpportunity[] = [
  {
    protocol: "Orca",
    pool: "SOL-USDC",
    tokenA: "SOL",
    tokenB: "USDC",
    apy: 12.4,
    tvl: 45000000,
    risk: "Low",
    logoA:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    logoB:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    protocol: "Raydium",
    pool: "USDC-USDT",
    tokenA: "USDC",
    tokenB: "USDT",
    apy: 8.7,
    tvl: 32000000,
    risk: "Low",
    logoA:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    protocol: "Orca",
    pool: "mSOL-SOL",
    tokenA: "mSOL",
    tokenB: "SOL",
    apy: 15.2,
    tvl: 28000000,
    risk: "Low",
    logoB:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    protocol: "Raydium",
    pool: "SOL-RAY",
    tokenA: "SOL",
    tokenB: "RAY",
    apy: 24.8,
    tvl: 12000000,
    risk: "Medium",
    logoA:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
]

export function YieldPanel() {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-success/10 text-success"
      case "Medium":
        return "bg-warning/10 text-warning"
      case "High":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`
    if (tvl >= 1000) return `$${(tvl / 1000).toFixed(1)}K`
    return `$${tvl}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Yield Opportunities</CardTitle>
            <CardDescription>Provide liquidity and earn rewards</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {YIELD_OPPORTUNITIES.map((opportunity, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={opportunity.logoA || "/placeholder.svg"} alt={opportunity.tokenA} />
                    <AvatarFallback>{opportunity.tokenA[0]}</AvatarFallback>
                  </Avatar>
                  <Avatar className="absolute -right-2 -top-2 h-6 w-6 border-2 border-background">
                    <AvatarImage src={opportunity.logoB || "/placeholder.svg"} alt={opportunity.tokenB} />
                    <AvatarFallback>{opportunity.tokenB[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{opportunity.pool}</span>
                    <Badge variant="secondary" className="text-xs">
                      {opportunity.protocol}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>TVL: {formatTVL(opportunity.tvl)}</span>
                    <span>•</span>
                    <Badge variant="secondary" className={`text-xs ${getRiskColor(opportunity.risk)}`}>
                      {opportunity.risk} Risk
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-success">
                  <TrendingUp className="h-5 w-5" />
                  {opportunity.apy}%
                </div>
                <div className="text-xs text-muted-foreground">APY</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button className="flex-1 gap-2 bg-transparent" variant="outline">
                <Droplets className="h-4 w-4" />
                Add Liquidity
              </Button>
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
