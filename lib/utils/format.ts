export function formatTokenAmount(amount: number, decimals = 9): string {
  const value = amount / Math.pow(10, decimals)
  if (value < 0.01) return value.toExponential(2)
  if (value < 1) return value.toFixed(4)
  if (value < 1000) return value.toFixed(2)
  if (value < 1000000) return `${(value / 1000).toFixed(2)}K`
  return `${(value / 1000000).toFixed(2)}M`
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatPercentage(value: number): string {
  const formatted = value.toFixed(2)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

export function formatSOL(amount: number): string {
  if (amount < 0.01) return amount.toFixed(4)
  if (amount < 1) return amount.toFixed(3)
  if (amount < 1000) return amount.toFixed(2)
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
