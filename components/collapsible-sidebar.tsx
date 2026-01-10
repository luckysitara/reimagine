"use client"

import { useState } from "react"
import {
  Sparkles,
  ArrowLeftRight,
  Wallet,
  ImageIcon,
  Target,
  Bot,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  Repeat,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Swap", icon: ArrowLeftRight, href: "#swap" },
  { name: "Token Discovery", icon: TrendingUp, href: "#discovery" },
  { name: "AI Copilot", icon: Sparkles, href: "#copilot" },
  { name: "Portfolio", icon: Wallet, href: "#portfolio" },
  { name: "Limit Orders", icon: Target, href: "#limit-orders" },
  { name: "DCA", icon: Repeat, href: "#dca" },
  { name: "NFTs", icon: ImageIcon, href: "#nfts" },
  { name: "Token Studio", icon: Zap, href: "#studio" },
  { name: "Autopilot", icon: Bot, href: "#autopilot" },
  { name: "Goals", icon: TrendingUp, href: "#goals" },
]

interface CollapsibleSidebarProps {
  activePanel: string
  onPanelChange: (panel: string) => void
  onCollapseChange?: (collapsed: boolean) => void
}

export function CollapsibleSidebar({ activePanel, onPanelChange, onCollapseChange }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleCollapseToggle = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Reimagine</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent mx-auto">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto h-[calc(100vh-8rem)]">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = activePanel === item.name
            return (
              <button
                key={item.name}
                onClick={() => {
                  onPanelChange(item.name)
                  setMobileOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
                {!collapsed && <span>{item.name}</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <Button variant="ghost" size="sm" onClick={handleCollapseToggle} className="w-full justify-center">
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
