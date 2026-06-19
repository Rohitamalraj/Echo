"use client"

import { useState, useEffect, useRef } from "react"
import { X, TrendingUp, TrendingDown, Shield, Loader2, Zap } from "lucide-react"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { buildCreateCopyTx, suiClient } from "@/lib/sui-client"
import { DUSDC_TYPE, parseDusd } from "@/lib/constants"
import type { ActiveTrade } from "@/lib/mock-data"
import { getPredictorByAddress } from "@/lib/mock-data"

interface CopyModalProps {
  trade: ActiveTrade | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const dirLabel = { UP: "BTC ABOVE", DOWN: "BTC BELOW", RANGE: "BTC IN RANGE" }
const dirColor = { UP: "text-green-500", DOWN: "text-red-500", RANGE: "text-blue-500" }
const dirBadge = {
  UP: "bg-green-500/10 text-green-500 border border-green-500/20",
  DOWN: "bg-red-500/10 text-red-500 border border-red-500/20",
  RANGE: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
}

export default function CopyModal({ trade, open, onOpenChange }: CopyModalProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const panelRef = useRef<HTMLDivElement>(null)

  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [txDigest, setTxDigest] = useState("")

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    if (open) { document.body.style.overflow = "hidden"; document.addEventListener("keydown", esc) }
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", esc) }
  }, [open, onOpenChange])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onOpenChange(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onOpenChange])

  if (!open || !trade) return null

  const predictor = getPredictorByAddress(trade.predictorAddress)
  const name = predictor?.displayName ?? trade.predictorDisplay?.displayName ?? "Unknown"
  const winRate = predictor?.winRate ?? trade.predictorDisplay?.winRate ?? 0
  const streak = predictor?.streak ?? trade.predictorDisplay?.streak ?? 0
  const initials = (predictor?.initials ?? name.slice(0, 2)).toUpperCase()

  const amountNum = parseFloat(amount) || 0
  const potentialPayout = amountNum * (trade.impliedProb > 50 ? 1.7 : 2.1)
  const yourCut = potentialPayout * 0.85
  const predictorCut = potentialPayout * 0.15

  async function handleConfirm() {
    if (!account || amountNum <= 0) return
    setStatus("posting"); setErrorMsg("")
    try {
      const coins = await suiClient.getCoins({ owner: account.address, coinType: DUSDC_TYPE })
      if (!coins.data.length) {
        setErrorMsg("No dUSDC in wallet. Request testnet tokens first.")
        setStatus("error"); return
      }
      const managers = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::predict_manager::PredictManager` },
      })
      if (!managers.data.length) {
        setErrorMsg("No PredictManager found. Create one via the Predict protocol first.")
        setStatus("error"); return
      }
      const tx = buildCreateCopyTx({
        predictorProfileId: trade.predictorProfileObjectId ?? trade.predictorAddress,
        oracleId: trade.oracleId ?? trade.predictorAddress,
        strike: BigInt(Math.round(trade.strike * 1e9)),
        isUp: trade.direction === "UP",
        expiryMs: BigInt(Date.now() + trade.expiryMinutes * 60_000),
        amountDusd: parseDusd(amount),
        managerObjectId: managers.data[0].data!.objectId,
        dusdCoinObjectId: coins.data[0].coinObjectId,
      })
      const result = await signAndExecute({ transaction: tx })
      setTxDigest(result.digest)
      setStatus("success")
      setTimeout(() => { setStatus("idle"); setAmount(""); onOpenChange(false) }, 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg.slice(0, 120)); setStatus("error")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div ref={panelRef} className="card w-full max-w-md bg-white dark:bg-[#272829]">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-black dark:text-white">Copy Trade Submitted!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your position is live on Sui testnet.</p>
            {txDigest && (
              <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7A7FEE] hover:underline">
                View on Suiscan →
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Copy Trade</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mirror {name}'s position</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Predictor row */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-sm font-semibold">{initials}</div>
                  <div>
                    <p className="font-semibold text-black dark:text-white text-sm">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{winRate}% win · {streak}🔥 streak</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md font-bold ${dirBadge[trade.direction]}`}>
                  {trade.direction === "UP" ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {trade.direction}
                </span>
              </div>

              {/* Trade details */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Prediction</span>
                  <span className={`font-semibold ${dirColor[trade.direction]}`}>
                    {dirLabel[trade.direction]} ${trade.strike.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Expires in</span>
                  <span className="text-black dark:text-white font-medium">
                    {trade.expiryMinutes >= 60 ? `${Math.floor(trade.expiryMinutes / 60)}h ${trade.expiryMinutes % 60}m` : `${trade.expiryMinutes}m`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Implied probability</span>
                  <span className="text-black dark:text-white font-medium">{trade.impliedProb}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-[#7A7FEE] transition-all" style={{ width: `${trade.impliedProb}%` }} />
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Your copy amount</label>
                <div className="relative">
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pr-20 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-semibold text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A7FEE] transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">dUSDC</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {[10, 25, 50, 100].map((v) => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#7A7FEE] hover:text-[#7A7FEE] transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout preview */}
              {amountNum > 0 && (
                <div className="rounded-xl border border-[#7A7FEE]/20 bg-[#7A7FEE]/5 p-4 space-y-2">
                  <p className="text-xs font-medium text-[#7A7FEE] uppercase tracking-wide">If this wins</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Gross payout (~{trade.impliedProb}% odds)</span>
                    <span className="text-black dark:text-white font-medium">{potentialPayout.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Your 85% cut</span>
                    <span className="text-green-500 font-semibold">+{yourCut.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Predictor 15% cut</span>
                    <span className="text-gray-500">{predictorCut.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="w-3 h-3" /> Split enforced by Move smart contract
                  </div>
                </div>
              )}

              {!account && <p className="text-sm text-[#f59e0b] text-center">Connect wallet to copy this trade</p>}
              {status === "error" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{errorMsg || "Transaction failed."}</div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={handleConfirm}
                disabled={!amountNum || !account || status === "posting"}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "posting" ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing transaction…</span>
                ) : "Confirm Copy Trade"}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Signed with your Sui wallet · CopyRecord stored on-chain
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
