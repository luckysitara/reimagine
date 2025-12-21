import { getPortfolioValue, type PortfolioData } from "../services/helius"

export interface PortfolioAnalysis extends PortfolioData {
  recommendations: string[]
  riskLevel: "low" | "medium" | "high"
  diversification: {
    score: number
    message: string
  }
}

export async function analyzePortfolio(walletAddress: string): Promise<PortfolioAnalysis> {
  const portfolio = await getPortfolioValue(walletAddress)

  const recommendations: string[] = []
  let riskLevel: "low" | "medium" | "high" = "medium"

  // Calculate diversification
  const totalAssets = 1 + portfolio.tokens.length // SOL + tokens
  const solPercentage = (portfolio.solBalance / (portfolio.totalValueUSD / 100)) * 100

  let diversificationScore = 0
  let diversificationMessage = ""

  if (totalAssets === 1) {
    diversificationScore = 20
    diversificationMessage = "Portfolio is not diversified. Consider adding more assets."
    recommendations.push("Add more tokens to your portfolio for better diversification")
    riskLevel = "high"
  } else if (totalAssets < 5) {
    diversificationScore = 50
    diversificationMessage = "Portfolio has moderate diversification."
    recommendations.push("Consider adding a few more quality tokens")
    riskLevel = "medium"
  } else {
    diversificationScore = 80
    diversificationMessage = "Portfolio is well diversified!"
    riskLevel = "low"
  }

  // SOL concentration check
  if (solPercentage > 70) {
    recommendations.push("High SOL concentration detected. Consider diversifying into other tokens.")
  }

  // Add general recommendations
  if (portfolio.tokens.length === 0) {
    recommendations.push("Start by swapping some SOL for stablecoins (USDC) or popular tokens")
  }

  if (portfolio.totalValueUSD > 100) {
    recommendations.push("Consider liquid staking your SOL with Marinade to earn passive income")
  }

  return {
    ...portfolio,
    recommendations,
    riskLevel,
    diversification: {
      score: diversificationScore,
      message: diversificationMessage,
    },
  }
}
