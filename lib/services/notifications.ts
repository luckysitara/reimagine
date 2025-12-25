/**
 * Notification Service - Web and Mobile Push Notifications
 * Handles order alerts, price alerts, and trading notifications
 */

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag: string
  requireInteraction?: boolean
  data?: Record<string, any>
}

export interface OrderAlert {
  orderId: string
  type: "filled" | "partial" | "cancelled"
  token: string
  price: number
  amount: number
  timestamp: number
}

export interface PriceAlert {
  token: string
  currentPrice: number
  targetPrice: number
  type: "above" | "below"
  timestamp: number
}

// Register service worker for web notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    console.log("[v0] Service workers or notifications not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
    })
    console.log("[v0] Service worker registered:", registration)
    return registration
  } catch (error) {
    console.error("[v0] Service worker registration failed:", error)
    return null
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("[v0] Notifications not supported")
    return "denied"
  }

  if (Notification.permission === "granted") {
    return "granted"
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

// Send notification
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    if (!("Notification" in window)) {
      console.log("[v0] Notifications not supported")
      return false
    }

    if (Notification.permission !== "granted") {
      console.log("[v0] Notification permission not granted")
      return false
    }

    // Try to send via service worker first
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        payload,
      })
      return true
    }

    // Fallback to direct notification
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/reimagine-icon.png",
      badge: payload.badge,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction ?? false,
      data: payload.data,
    })

    return true
  } catch (error) {
    console.error("[v0] Failed to send notification:", error)
    return false
  }
}

// Send order alert notification
export async function notifyOrderFilled(alert: OrderAlert): Promise<boolean> {
  const typeLabel = alert.type === "filled" ? "Filled" : alert.type === "partial" ? "Partially Filled" : "Cancelled"

  return sendNotification({
    title: `Order ${typeLabel}`,
    body: `Your ${alert.token} order for ${alert.amount} units at ${alert.price} USD has been ${alert.type}`,
    icon: "/order-icon.png",
    tag: `order-${alert.orderId}`,
    requireInteraction: true,
    data: {
      type: "order",
      orderId: alert.orderId,
      token: alert.token,
    },
  })
}

// Send price alert notification
export async function notifyPriceAlert(alert: PriceAlert): Promise<boolean> {
  const direction = alert.type === "above" ? "above" : "below"

  return sendNotification({
    title: `Price Alert: ${alert.token}`,
    body: `${alert.token} is now ${direction} your target price of ${alert.targetPrice} USD (current: ${alert.currentPrice} USD)`,
    icon: "/price-icon.png",
    tag: `price-${alert.token}-${alert.type}`,
    data: {
      type: "price",
      token: alert.token,
      currentPrice: alert.currentPrice,
      targetPrice: alert.targetPrice,
    },
  })
}

// Send trading recommendation notification
export async function notifyTradingRecommendation(
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> {
  return sendNotification({
    title,
    body,
    icon: "/ai-icon.png",
    tag: "trading-recommendation",
    data: {
      type: "recommendation",
      ...data,
    },
  })
}

// Get local storage for notification preferences
export interface NotificationPreferences {
  orderAlerts: boolean
  priceAlerts: boolean
  recommendations: boolean
  enabled: boolean
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderAlerts: true,
  priceAlerts: true,
  recommendations: true,
  enabled: true,
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES

  const stored = localStorage.getItem("notification-preferences")
  return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES
}

export function setNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("notification-preferences", JSON.stringify(prefs))
  }
}
