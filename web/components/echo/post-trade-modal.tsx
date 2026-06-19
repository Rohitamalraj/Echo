"use client"

import { useEffect, useState, useRef } from "react"
import { X, TrendingUp, TrendingDown, Lock, CheckCircle, Loader2 } from "lucide-react"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import { fetchActiveOracles, fetchOraclePrice, fetchManagers, formatStrike, formatExpiry, type OracleState } from "@/lib/predict-api"
import { fetchAllProfiles } from "@/lib/sui-client"
import { buildPostTradeTx, buildCreateManagerTx, buildCreateSignalTx, suiClient } from "@/lib/sui-client"
import { parseDusd, DUSDC_TYPE } from "@/lib/constants"
import { uploadToWalrus } from "@/lib/walrus"

interface PostTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PostTradeModal({ open, onOpenChange }: PostTradeModalProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const panelRef = useRef<HTMLDivElement>(null)

  const [direction, setDirection] = useState<"UP" | "DOWN">("UP")
  const [oracles, setOracles] = useState<OracleState[]>([])
  const [oracleSpots, setOracleSpots] = useState<Record<string, number>>({})
  const [selectedOracleIdx, setSelectedOracleIdx] = useState(0)
  const [amount, setAmount] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [isPremium, setIsPremium] = useState(false)
  const [signalFee, setSignalFee] = useState("0.5")
  const [status, setStatus] = useState<"idle" | "loading-markets" | "posting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [txDigest, setTxDigest] = useState("")
  const [reasoningBlobId, setReasoningBlobId] = useState<string | null>(null)

  // Fetch the user's Echo profile to get the profile object ID for SEAL signals
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
    enabled: open && !!account?.address,
  })
  const myProfile = profiles?.find(p => p.wallet.toLowerCase() === (account?.address ?? "").toLowerCase())
  const myProfileId = myProfile ? (myProfile.id as unknown as { id: string }).id : null

  useEffect(() => {
    if (!open) return
    setStatus("loading-markets")
    fetchActiveOracles()
      .then(async (raw) => {
        const now = Date.now()
        const sorted = [...raw]
          .filter(o => o.expiry > now + 60_000) // must have at least 1 min left
          .sort((a, b) => a.expiry - b.expiry)
          .slice(0, 4)
        setOracles(sorted)
        setSelectedOracleIdx(0)
        setStatus("idle")
        // Fetch spot prices for each oracle (for ATM strike computation)
        const spots: Record<string, number> = {}
        await Promise.allSettled(sorted.map(async (o) => {
          try {
            const p = await fetchOraclePrice(o.oracle_id)
            if (p.spot) spots[o.oracle_id] = p.spot
          } catch { /* ignore */ }
        }))
        setOracleSpots(spots)
      })
      .catch(() => setStatus("idle"))
  }, [open])

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

  if (!open) return null

  const oracle = oracles[selectedOracleIdx]
  const amountNum = parseFloat(amount) || 0
  const belowMin = amountNum > 0 && amountNum < 1
  const canPost = amountNum >= 1 && !!oracle && !!account

  // Compute ATM strike: round spot price to nearest tick
  function atmStrike(o: OracleState): bigint {
    const spot = oracleSpots[o.oracle_id] ?? o.min_strike
    const tick = o.tick_size > 0 ? o.tick_size : 1_000_000_000
    return BigInt(Math.round(spot / tick) * tick)
  }

  async function handlePost() {
    if (!canPost || !account || !oracle) return
    if (oracle.expiry <= Date.now() + 30_000) {
      setErrorMsg("This oracle has expired. Please select a different market.")
      setStatus("error"); return
    }
    setStatus("posting"); setErrorMsg("")
    try {
      const coins = await suiClient.getCoins({ owner: account.address, coinType: DUSDC_TYPE })
      if (!coins.data.length) {
        setErrorMsg("No dUSDC in wallet. Request testnet tokens first.")
        setStatus("error"); return
      }

      // PredictManagers are shared objects — use Predict Server to find by owner
      setErrorMsg("Finding your PredictManager…")
      let allManagers = await fetchManagers()
      let myManager = allManagers.find(m => m.owner === account.address)

      // Auto-create if none found
      if (!myManager) {
        setErrorMsg("Step 1/2: Creating your PredictManager — approve the wallet prompt…")
        const createResult = await signAndExecute({ transaction: buildCreateManagerTx() })

        // Retry fetching from predict server (up to 5 × 3s)
        setErrorMsg("Waiting for indexing…")
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 3000))
          allManagers = await fetchManagers()
          myManager = allManagers.find(m => m.owner === account.address)
          if (myManager) break
        }

        if (!myManager) {
          setErrorMsg(`Manager created (tx: ${createResult.digest.slice(0, 12)}…) but not indexed yet. Wait 10s and try again.`)
          setStatus("error"); return
        }
        setErrorMsg("Step 2/2: Posting your trade…")
      }

      setErrorMsg("")
      const tx = buildPostTradeTx({
        oracleId: oracle.oracle_id,
        strike: atmStrike(oracle),
        isUp: direction === "UP",
        expiryMs: BigInt(oracle.expiry),
        quantity: parseDusd(amount),
        managerObjectId: myManager.manager_id,
        dusdCoinObjectId: coins.data[0].coinObjectId,
      })
      const result = await signAndExecute({ transaction: tx })
      setTxDigest(result.digest)

      // Upload reasoning to Walrus after trade is confirmed
      if (reasoning.trim()) {
        setErrorMsg("Uploading reasoning to Walrus…")
        try {
          const blobId = await uploadToWalrus(reasoning.trim())
          setReasoningBlobId(blobId)
          localStorage.setItem(`echo_reasoning_${result.digest}`, blobId)

          // If premium: create SEAL encrypted signal policy
          if (isPremium && myProfileId) {
            setErrorMsg("Creating SEAL encrypted signal…")
            const signalTx = buildCreateSignalTx({
              profileObjectId: myProfileId,
              blobId,
              feeDusd: parseDusd(signalFee),
            })
            await signAndExecute({ transaction: signalTx })
          }
        } catch {
          // Non-fatal — trade succeeded, reasoning upload failed
        }
      }

      setErrorMsg("")
      setStatus("success")
      setTimeout(() => { setStatus("idle"); setAmount(""); setReasoning(""); setReasoningBlobId(null); onOpenChange(false) }, 4000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg.slice(0, 120)); setStatus("error")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div ref={panelRef} className="card w-full max-w-lg bg-white dark:bg-[#272829] max-h-[90vh] overflow-y-auto">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#7A7FEE]/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#7A7FEE]" />
            </div>
            <p className="text-lg font-semibold text-black dark:text-white">Trade Posted On-Chain!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your call is live. Followers can now copy it.</p>
            {txDigest && (
              <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7A7FEE] hover:underline">
                View on Suiscan →
              </a>
            )}
            {reasoningBlobId && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400 text-center">
                {isPremium ? "🔒 Reasoning sealed on Walrus" : "📄 Reasoning stored on Walrus"}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Post a Trade</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share your prediction and earn from followers</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { d: "UP" as const, Icon: TrendingUp, label: "BTC UP", active: "border-green-500/50 bg-green-500/10 text-green-500" },
                    { d: "DOWN" as const, Icon: TrendingDown, label: "BTC DOWN", active: "border-red-500/50 bg-red-500/10 text-red-500" },
                  ]).map(({ d, Icon, label, active }) => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${direction === d ? active : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                      <Icon className="w-5 h-5" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market / Expiry */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Market & Expiry</label>
                {status === "loading-markets" ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading live markets…
                  </div>
                ) : oracles.length === 0 ? (
                  <p className="text-sm text-gray-500">No active markets found. Using demo mode.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {oracles.map((o, i) => {
                      const spot = oracleSpots[o.oracle_id]
                      const strikeDisplay = spot
                        ? `$${(Math.round(spot / (o.tick_size > 0 ? o.tick_size : 1_000_000_000)) * (o.tick_size > 0 ? o.tick_size : 1_000_000_000) / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                        : formatStrike(o.min_strike)
                      return (
                      <button key={o.oracle_id} onClick={() => setSelectedOracleIdx(i)}
                        className={`rounded-xl border p-3 text-left text-xs transition-all ${selectedOracleIdx === i ? "border-[#7A7FEE]/50 bg-[#7A7FEE]/10 text-[#7A7FEE]" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                        <div className="font-semibold">{formatExpiry(o.expiry)}</div>
                        <div className="text-gray-500 mt-0.5">ATM {strikeDisplay}</div>
                      </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Position size <span className="text-xs text-gray-400 font-normal">(min 1 dUSDC)</span>
                </label>
                <div className="relative">
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.00" min="1" step="1"
                    className={`w-full pr-20 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border rounded-lg text-lg font-semibold text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${belowMin ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-[#7A7FEE]"}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">dUSDC</span>
                </div>
                {belowMin && (
                  <p className="text-xs text-red-500 mt-1">Minimum position size is 1 dUSDC</p>
                )}
                <div className="mt-2 flex gap-2">
                  {[1, 5, 10, 25].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#7A7FEE] hover:text-[#7A7FEE] transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Reasoning <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={reasoning} onChange={(e) => setReasoning(e.target.value)} rows={3} maxLength={500}
                  placeholder="Why are you making this trade? Share your analysis..."
                  className="w-full resize-none px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A7FEE] transition-all"
                />
                <p className="text-right text-xs text-gray-500 mt-1">{reasoning.length}/500</p>
              </div>

              {/* Premium signal toggle */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">Seal Premium Signal</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Encrypt reasoning — followers pay to unlock</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPremium(!isPremium)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${isPremium ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPremium ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {isPremium && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Unlock fee</span>
                    <input type="number" value={signalFee} onChange={(e) => setSignalFee(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#1a1a1a] text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <span className="text-xs text-gray-500">dUSDC</span>
                  </div>
                )}
              </div>

              {!account && <p className="text-sm text-[#f59e0b] text-center">Connect wallet to post a trade</p>}
              {status === "error" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{errorMsg || "Transaction failed."}</div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <button onClick={handlePost} disabled={!canPost || status === "posting"}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {status === "posting" ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing transaction…</span>
                ) : "Post & Trade"}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                Earns 15% of follower winnings at settlement · No admin key
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
