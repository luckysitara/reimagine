"use client"

import { useState } from "react"
import { Bot, TrendingUp, Calendar, Percent } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TradingBotPanel() {
  const [strategy, setStrategy] = useState<"dca" | "grid" | "limit">("dca")

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
        <Tabs value={strategy} onValueChange={(v) => setStrategy(v as typeof strategy)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dca">DCA</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
          </TabsList>

          <TabsContent value="dca" className="space-y-4">
            <div className="rounded-lg bg-accent/10 p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <h4 className="font-semibold">Dollar Cost Averaging</h4>
                  <p className="text-sm text-muted-foreground">
                    Buy a fixed amount on a regular schedule to average out price volatility
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Trading Pair</Label>
                <Select defaultValue="SOL-USDC">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL-USDC">SOL / USDC</SelectItem>
                    <SelectItem value="USDC-SOL">USDC / SOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount per Order</Label>
                <div className="relative">
                  <Input type="number" placeholder="100" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">USDC</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Every Day</SelectItem>
                    <SelectItem value="weekly">Every Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full">Create DCA Bot</Button>
          </TabsContent>

          <TabsContent value="grid" className="space-y-4">
            <div className="rounded-lg bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-success" />
                <div>
                  <h4 className="font-semibold">Grid Trading</h4>
                  <p className="text-sm text-muted-foreground">
                    Buy low and sell high automatically within a price range
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Trading Pair</Label>
                <Select defaultValue="SOL-USDC">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL-USDC">SOL / USDC</SelectItem>
                    <SelectItem value="USDC-SOL">USDC / SOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lower Price</Label>
                  <Input type="number" placeholder="80" />
                </div>
                <div className="space-y-2">
                  <Label>Upper Price</Label>
                  <Input type="number" placeholder="120" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Number of Grids</Label>
                <Input type="number" placeholder="10" />
              </div>

              <div className="space-y-2">
                <Label>Investment Amount</Label>
                <div className="relative">
                  <Input type="number" placeholder="1000" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">USDC</div>
                </div>
              </div>
            </div>

            <Button className="w-full">Create Grid Bot</Button>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <Percent className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Limit Orders</h4>
                  <p className="text-sm text-muted-foreground">Execute trades automatically at your target price</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select defaultValue="buy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trading Pair</Label>
                <Select defaultValue="SOL-USDC">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL-USDC">SOL / USDC</SelectItem>
                    <SelectItem value="USDC-SOL">USDC / SOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Price</Label>
                <div className="relative">
                  <Input type="number" placeholder="100" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">USDC</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <Input type="number" placeholder="1" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">SOL</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select defaultValue="7">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full">Create Limit Order</Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold">Active Bots</h4>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No active trading bots</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
