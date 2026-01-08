"use client"

import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Lock, Zap, BarChart3 } from "lucide-react"

export function ConnectionScreen() {
  const { setVisible } = useWalletModal()

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Trading",
      description: "Execute complex DeFi operations through natural language commands",
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Real-time tracking and AI-powered rebalancing recommendations",
    },
    {
      icon: Lock,
      title: "Non-Custodial",
      description: "Your assets, your control. We never hold your funds",
    },
  ]

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        {/* Logo and branding */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Reimagine DeFi</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            AI-powered trading, portfolio management, and DeFi automation on Solana. Start with one click.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-colors"
              >
                <Icon className="h-6 w-6 text-accent mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Call to action */}
        <div className="space-y-4">
          <Button size="lg" onClick={() => setVisible(true)} className="w-full md:w-auto px-8 gap-2 group">
            Connect Solana Wallet
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground">Supported wallets: Phantom, Solflare, and Backpack</p>
        </div>

        {/* Trust indicators */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-4">Your security is our priority</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-success" />
              <span>Non-custodial</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Open-source verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
