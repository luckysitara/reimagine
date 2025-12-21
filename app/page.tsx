"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { TradingPanel } from "@/components/panels/trading-panel"
import { PortfolioPanel } from "@/components/panels/portfolio-panel"
import { StakingPanel } from "@/components/panels/staking-panel"
import { YieldPanel } from "@/components/panels/yield-panel"
import { NFTPanel } from "@/components/panels/nft-panel"
import { TokenStudioPanel } from "@/components/panels/token-studio-panel"
import { TradingBotPanel } from "@/components/panels/trading-bot-panel"
import { SolanaCopilot } from "@/components/solana-copilot"

export default function Page() {
  const [activePanel, setActivePanel] = useState("Swap")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPanel = () => {
    switch (activePanel) {
      case "Swap":
        return <TradingPanel />
      case "AI Copilot":
        return <SolanaCopilot />
      case "Portfolio":
        return <PortfolioPanel />
      case "Yield":
        return <YieldPanel />
      case "Staking":
        return <StakingPanel />
      case "NFTs":
        return <NFTPanel />
      case "Token Studio":
        return <TokenStudioPanel />
      case "Autopilot":
        return <TradingBotPanel />
      case "Goals":
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Goals feature coming soon</p>
          </div>
        )
      default:
        return <TradingPanel />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <CollapsibleSidebar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onCollapseChange={setSidebarCollapsed}
      />

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? "ml-0 lg:ml-16" : "ml-0 lg:ml-64"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">{renderPanel()}</div>
        </main>
      </div>
    </div>
  )
}
