"use client"

import { useState } from "react"
import { Settings, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { RiskLimits } from "@/lib/services/autopilot-risk-manager"
import { DEFAULT_RISK_LIMITS } from "@/lib/services/autopilot-risk-manager"

interface AutopilotSettingsProps {
  walletAddress: string
  onSave?: (limits: Partial<RiskLimits>) => void
}

export function AutopilotSettingsDialog({ walletAddress, onSave }: AutopilotSettingsProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [limits, setLimits] = useState<Partial<RiskLimits>>(DEFAULT_RISK_LIMITS)
  const [enabledStrategies, setEnabledStrategies] = useState({
    "buy-dip": true,
    "take-profit": true,
    rebalance: false,
    sentiment: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/autopilot/risk-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          limits,
        }),
      })

      if (response.ok) {
        onSave?.(limits)
        setOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error saving autopilot settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Settings className="h-4 w-4" />
          Autopilot Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Autopilot Settings</DialogTitle>
          <DialogDescription>Configure risk limits and trading strategies</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="strategies" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="risk">Risk Limits</TabsTrigger>
            <TabsTrigger value="tokens">Token Control</TabsTrigger>
          </TabsList>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Enable/Disable Strategies</h3>
                <p className="text-xs text-muted-foreground">Choose which automatic trading strategies to use</p>
              </div>

              <div className="space-y-3">
                {/* Buy Dip Strategy */}
                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    id="buy-dip"
                    checked={enabledStrategies["buy-dip"]}
                    onCheckedChange={(checked) =>
                      setEnabledStrategies((prev) => ({ ...prev, "buy-dip": checked as boolean }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="buy-dip" className="font-medium">
                      Buy the Dip
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically buy tokens when price drops {">"}5%</p>
                    {enabledStrategies["buy-dip"] && (
                      <div className="mt-3 space-y-2 rounded-lg bg-card/50 p-2">
                        <div>
                          <Label className="text-xs">Drop Threshold (%)</Label>
                          <Input type="number" min="1" max="50" defaultValue="5" className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs">Max Order Size (USD)</Label>
                          <Input type="number" min="10" defaultValue="500" className="h-8 text-xs" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Take Profit Strategy */}
                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    id="take-profit"
                    checked={enabledStrategies["take-profit"]}
                    onCheckedChange={(checked) =>
                      setEnabledStrategies((prev) => ({ ...prev, "take-profit": checked as boolean }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="take-profit" className="font-medium">
                      Take Profit
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically sell when price rises {">"}10%</p>
                    {enabledStrategies["take-profit"] && (
                      <div className="mt-3 space-y-2 rounded-lg bg-card/50 p-2">
                        <div>
                          <Label className="text-xs">Rise Threshold (%)</Label>
                          <Input type="number" min="1" max="100" defaultValue="10" className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs">Sell at (% of price)</Label>
                          <Input type="number" min="80" max="100" defaultValue="95" className="h-8 text-xs" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rebalance Strategy */}
                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    id="rebalance"
                    checked={enabledStrategies.rebalance}
                    onCheckedChange={(checked) =>
                      setEnabledStrategies((prev) => ({ ...prev, rebalance: checked as boolean }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="rebalance" className="font-medium">
                      Portfolio Rebalance
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically rebalance to target allocation</p>
                    <Badge variant="outline" className="mt-2">
                      Coming Soon
                    </Badge>
                  </div>
                </div>

                {/* Sentiment Strategy */}
                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    id="sentiment"
                    checked={enabledStrategies.sentiment}
                    disabled
                    onCheckedChange={(checked) =>
                      setEnabledStrategies((prev) => ({ ...prev, sentiment: checked as boolean }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="sentiment" className="font-medium">
                      Sentiment Trading
                    </Label>
                    <p className="text-xs text-muted-foreground">Trade based on news and social sentiment</p>
                    <Badge variant="outline" className="mt-2">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Risk Limits Tab */}
          <TabsContent value="risk" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>These limits protect you from excessive losses. Set them carefully.</AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Daily Loss Limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Daily Loss Limit (USD)</Label>
                  <span className="text-sm font-medium">${limits.maxDailyLossUSD || 100}</span>
                </div>
                <Slider
                  min={10}
                  max={1000}
                  step={10}
                  defaultValue={[limits.maxDailyLossUSD || 100]}
                  onValueChange={(value) => setLimits((prev) => ({ ...prev, maxDailyLossUSD: value[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Autopilot will stop trading if daily loss exceeds this</p>
              </div>

              {/* Max Order Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Order Size (USD)</Label>
                  <span className="text-sm font-medium">${limits.maxOrderSizeUSD || 500}</span>
                </div>
                <Slider
                  min={50}
                  max={5000}
                  step={50}
                  defaultValue={[limits.maxOrderSizeUSD || 500]}
                  onValueChange={(value) => setLimits((prev) => ({ ...prev, maxOrderSizeUSD: value[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Single orders will not exceed this amount</p>
              </div>

              {/* Max Slippage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Slippage (%)</Label>
                  <span className="text-sm font-medium">{limits.maxSlippagePercent || 5}%</span>
                </div>
                <Slider
                  min={0.1}
                  max={20}
                  step={0.1}
                  defaultValue={[limits.maxSlippagePercent || 5]}
                  onValueChange={(value) => setLimits((prev) => ({ ...prev, maxSlippagePercent: value[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Orders rejected if slippage exceeds this</p>
              </div>

              {/* Portfolio Concentration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Single Token (%)</Label>
                  <span className="text-sm font-medium">{limits.maxPortfolioConcentration || 50}%</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  defaultValue={[limits.maxPortfolioConcentration || 50]}
                  onValueChange={(value) => setLimits((prev) => ({ ...prev, maxPortfolioConcentration: value[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Prevent over-concentration in single tokens</p>
              </div>
            </div>
          </TabsContent>

          {/* Token Control Tab */}
          <TabsContent value="tokens" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Control which tokens autopilot can trade. Leave whitelist empty to allow all.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Whitelist */}
              <div className="space-y-2">
                <Label>Whitelist (leave empty to allow all tokens)</Label>
                <Input
                  placeholder="SOL, USDC, BONK, JUP (comma-separated)"
                  defaultValue={limits.whitelistTokens?.join(", ") || ""}
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground">Only these tokens can be traded if set</p>
              </div>

              {/* Blacklist */}
              <div className="space-y-2">
                <Label>Blacklist</Label>
                <Input
                  placeholder="TOKEN1, TOKEN2 (comma-separated)"
                  defaultValue={limits.blacklistTokens?.join(", ") || ""}
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground">These tokens will never be traded</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
