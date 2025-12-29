"use client"

import { useEffect, useState } from "react"
import { Activity, Bot, Zap, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "sonner"

interface ExecutionStats {
  totalExecutions: number
  successCount: number
  failureCount: number
  successRate: number
  byStrategy: Record<string, number>
}

export function AutopilotPanel() {
  const { publicKey } = useWallet()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ExecutionStats | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!publicKey) return

    if (!isEnabled) return

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/autopilot/status", {
          headers: { "X-Wallet-Address": publicKey.toBase58() },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error("[v0] Error fetching autopilot stats:", error)
      }
    }

    // Initial fetch
    fetchStats()

    // Poll every 30 seconds when enabled
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [isEnabled, publicKey])

  const handleToggle = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsLoading(true)
    try {
      const endpoint = isEnabled ? "/api/autopilot/disable" : "/api/autopilot/enable"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": publicKey.toBase58(),
        },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      })

      if (response.ok) {
        setIsEnabled(!isEnabled)
        toast.success(isEnabled ? "Autopilot disabled" : "Autopilot enabled")
      } else {
        toast.error("Failed to toggle autopilot")
      }
    } catch (error) {
      console.error("[v0] Error toggling autopilot:", error)
      toast.error("Failed to toggle autopilot")
    } finally {
      setIsLoading(false)
    }
  }

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autopilot</CardTitle>
          <CardDescription>Monitor and manage your automated trading strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-2 font-semibold">Connect Your Wallet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Connect your wallet to use Autopilot features</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Autopilot</CardTitle>
              <CardDescription>Autonomous trading strategy monitor</CardDescription>
            </div>
          </div>
          <Button onClick={handleToggle} disabled={isLoading} variant={isEnabled ? "default" : "outline"} size="sm">
            <Bot className="mr-2 h-4 w-4" />
            {isEnabled ? "Disable" : "Enable"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className={`h-3 w-3 rounded-full ${isEnabled ? "bg-green-500" : "bg-muted-foreground"}`} />
            </div>
            <p className="text-2xl font-bold">{isEnabled ? "Active" : "Inactive"}</p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Executions</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.successRate.toFixed(1) || 0}%</p>
          </div>
        </div>

        {isEnabled && stats && (
          <Tabs defaultValue="strategies" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>

            <TabsContent value="strategies" className="space-y-3">
              <div className="space-y-2">
                {Object.entries(stats.byStrategy).map(([strategy, count]) => (
                  <div key={strategy} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      <span className="font-medium capitalize">{strategy.replace(/-/g, " ")}</span>
                    </div>
                    <Badge variant="secondary">{count} executions</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Success Count</span>
                  <span className="font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {stats.successCount}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Failed Executions</span>
                  <span className="font-medium flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {stats.failureCount}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!isEnabled && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Zap className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-2 font-semibold">Autopilot Disabled</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enable autopilot to monitor your trading strategies</p>
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
