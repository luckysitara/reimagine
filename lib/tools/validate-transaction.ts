import { type Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { estimateGasFee } from "@/lib/services/jupiter"

export interface TransactionValidation {
  valid: boolean
  hasEnoughBalance: boolean
  hasEnoughForFees: boolean
  balance: number
  requiredAmount: number
  estimatedFee: number
  totalRequired: number
  errorMessage?: string
}

export async function validateWalletBalance(
  walletAddress: string,
  requiredAmountLamports: number,
  connection: Connection,
): Promise<TransactionValidation> {
  try {
    console.log("[v0] Validating wallet balance for:", walletAddress)

    // Get wallet SOL balance
    const balance = await connection.getBalance(new PublicKey(walletAddress))
    const balanceSOL = balance / LAMPORTS_PER_SOL

    const estimatedFee = await estimateGasFee()
    const estimatedFeeSOL = estimatedFee / LAMPORTS_PER_SOL

    const requiredAmountSOL = requiredAmountLamports / LAMPORTS_PER_SOL
    const totalRequired = requiredAmountSOL + estimatedFeeSOL

    const hasEnoughBalance = balance >= requiredAmountLamports
    const hasEnoughForFees = balance >= requiredAmountLamports + estimatedFee

    console.log("[v0] Balance validation:", {
      balance: balanceSOL,
      required: requiredAmountSOL,
      fee: estimatedFeeSOL,
      hasEnoughBalance,
      hasEnoughForFees,
    })

    if (!hasEnoughBalance) {
      return {
        valid: false,
        hasEnoughBalance: false,
        hasEnoughForFees: false,
        balance: balanceSOL,
        requiredAmount: requiredAmountSOL,
        estimatedFee: estimatedFeeSOL,
        totalRequired,
        errorMessage: `Insufficient balance. You have ${balanceSOL.toFixed(
          3,
        )} SOL but need ${totalRequired.toFixed(3)} SOL (${requiredAmountSOL.toFixed(
          3,
        )} + ${estimatedFeeSOL.toFixed(3)} SOL for fees)`,
      }
    }

    if (!hasEnoughForFees) {
      return {
        valid: false,
        hasEnoughBalance: true,
        hasEnoughForFees: false,
        balance: balanceSOL,
        requiredAmount: requiredAmountSOL,
        estimatedFee: estimatedFeeSOL,
        totalRequired,
        errorMessage: `Insufficient balance for fees. You have ${balanceSOL.toFixed(
          3,
        )} SOL but need ${totalRequired.toFixed(3)} SOL including network fees (${estimatedFeeSOL.toFixed(3)} SOL)`,
      }
    }

    return {
      valid: true,
      hasEnoughBalance: true,
      hasEnoughForFees: true,
      balance: balanceSOL,
      requiredAmount: requiredAmountSOL,
      estimatedFee: estimatedFeeSOL,
      totalRequired,
    }
  } catch (error) {
    console.error("[v0] Balance validation error:", error)
    return {
      valid: false,
      hasEnoughBalance: false,
      hasEnoughForFees: false,
      balance: 0,
      requiredAmount: 0,
      estimatedFee: 0,
      totalRequired: 0,
      errorMessage: `Failed to validate balance: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export function formatSOLAmount(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4)
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`
  }
  return `$${amount.toFixed(2)}`
}
