// Service Worker for handling push notifications

self.addEventListener("message", (event) => {
  if (event.data.type === "SHOW_NOTIFICATION") {
    const { payload } = event.data
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/reimagine-icon.png",
      badge: payload.badge,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction ?? false,
      data: payload.data,
    })
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const data = event.notification.data

  if (data.type === "order" && data.orderId) {
    // Navigate to limit orders or trading history
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/?panel=limit-orders")
        }
      }),
    )
  }

  if (data.type === "price" && data.token) {
    // Navigate to token details
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`/?token=${data.token}`)
        }
      }),
    )
  }
})

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
    })
  }
})
