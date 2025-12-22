export const JUPITER_API_URLS = {
  ultra: "https://api.jup.ag/ultra/v1",
  trigger: "https://api.jup.ag/trigger/v1",
  recurring: "https://api.jup.ag/recurring/v1",
  send: "https://api.jup.ag/send/v1",
  lend: "https://api.jup.ag/lend/v1",
  portfolio: "https://api.jup.ag/portfolio/v1",
  price: "https://api.jup.ag/price/v2",
  tokens: "https://api.jup.ag/tokens/v1",
  studio: "https://api.jup.ag/studio/v1",
  lock: "https://api.jup.ag/lock/v1",
} as const

export function getJupiterHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  // Only access env variable when function is called, not at module load
  if (typeof window === "undefined") {
    const apiKey = process.env.JUPITER_API_KEY
    if (apiKey) {
      headers["x-api-key"] = apiKey
    }
  }

  return headers
}
