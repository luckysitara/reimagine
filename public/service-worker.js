// Service Worker - notifications + minimal PWA caching
const CACHE_NAME = "reimagine-app-shell-v1"
const APP_SHELL = [
  "/",
  "/favicon.ico",
  "/icon-light-32x32.png",
  "/icon-dark-32x32.png",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  // Note: Next.js assets live under _next/static and are hashed. If you want to precache
  // build-time assets reliably, consider a Workbox build step instead.
]

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // don't fail the install if a single resource 404s; still try to continue
        console.warn("[SW] cache.addAll failed:", err)
      })
    }),
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// Fetch: cache-first for app shell, network-first for others (APIs)
self.addEventListener("fetch", (event) => {
  const request = event.request

  // Only handle GET requests
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Treat navigation requests as app-shell
  if (request.mode === "navigate" || APP_SHELL.some((p) => p !== "/" && url.pathname === p)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((res) => {
            // Cache a copy for next time
            const resClone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone))
            return res
          })
          .catch(async () => {
            const root = await caches.match("/")
            return root || new Response("Offline", { status: 503, statusText: "Service Unavailable" })
          })
      }),
    )
    return
  }

  // Default: network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // If both network and cache fail, return a 404 Response to avoid SW 'undefined' error
        return new Response("Not found", { status: 404, statusText: "Not Found" })
      }),
  )
})

// Message -> show notification (keeps your existing API)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
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

// Notification click handling (preserves existing behavior)
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data || {}

  if (data.type === "order" && data.orderId) {
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
    return
  }

  if (data.type === "price" && data.token) {
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
    return
  }
})

// Push -> show notification (preserves existing behavior)
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json()
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
      })
    } catch (e) {
      console.error("[SW] push event parse failed", e)
    }
  }
})
