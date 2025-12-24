"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
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
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!tokens || tokens.length === 0) {
      setFilteredTokens([])
      return
    }

    setIsSearching(true)

    const timer = setTimeout(() => {
      const searchLower = search.toLowerCase().trim()

      if (searchLower === "") {
        // Show popular tokens first if no search
        setFilteredTokens(tokens.slice(0, 30))
        setIsSearching(false)
        return
      }

      const filtered = tokens
        .filter((token) => {
          if (excludeToken && token.address === excludeToken) return false

          return (
            token.symbol.toLowerCase().includes(searchLower) ||
            token.name.toLowerCase().includes(searchLower) ||
            token.address.toLowerCase().includes(searchLower)
          )
        })
        .slice(0, 100)

      setFilteredTokens(filtered)
      setIsSearching(false)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search, tokens, excludeToken])

  const handleSelect = (token: JupiterToken) => {
    onSelectToken(token)
    onOpenChange(false)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 flex-1 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] sm:h-[400px]">
            <div className="space-y-1 pr-4">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && filteredTokens.length > 0
                ? filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => handleSelect(token)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={token.logoURI || "/placeholder.svg"} alt={token.symbol} />
                        <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                      </div>
                    </button>
                  ))
                : !isSearching && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {search ? "No tokens found" : "Start typing to search tokens"}
                    </div>
                  )}
            </div>
          </ScrollArea>

          {filteredTokens.length > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Showing {filteredTokens.length} of {tokens.length} tokens
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
