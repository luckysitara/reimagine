"use client"

import React from "react"
import { usePWAInstallPrompt } from "@/components/pwa/pwa-register"

export default function InstallButton() {
  const { canInstall, promptInstall } = usePWAInstallPrompt()

  if (!canInstall) return null

  const handleClick = async () => {
    try {
      const accepted = await promptInstall()
      if (accepted) {
        console.log("[PWA] User accepted installation")
      } else {
        console.log("[PWA] User dismissed installation")
      }
    } catch (err) {
      console.error("[PWA] install prompt failed", err)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      aria-label="Install Reimagine"
      title="Install Reimagine"
      type="button"
    >
      Install
    </button>
  )
}
