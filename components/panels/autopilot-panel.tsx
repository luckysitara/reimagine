"use client"

import { useEffect, useState } from "react"
import { Activity, Bot, Zap, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ExecutedOrder } from "@/lib/tools/execute-autopilot-order"

interface ExecutionStats {
  totalExecutions: number
  successCount: number
  failureCount: number
  successRate: number
  byStrategy: Record<string, number>
}

export function AutopilotPanel({ walletAddress }: { walletAddress: string }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ExecutionStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<ExecutedOrder[]>([])
  const [activeStrategies, setActiveStrategies] = useState<string[]>(["buy-dip", "take-profit"])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch execution stats and recent orders
  useEffect(() => {
    if (!isEnabled) return

    const fetchStats = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/autopilot/execute?action=stats"),
          fetch("/api/autopilot/execute?limit=10"),
        ])

        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
        if (ordersRes.ok) {
          setRecentOrders(await ordersRes.json())
        }
        setLastUpdate(new Date())
      } catch (error) {
        console.error("[v0] Error fetching autopilot stats:", error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [isEnabled])

  const toggleAutopilot = async () => {
    setIsLoading(true)
    try {
      const endpoint = isEnabled ? "/api/autopilot/disable" : "/api/autopilot/enable"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      })

      if (response.ok) {
        setIsEnabled(!isEnabled)
      }
    } catch (error) {
      console.error("[v0] Error toggling autopilot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Autopilot</CardTitle>
              <CardDescription>Autonomous trading strategies powered by AI</CardDescription>
            </div>
          </div>
          <Button
            onClick={toggleAutopilot}
            disabled={isLoading}
            variant={isEnabled ? "default" : "outline"}
            className="gap-2"
          >
            <Bot className="h-4 w-4" />
            {isEnabled ? "Disable" : "Enable"} Autopilot
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">{isEnabled ? "Active" : "Inactive"}</p>
              </div>
              <div className={`h-3 w-3 rounded-full ${isEnabled ? "bg-green-500" : "bg-muted-foreground"}`} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats?.successRate.toFixed(1) || 0}%</p>
              </div>
              <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-bold">{stats?.successCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {isEnabled && (
          <Tabs defaultValue="strategies" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="strategies">Active Strategies</TabsTrigger>
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            </TabsList>

            {/* Active Strategies Tab */}
            <TabsContent value="strategies" className="space-y-4">
              <div className="space-y-2">
                {["buy-dip", "take-profit", "rebalance", "sentiment"].map((strategy) => (
                  <div key={strategy} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-accent" />
                      <div>
                        <p className="font-medium capitalize">{strategy.replace(/-/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{stats?.byStrategy[strategy] || 0} executions</p>
                      </div>
                    </div>
                    <Badge variant={activeStrategies.includes(strategy) ? "default" : "secondary"}>
                      {activeStrategies.includes(strategy) ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recent Activity Tab */}
            <TabsContent value="recent" className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent autopilot executions</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start gap-3">
                        {order.status === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {order.action.toUpperCase()} {order.inputToken} → {order.outputToken}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{order.strategy}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.inputAmount.toFixed(4)}</p>
                        {order.error && <p className="text-xs text-destructive">{order.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!isEnabled && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
            <Zap className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-2 font-semibold">Autopilot is Disabled</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enable autopilot to start autonomous trading with AI-powered strategies
            </p>
            <Button onClick={toggleAutopilot} className="mt-4" size="sm">
              Enable Autopilot
            </Button>
          </div>
        )}

        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
