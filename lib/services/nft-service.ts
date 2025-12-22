/**
 * NFT Service - Helius DAS API integration
 *
 * Uses secure RPC proxy on client-side to protect API keys
 */

function getHeliusRPCUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/solana/rpc" // Use secure proxy on client-side
  }

  const url = process.env.HELIUS_RPC_URL
  if (!url) {
    throw new Error("HELIUS_RPC_URL environment variable is required for server-side operations")
  }

  return url
}

export interface NFTAsset {
  id: string
  name: string
  image: string
  description?: string
  collection?: {
    name: string
    family: string
  }
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

export async function getNFTsByOwner(walletAddress: string): Promise<NFTAsset[]> {
  try {
    const rpcUrl = getHeliusRPCUrl()

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "nft-query",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showCollectionMetadata: true,
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch NFTs")
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch NFTs")
    }

    const assets: NFTAsset[] = data.result.items.map((item: Record<string, unknown>) => ({
      id: item.id,
      name: (item.content as { metadata?: { name?: string } })?.metadata?.name || "Unknown NFT",
      image: (item.content as { links?: { image?: string } })?.links?.image || "/digital-art-collection.png",
      description: (item.content as { metadata?: { description?: string } })?.metadata?.description,
      collection: item.grouping?.[0]
        ? {
            name: (item.grouping as Array<{ group_value: string }>)[0].group_value,
            family: "Collection",
          }
        : undefined,
      attributes: (item.content as { metadata?: { attributes?: Array<{ trait_type: string; value: string }> } })
        ?.metadata?.attributes,
    }))

    console.log("[v0] NFTs fetched:", assets.length, "assets")

    return assets
  } catch (error) {
    console.error("[v0] Error fetching NFTs:", error)
    throw error
  }
}
