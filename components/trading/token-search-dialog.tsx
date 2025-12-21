"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { JupiterToken } from "@/lib/services/jupiter"

interface TokenSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectToken: (token: JupiterToken) => void
  tokens: JupiterToken[]
  excludeToken?: string
}

export function TokenSearchDialog({ open, onOpenChange, onSelectToken, tokens, excludeToken }: TokenSearchDialogProps) {
  const [search, setSearch] = useState("")
  const [filteredTokens, setFilteredTokens] = useState<JupiterToken[]>([])

  useEffect(() => {
    if (!tokens) return

    const filtered = tokens
      .filter((token) => {
        if (excludeToken && token.address === excludeToken) return false

        const searchLower = search.toLowerCase()
        return (
          token.symbol.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower) ||
          token.address.toLowerCase().includes(searchLower)
        )
      })
      .slice(0, 50)

    setFilteredTokens(filtered)
  }, [search, tokens, excludeToken])

  const handleSelect = (token: JupiterToken) => {
    onSelectToken(token)
    onOpenChange(false)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={token.logoURI || "/placeholder.svg"} alt={token.symbol} />
                    <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                </button>
              ))}

              {filteredTokens.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No tokens found</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
