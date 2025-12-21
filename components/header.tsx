"use client"

import { Wallet, Copy, ExternalLink, LogOut, Check } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSolanaBalance } from "@/hooks/use-solana-balance"
import { formatAddress, formatSOL, formatUSD } from "@/lib/utils/format"
import { useState } from "react"

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const { balance } = useSolanaBalance()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleViewExplorer = () => {
    if (publicKey) {
      window.open(`https://solscan.io/account/${publicKey.toBase58()}`, "_blank")
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:ml-0 ml-12">
          <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
            Mainnet
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {publicKey && (
            <div className="hidden items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 md:flex">
              <div className="text-xs">
                <p className="text-muted-foreground">Balance</p>
                <p className="font-semibold tabular-nums">{formatSOL(balance)} SOL</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-xs">
                <p className="text-muted-foreground">Value</p>
                <p className="font-semibold tabular-nums">{formatUSD(balance * 100)}</p>
              </div>
            </div>
          )}

          {publicKey ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">{formatAddress(publicKey.toBase58())}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopy}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Address"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewExplorer}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Solscan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => setVisible(true)}>
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Wallet</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
