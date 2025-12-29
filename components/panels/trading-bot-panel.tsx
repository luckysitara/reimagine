"use client"

import { useState } from "react"
import { Bot, ArrowRight, Calendar, TrendingUp, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

export function TradingBotPanel() {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const [selectedStrategy, setSelectedStrategy] = useState<"dca" | "grid" | "limit" | null>(null)

  const strategies = [
    {
      id: "dca",
      name: "Dollar Cost Averaging",
      description: "Buy a fixed amount on a regular schedule to average out price volatility",
      icon: Calendar,
      color: "bg-accent/10",
      accentColor: "text-accent",
      buttonLabel: "Set Up DCA",
      route: "dca",
    },
    {
      id: "limit",
      name: "Limit Orders",
      description: "Execute trades automatically at your target price",
      icon: Target,
      color: "bg-primary/10",
      accentColor: "text-primary",
      buttonLabel: "Create Limit Order",
      route: "limit-orders",
    },
    {
      id: "grid",
      name: "Grid Trading",
      description: "Buy low and sell high automatically within a price range (Coming Soon)",
      icon: TrendingUp,
      color: "bg-success/10",
      accentColor: "text-success",
      buttonLabel: "Coming Soon",
      route: "grid",
      disabled: true,
    },
  ]

  const handleStrategyClick = (strategyId: string) => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    // Route to the appropriate panel via page navigation
    const strategy = strategies.find((s) => s.id === strategyId)
    if (strategy && !strategy.disabled) {
      // This would need to be handled by parent component with page routing
      setSelectedStrategy(strategyId as any)
    }
  }

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Trading Bots</CardTitle>
              <CardDescription>Automate your trading strategies</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Connect Your Wallet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to use trading bots</p>
            <Button className="mt-4" onClick={() => setVisible(true)}>
              Connect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" />
          <div>
            <CardTitle>Trading Bots</CardTitle>
            <CardDescription>Automate your trading strategies</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strategies.map((strategy) => {
            const IconComponent = strategy.icon
            return (
              <div key={strategy.id} className={`rounded-lg p-4 ${strategy.color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className={`mt-0.5 h-5 w-5 ${strategy.accentColor}`} />
                    <div>
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={strategy.disabled ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => handleStrategyClick(strategy.id)}
                    disabled={strategy.disabled}
                    className="whitespace-nowrap"
                  >
                    {strategy.buttonLabel}
                    {!strategy.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold">How to Use</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Select a trading strategy above</p>
            <p>2. Configure your parameters (token pair, amount, frequency, etc.)</p>
            <p>3. Review the transaction in your wallet</p>
            <p>4. Sign to create your automated trading bot</p>
            <p>5. Monitor your bot from the respective dashboard</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
