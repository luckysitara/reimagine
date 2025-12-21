"use client"

import { useState, useEffect } from "react"
import { ImageIcon, ExternalLink, RefreshCw } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getNFTsByOwner, type NFTAsset } from "@/lib/services/nft-service"

export function NFTPanel() {
  const { publicKey } = useWallet()
  const [nfts, setNfts] = useState<NFTAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null)

  const loadNFTs = async () => {
    if (!publicKey) return

    setIsLoading(true)
    try {
      const assets = await getNFTsByOwner(publicKey.toBase58())
      setNfts(assets)
    } catch (error) {
      console.error("[v0] Failed to load NFTs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (publicKey) {
      loadNFTs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey])

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Collection</CardTitle>
          <CardDescription>Your Solana NFTs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No NFTs Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to view your NFT collection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && nfts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Collection</CardTitle>
          <CardDescription>Loading your NFTs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NFT Collection</CardTitle>
              <CardDescription>{nfts.length} items</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={loadNFTs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {nfts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No NFTs Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your NFT collection will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {nfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => setSelectedNFT(nft)}
                  className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="truncate text-sm font-semibold">{nft.name}</h4>
                    {nft.collection && <p className="truncate text-xs text-muted-foreground">{nft.collection.name}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNFT && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNFT.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={selectedNFT.image || "/placeholder.svg"}
                    alt={selectedNFT.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-4">
                  {selectedNFT.description && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
                    </div>
                  )}

                  {selectedNFT.collection && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Collection</h4>
                      <Badge variant="secondary">{selectedNFT.collection.name}</Badge>
                    </div>
                  )}

                  {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Attributes</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {selectedNFT.attributes.map((attr, index) => (
                            <div key={index} className="flex justify-between rounded-lg border border-border p-2">
                              <span className="text-xs text-muted-foreground">{attr.trait_type}</span>
                              <span className="text-xs font-medium">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <Button className="w-full gap-2 bg-transparent" variant="outline" asChild>
                    <a
                      href={`https://solscan.io/token/${selectedNFT.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Solscan
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
