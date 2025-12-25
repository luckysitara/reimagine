"use client"

import { useEffect, useState } from "react"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  requestNotificationPermission,
  registerServiceWorker,
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/services/notifications"

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderAlerts: true,
    priceAlerts: true,
    recommendations: true,
    enabled: true,
  })

  useEffect(() => {
    const initNotifications = async () => {
      // Register service worker
      await registerServiceWorker()

      // Get notification permission status
      const permission = Notification.permission
      setHasPermission(permission === "granted")

      // Load preferences
      const prefs = getNotificationPreferences()
      setPreferences(prefs)
    }

    initNotifications()
  }, [])

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission()
    setHasPermission(permission === "granted")

    if (permission === "granted") {
      const newPrefs = { ...preferences, enabled: true }
      setPreferences(newPrefs)
      setNotificationPreferences(newPrefs)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    setNotificationPreferences(newPrefs)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasPermission && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!hasPermission && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-sm">Enable Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get alerts for order fills, price targets, and AI recommendations
                  </p>
                  <Button onClick={handleEnableNotifications} className="w-full" size="sm">
                    Enable Notifications
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Alerts</CardTitle>
                    <CardDescription>Get notified when your limit orders fill</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Switch
                      checked={preferences.orderAlerts}
                      onCheckedChange={(value) => handlePreferenceChange("orderAlerts", value)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Price Alerts</CardTitle>
                    <CardDescription>Get notified when tokens reach target prices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Switch
                      checked={preferences.priceAlerts}
                      onCheckedChange={(value) => handlePreferenceChange("priceAlerts", value)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI Recommendations</CardTitle>
                    <CardDescription>Get notified of trading opportunities and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Switch
                      checked={preferences.recommendations}
                      onCheckedChange={(value) => handlePreferenceChange("recommendations", value)}
                    />
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-green-800">
                      <strong>✓ Ready to receive notifications</strong>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
