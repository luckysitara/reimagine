"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader, X } from "lucide-react"

interface TransactionDetails {
  type: "swap" | "token_creation" | "limit_order" | "dca_order"
  description: string
  details: Record<string, string | number>
  estimatedGasFee: number
  totalCost: number
  balanceWarning?: string
}

interface WalletConfirmationModalProps {
  isOpen: boolean
  transaction: TransactionDetails | null
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
  insufficient: boolean
}

export function WalletConfirmationModal({
  isOpen,
  transaction,
  isLoading,
  onConfirm,
  onCancel,
  insufficient,
}: WalletConfirmationModalProps) {
  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-dark-surface border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-semibold">Confirm Transaction</h2>
          <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Type Badge */}
          <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-medium">
            {transaction.type
              .split("_")
              .map((w) => w[0].toUpperCase() + w.slice(1))
              .join(" ")}
          </div>

          {/* Description */}
          <p className="text-gray-300">{transaction.description}</p>

          {/* Transaction Details */}
          <div className="bg-dark-bg rounded-lg p-4 space-y-3">
            {Object.entries(transaction.details).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {key
                    .split("_")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")}
                </span>
                <span className="font-medium">{typeof value === "number" ? value.toFixed(4) : value}</span>
              </div>
            ))}
          </div>

          {/* Gas Fee */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-amber-400" />
              <span className="font-medium text-amber-400">Network Fees</span>
            </div>
            <div className="text-sm text-amber-300/80">
              Estimated gas fee: <span className="font-semibold">{transaction.estimatedGasFee.toFixed(6)} SOL</span>
            </div>
            <div className="text-sm text-amber-300/80 mt-1">
              Total cost: <span className="font-semibold">{transaction.totalCost.toFixed(6)} SOL</span>
            </div>
          </div>

          {/* Balance Warning */}
          {insufficient && transaction.balanceWarning && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-red-400" />
                <span className="font-medium text-red-400">Insufficient Balance</span>
              </div>
              <p className="text-sm text-red-300/80">{transaction.balanceWarning}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300/80">
            <CheckCircle size={16} className="inline mr-2 text-blue-400" />
            Please review the details carefully before confirming. This action cannot be undone.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-dark-border">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || insufficient}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Sign & Confirm"
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
