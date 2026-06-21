"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { fetchMintedPositions, fetchAllOracles } from "@/lib/predict-api"
import {
  fetchAllProfiles, fetchFollowerCopies, fetchSignalPolicies,
  buildPaySignalFeeTx, suiClient,
} from "@/lib/sui-client"
import { DUSDC_TYPE } from "@/lib/constants"
import { downloadAndDecryptSignal, NoAccessError } from "@/lib/seal"
import { useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft, TrendingUp, TrendingDown, Lock, Unlock, Clock,
  Target, Trophy, XCircle, Copy, Loader2, ExternalLink,
  Users, Zap, ShieldCheck,
} from "lucide-react"
import CoinLogo from "@/components/echo/coin-logo"
import dynamic from "next/dynamic"

const TradingViewChart = dynamic(
  () => import("@/components/echo/tradingview-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-xl bg-[#111] border border-gray-800 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    ),
  }
)

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatExpiry(ms: number) {
  const diff = ms - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m remaining`
  return `${Math.floor(mins / 60)}h ${mins % 60}m remaining`
}

function formatStrike(raw: number) {
  return `$${(raw / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TradePage() {
  const params = useParams()
  const digest = params.digest as string
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()

  // SEAL unlock state
  const [unlockStatus, setUnlockStatus] = useState<"idle" | "paying" | "decrypting" | "done" | "error">("idle")
  const [unlockError, setUnlockError] = useState("")
  const [decryptedSignal, setDecryptedSignal] = useState<{ direction?: "UP" | "DOWN"; reasoning: string } | null>(null)

  const { data: positions, isLoading: loadingPos } = useQuery({
    queryKey: ["feed-positions"],
    queryFn: fetchMintedPositions,
    staleTime: 30_000,
  })

  const { data: oracles } = useQuery({
    queryKey: ["all-oracles"],
    queryFn: fetchAllOracles,
    staleTime: 60_000,
  })

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
  })

  const { data: myCopyEvents } = useQuery({
    queryKey: ["my-copies", account?.address],
    queryFn: () => account ? fetchFollowerCopies(account.address) : Promise.resolve([]),
    enabled: !!account,
    staleTime: 60_000,
  })

  const pos = positions?.find(p => p.digest === digest)

  // Fetch signal policies for this predictor from on-chain (cross-device)
  const { data: signalPolicies } = useQuery({
    queryKey: ["signal-policies", pos?.trader],
    queryFn: () => pos ? fetchSignalPolicies(pos.trader) : Promise.resolve([]),
    enabled: !!pos,
    staleTime: 120_000,
  })

  const oracle = oracles?.find(o => o.oracle_id === pos?.oracle_id)
  const profile = profiles?.find(p => p.wallet === pos?.trader)

  const isOwn = !!account && pos?.trader.toLowerCase() === account.address.toLowerCase()

  type CopyJson = {
    oracle_id: string; strike: string; is_up: boolean
    expiry_ms: string; predictor: string; amount_dusd: string; created_at_ms: string
  }
  const copyEvent = pos && myCopyEvents?.find(e => {
    const p = e.parsedJson as CopyJson
    return (
      p.oracle_id === pos.oracle_id &&
      p.is_up === pos.is_up &&
      Math.abs(Number(p.strike) - pos.strike) < 1_000 &&
      Math.abs(Number(p.expiry_ms) - pos.expiry) < 60_000
    )
  })
  const isCopy = !isOwn && !!copyEvent
  const showDirection = isOwn || isCopy

  const settlementPrice = oracle?.settlement_price ?? null
  const isExpired = pos ? pos.expiry <= Date.now() : false

  let outcome: "WON" | "LOST" | "OPEN" | "PENDING" = "OPEN"
  if (pos && isExpired) {
    if (settlementPrice == null) outcome = "PENDING"
    else outcome = pos.is_up
      ? (settlementPrice > pos.strike ? "WON" : "LOST")
      : (settlementPrice <= pos.strike ? "WON" : "LOST")
  }

  const winRate = profile ? Math.round(Number(profile.win_rate_bps) / 100) : null
  const streak = profile ? Number(profile.current_streak) : 0
  const bestStreak = profile ? Number(profile.best_streak) : 0
  const totalTrades = profile ? Number(profile.total_trades) : 0
  const followers = profile ? Number(profile.follower_count) : 0
  const winColor = winRate != null
    ? (winRate >= 60 ? "text-green-500" : winRate >= 45 ? "text-yellow-500" : "text-red-400")
    : "text-gray-400"

  const copyJson = copyEvent?.parsedJson as CopyJson | undefined
  const copyAmount = copyJson ? (Number(copyJson.amount_dusd) / 1e6).toFixed(2) : null
  const copyTime = copyEvent?.timestampMs ? Number(copyEvent.timestampMs) : null
  const predictorProfile = isCopy
    ? profiles?.find(p => p.wallet.toLowerCase() === (copyJson?.predictor ?? "").toLowerCase())
    : null

  // Premium signal: policy detected on-chain means the predictor posted an encrypted signal
  // Match policy to this trade's blob via time proximity (best heuristic without sealId on-chain)
  const premiumPolicy = signalPolicies?.[0] ?? null

  // sealId lives in localStorage on the poster's device; try to retrieve it cross-device via blobId match
  function getSealId(blobId: string): string | undefined {
    try {
      // Scan all localStorage keys posted by post-trade-modal
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith("echo_signal_")) continue
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const meta = JSON.parse(raw)
        if (meta.blobId === blobId) return meta.sealId
      }
    } catch { /* ignore */ }
    return undefined
  }

  async function handleUnlock() {
    if (!account || !premiumPolicy) return
    setUnlockStatus("paying")
    setUnlockError("")
    try {
      // Step 1 — Pay signal fee on-chain
      const [allProfs, coins] = await Promise.all([
        fetchAllProfiles(),
        suiClient.getCoins({ owner: account.address, coinType: DUSDC_TYPE }),
      ])
      if (!coins.data.length) throw new Error("No dUSDC in wallet")
      const predProf = allProfs.find(p => p.wallet.toLowerCase() === pos!.trader.toLowerCase())
      if (!predProf) throw new Error("Predictor has no Echo profile")
      const predProfileId = (predProf.id as unknown as { id: string }).id

      const tx = buildPaySignalFeeTx({
        signalPolicyObjectId: premiumPolicy.objectId,
        predictorProfileObjectId: predProfileId,
        dusdCoinObjectId: coins.data[0].coinObjectId,
        feeDusd: BigInt(Math.round(Number(premiumPolicy.feeDusd))),
      })
      await signAndExecute({ transaction: tx })

      // Step 2 — Decrypt
      setUnlockStatus("decrypting")
      const sealId = getSealId(premiumPolicy.blobId)
      let text: string

      if (sealId) {
        // Full SEAL decrypt (sealId found in localStorage — e.g. same device as poster)
        text = await downloadAndDecryptSignal({
          blobId: premiumPolicy.blobId,
          sealId,
          policyObjectId: premiumPolicy.objectId,
          suiClient,
          currentAddress: account.address,
          signPersonalMessage: async ({ message }) => {
            const result = await signPersonalMessage({ message })
            return { signature: result.signature }
          },
        })
      } else {
        // No sealId available cross-device — fetch raw blob (works for plain-text signals)
        const aggUrl = "https://aggregator.walrus-testnet.walrus.space"
        const res = await fetch(`${aggUrl}/v1/blobs/${premiumPolicy.blobId}`, {
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`)
        text = await res.text()
      }

      // Parse JSON payload {direction, reasoning} or plain text
      try {
        const p = JSON.parse(text)
        if (typeof p.reasoning === "string") {
          setDecryptedSignal({ direction: p.direction, reasoning: p.reasoning })
        } else {
          setDecryptedSignal({ reasoning: text })
        }
      } catch {
        setDecryptedSignal({ reasoning: text })
      }

      setUnlockStatus("done")
    } catch (e) {
      if (e instanceof NoAccessError) {
        setUnlockError("Access denied — transaction may not be confirmed yet. Try again in a few seconds.")
      } else {
        setUnlockError(e instanceof Error ? e.message.slice(0, 120) : "Unknown error")
      }
      setUnlockStatus("error")
    }
  }

  const feeDusdDisplay = premiumPolicy
    ? (Number(premiumPolicy.feeDusd) / 1e6).toFixed(2)
    : null

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-6 pb-20">
        {/* Breadcrumb */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7A7FEE] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>

        {loadingPos && (
          <div className="card p-16 text-center shadow-md">
            <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading trade…</p>
          </div>
        )}

        {!loadingPos && !pos && (
          <div className="card p-16 text-center shadow-md">
            <p className="text-gray-500">Trade not found. It may have expired from the index.</p>
          </div>
        )}

        {pos && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* ── Chart (left 3/5) ──────────────────────────────────────── */}
            <div className="xl:col-span-3 space-y-4">
              {/* Status badges */}
              <div className="flex items-center gap-3 flex-wrap">
                {isOwn && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#7A7FEE]/10 text-[#7A7FEE] border border-[#7A7FEE]/20">
                    Your Trade
                  </span>
                )}
                {isCopy && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy Trade
                  </span>
                )}
                {outcome === "WON" && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Won
                  </span>
                )}
                {outcome === "LOST" && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Lost
                  </span>
                )}
                {outcome === "OPEN" && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Live
                  </span>
                )}
                {outcome === "PENDING" && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                    Awaiting Settlement
                  </span>
                )}
                <a
                  href={`https://suiscan.xyz/testnet/tx/${digest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-gray-400 font-mono flex items-center gap-1 hover:text-[#7A7FEE] transition-colors"
                >
                  {shortAddr(digest)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Chart */}
              <TradingViewChart
                symbol="BINANCE:BTCUSDT"
                interval={pos.expiry - pos.checkpoint_timestamp_ms > 3_600_000 ? "15" : "1"}
                height={480}
              />

              {/* Strike reference */}
              <div className="card px-4 py-3 shadow-sm flex flex-wrap items-center gap-3 text-xs">
                <CoinLogo symbol="BTC" size={16} />
                <span className="text-gray-500">Strike:</span>
                <span className="font-bold text-black dark:text-white">{formatStrike(pos.strike)}</span>
                {settlementPrice != null && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <span className="text-gray-500">Settled at:</span>
                    <span className="font-bold text-black dark:text-white">{formatStrike(settlementPrice)}</span>
                  </>
                )}
                <span className="ml-auto text-gray-400 hidden sm:block">Draw the strike line using TradingView's horizontal ray tool</span>
              </div>

              {/* ── SEAL Signal Unlock (visible to non-owner if premium policy exists) ── */}
              {!isOwn && premiumPolicy && unlockStatus !== "done" && (
                <div className="card p-5 shadow-md border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-semibold text-purple-400">Premium Signal</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    This predictor attached an encrypted signal — direction + reasoning locked with SEAL.
                    Pay the signal fee to decrypt it on-chain and read the full analysis.
                  </p>
                  {unlockStatus === "error" && (
                    <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {unlockError}
                    </div>
                  )}
                  <button
                    onClick={handleUnlock}
                    disabled={!account || unlockStatus === "paying" || unlockStatus === "decrypting"}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {unlockStatus === "paying" && <><Loader2 className="w-4 h-4 animate-spin" /> Paying signal fee…</>}
                    {unlockStatus === "decrypting" && <><Loader2 className="w-4 h-4 animate-spin" /> Decrypting with SEAL…</>}
                    {(unlockStatus === "idle" || unlockStatus === "error") && (
                      <><Lock className="w-4 h-4" /> Unlock Signal · {feeDusdDisplay} dUSDC</>
                    )}
                  </button>
                  {!account && (
                    <p className="text-xs text-center text-gray-500 mt-2">Connect wallet to unlock</p>
                  )}
                </div>
              )}

              {/* ── Decrypted Signal Result ── */}
              {unlockStatus === "done" && decryptedSignal && (
                <div className="card p-5 shadow-md border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Unlock className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-semibold text-purple-400">Signal Unlocked</p>
                  </div>
                  {decryptedSignal.direction && (
                    <div className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full mb-3 ${
                      decryptedSignal.direction === "UP"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {decryptedSignal.direction === "UP"
                        ? <TrendingUp className="w-4 h-4" />
                        : <TrendingDown className="w-4 h-4" />}
                      BTC {decryptedSignal.direction}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    &ldquo;{decryptedSignal.reasoning}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* ── Details panel (right 2/5) ─────────────────────────────── */}
            <div className="xl:col-span-2 space-y-4">
              {/* Predictor card */}
              <div className="card p-5 shadow-md">
                <Link
                  href={`/predictor/${pos.trader}`}
                  className="flex items-center gap-3 group mb-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {(profile?.display_name ?? pos.trader.slice(2, 4)).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors">
                      {profile?.display_name ?? shortAddr(pos.trader)}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(pos.checkpoint_timestamp_ms)}</p>
                  </div>
                  {showDirection ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                      pos.is_up
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {pos.is_up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pos.is_up ? "UP" : "DOWN"}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700">
                      <Lock className="w-3 h-3" /> Hidden
                    </span>
                  )}
                </Link>

                {/* Predictor stats */}
                {profile && (
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#161616] p-3">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">Predictor Stats</p>
                    {totalTrades === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-1 italic">New predictor · no settled trades yet</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className={`text-sm font-bold leading-tight ${winColor}`}>{winRate}%</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight text-orange-400">{streak > 0 ? `🔥 ${streak}` : "0"}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Streak</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight text-[#7A7FEE]">{bestStreak}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Best</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight text-black dark:text-white">{totalTrades}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Trades</p>
                        </div>
                      </div>
                    )}
                    {followers > 0 && (
                      <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center flex items-center justify-center gap-1">
                        <Users className="w-2.5 h-2.5" /> {followers} {followers === 1 ? "follower" : "followers"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Trade details */}
              <div className="card p-5 shadow-md space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trade Details</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Strike</span>
                    <span className="font-semibold text-black dark:text-white">{formatStrike(pos.strike)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Expiry</span>
                    <span className={`font-medium ${isExpired ? "text-gray-400" : "text-yellow-500"}`}>
                      {isExpired ? `Expired ${timeAgo(pos.expiry)}` : formatExpiry(pos.expiry)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-medium text-black dark:text-white">{(pos.quantity / 1e6).toFixed(2)} contracts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cost</span>
                    <span className="font-medium text-black dark:text-white">{(pos.cost / 1e6).toFixed(2)} dUSDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Implied prob.</span>
                    <span className="font-medium text-black dark:text-white">{Math.round((pos.ask_price / 1e9) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${showDirection ? (pos.is_up ? "bg-green-500" : "bg-red-500") : "bg-[#7A7FEE]"}`}
                      style={{ width: `${Math.round((pos.ask_price / 1e9) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Copy trade info */}
              {isCopy && copyJson && (
                <div className="card p-5 shadow-md space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Copy className="w-3 h-3" /> Copy Details
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Copied from</span>
                      <Link href={`/predictor/${copyJson.predictor}`} className="font-semibold text-[#7A7FEE] hover:underline">
                        {predictorProfile?.display_name ?? shortAddr(copyJson.predictor)}
                      </Link>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium text-black dark:text-white">{copyAmount} dUSDC</span>
                    </div>
                    {copyTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Copied</span>
                        <span className="text-gray-400">{timeAgo(copyTime)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Direction</span>
                      <span className={`font-bold flex items-center gap-1 ${pos.is_up ? "text-green-500" : "text-red-500"}`}>
                        {pos.is_up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        BTC {pos.is_up ? "UP" : "DOWN"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Settlement outcome */}
              {isExpired && outcome !== "OPEN" && (
                <div className={`card p-5 shadow-md border-l-4 ${
                  outcome === "WON" ? "border-l-green-500" :
                  outcome === "LOST" ? "border-l-red-500" : "border-l-gray-500"
                }`}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Outcome</p>
                  {outcome === "PENDING" ? (
                    <p className="text-sm text-gray-400">Awaiting oracle settlement…</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {outcome === "WON"
                          ? <Trophy className="w-5 h-5 text-green-500" />
                          : <XCircle className="w-5 h-5 text-red-400" />}
                        <span className={`text-lg font-bold ${outcome === "WON" ? "text-green-500" : "text-red-400"}`}>
                          {outcome}
                        </span>
                      </div>
                      {settlementPrice != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Settlement price</span>
                          <span className="font-medium text-black dark:text-white">{formatStrike(settlementPrice)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Suiscan */}
              <a
                href={`https://suiscan.xyz/testnet/tx/${digest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-3 shadow-sm flex items-center justify-between text-sm text-gray-500 hover:text-[#7A7FEE] transition-colors w-full"
              >
                <span>View on Suiscan</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
