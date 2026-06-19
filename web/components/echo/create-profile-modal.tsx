"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, User, CheckCircle, X } from "lucide-react"
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { buildCreateProfileTx } from "@/lib/sui-client"

interface CreateProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function CreateProfileModal({ open, onOpenChange, onSuccess }: CreateProfileModalProps) {
  const [displayName, setDisplayName] = useState("")
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    if (open) {
      document.body.style.overflow = "hidden"
      document.addEventListener("mousedown", handler)
      document.addEventListener("keydown", esc)
    }
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  if (!open) return null

  function handleClose() {
    setStatus("idle"); setDisplayName(""); setTxDigest(null); setErrorMsg(null)
    onOpenChange(false)
  }

  function handleCreate() {
    if (!displayName.trim()) return
    setStatus("pending"); setErrorMsg(null)
    const tx = buildCreateProfileTx(displayName.trim())
    signAndExecute({ transaction: tx }, {
      onSuccess(result) { setTxDigest(result.digest); setStatus("success") },
      onError(err) { setErrorMsg(err.message ?? "Transaction failed"); setStatus("error") },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div ref={panelRef} className="card w-full max-w-md bg-white dark:bg-[#272829] relative">
        <div className="p-6 md:p-8">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <div>
                <p className="font-semibold text-black dark:text-white text-lg">Profile Created!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your on-chain predictor profile is live.</p>
              </div>
              {txDigest && (
                <a
                  href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#7A7FEE] hover:underline"
                >
                  View on Suiscan →
                </a>
              )}
              <button
                className="btn-primary w-full mt-2"
                onClick={() => { handleClose(); onSuccess?.() }}
              >
                Post a Trade
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-1">Create Predictor Profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your on-chain profile stores win rate, streak, and copy earnings — verifiable by anyone.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="e.g. BTC Wizard"
                      maxLength={32}
                      disabled={status === "pending"}
                      className="w-full pl-9 pr-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A7FEE] disabled:opacity-50 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Stored permanently on Sui. Choose wisely.</p>
                </div>

                {errorMsg && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{errorMsg}</div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={!displayName.trim() || status === "pending"}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "pending" ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating profile…</span>
                  ) : "Create Profile"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
