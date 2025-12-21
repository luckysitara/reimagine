"use client"

import { useState } from "react"
import { Sparkles, ArrowLeftRight, Wallet, TrendingUp, Coins, ImageIcon, Target, Bot, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "AI Copilot", icon: Sparkles, href: "#copilot", section: "Trading" },
  { name: "Swap", icon: ArrowLeftRight, href: "#swap", section: "Trading" },
  { name: "Portfolio", icon: Wallet, href: "#portfolio", section: "Portfolio" },
  { name: "NFTs", icon: ImageIcon, href: "#nfts", section: "Portfolio" },
  { name: "Yield", icon: TrendingUp, href: "#yield", section: "DeFi" },
  { name: "Staking", icon: Coins, href: "#staking", section: "DeFi" },
  { name: "Token Studio", icon: Zap, href: "#studio", section: "Advanced" },
  { name: "Goals", icon: Target, href: "#goals", section: "Automation" },
  { name: "Autopilot", icon: Bot, href: "#autopilot", section: "Automation" },
]

export function LeftSidebar() {
  const [active, setActive] = useState("AI Copilot")

  const sections = Array.from(new Set(navigation.map((item) => item.section)))

  return (
    <aside className="hidden w-64 border-r border-border bg-sidebar lg:block">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Reimagine</span>
        </div>
      </div>

      <nav className="space-y-6 p-4">
        {sections.map((section) => (
          <div key={section}>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section}
            </h3>
            <div className="space-y-1">
              {navigation
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActive(item.name)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active === item.name
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
