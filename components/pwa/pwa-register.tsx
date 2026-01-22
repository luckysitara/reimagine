"use client"

import { useEffect, useState } from "react"

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: any) {
      // Prevent the browser prompt from showing automatically.
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setCanInstall(false)
      return choice.outcome === "accepted"
    } catch (e) {
      console.error("[PWA] promptInstall failed", e)
      return false
    }
  }

  return { canInstall, promptInstall }
}

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        // Register the single service-worker.js (keeps your push subscriptions intact)
        const reg = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
        console.log("[PWA] Service worker registered:", reg)
      } catch (err) {
        console.error("[PWA] Service worker registration failed:", err)
      }
    }

    // Only register on secure contexts (https) or localhost
    if (location.protocol === "https:" || location.hostname === "localhost") {
      register()
    }
  }, [])

  return null
}
