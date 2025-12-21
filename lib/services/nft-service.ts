const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com"

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
    const response = await fetch(HELIUS_RPC_URL, {
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
      throw new Error(data.error.message)
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
