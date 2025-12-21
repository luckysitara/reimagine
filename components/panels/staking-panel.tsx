"use client"

import { useState } from "react"
import { Coins, TrendingUp, Info } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSolanaBalance } from "@/hooks/use-solana-balance"

export function StakingPanel() {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const { balance } = useSolanaBalance()
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")

  const marinadeAPY = 7.84 // Current APY from Marinade
  const projectedReturns = Number.parseFloat(stakeAmount || "0") * (marinadeAPY / 100)

  const handleStake = async () => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    // In production, integrate with Marinade SDK
    console.log("[v0] Staking", stakeAmount, "SOL with Marinade")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Liquid Staking</CardTitle>
            <CardDescription>Stake SOL and receive mSOL</CardDescription>
          </div>
          <Badge className="bg-success/10 text-success">{marinadeAPY}% APY</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stake" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="unstake">Unstake</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Stake</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">SOL</div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available: {balance.toFixed(4)} SOL</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setStakeAmount(balance.toString())}
                >
                  Max
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-semibold">{stakeAmount || "0"} mSOL</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-semibold">1 SOL = 1 mSOL</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Annual Rewards</span>
                <span className="font-semibold text-success">{projectedReturns.toFixed(4)} SOL</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Staking with Marinade gives you liquid mSOL tokens that can be traded or used in DeFi while earning
                rewards.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleStake} disabled={!publicKey || !stakeAmount}>
              {publicKey ? "Stake SOL" : "Connect Wallet to Stake"}
            </Button>
          </TabsContent>

          <TabsContent value="unstake" className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Unstake</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">mSOL</div>
              </div>
              <p className="text-xs text-muted-foreground">Available: 0 mSOL</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Unstaking Options</h4>

              <div className="space-y-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-accent" />
                      <span className="font-semibold">Instant Unstake</span>
                    </div>
                    <Badge variant="secondary">0.3% fee</Badge>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Swap mSOL for SOL instantly using the liquidity pool
                  </p>
                  <Button className="w-full bg-transparent" variant="outline" disabled>
                    Instant Unstake
                  </Button>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-semibold">Delayed Unstake</span>
                    </div>
                    <Badge variant="secondary">No fee</Badge>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Wait 2-3 days for unstaking with no fees</p>
                  <Button className="w-full bg-transparent" variant="outline" disabled>
                    Delayed Unstake
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
