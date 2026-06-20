"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { fetchMintedPositions, type PositionMinted } from "@/lib/predict-api"
import { fetchAllProfiles, fetchSignalPolicies, buildPaySignalFeeTx, suiClient, type PredictorProfileFields } from "@/lib/sui-client"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Loader2, RefreshCw, Copy, Lock, Unlock } from "lucide-react"
import CoinLogo from "@/components/echo/coin-logo"
import { fetchFromWalrus } from "@/lib/walrus"
import { DUSDC_TYPE } from "@/lib/constants"
import dynamic from "next/dynamic"

const CopyModal = dynamic(() => import("@/components/echo/copy-modal"), { ssr: false })
const BtcTicker = dynamic(() => import("@/components/echo/btc-ticker"), { ssr: false })

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatStrike(raw: number): string {
  return `$${(raw / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

function impliedProb(askPrice: number): number {
  return Math.round((askPrice / 1e9) * 100)
}

export default function FeedPage() {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [copyTarget, setCopyTarget] = useState<PositionMinted | null>(null)
  // blobId → text content once fetched from Walrus
  const [revealedReasoning, setRevealedReasoning] = useState<Record<string, string>>({})
  const [unlocking, setUnlocking] = useState<string | null>(null)

  const { data: positions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["feed-positions"],
    queryFn: () => fetchMintedPositions(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
  })

  // Build address → profile map for names
  const profileMap = new Map<string, PredictorProfileFields>()
  profiles?.forEach(p => profileMap.set(p.wallet, p))

  // Only show trades from Echo-registered predictors (wallets with a profile)
  const echoPositions = (positions ?? []).filter(p => profileMap.has(p.trader))

  const live = echoPositions
    .filter(p => p.expiry > Date.now())
    .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)

  const expired = echoPositions
    .filter(p => p.expiry <= Date.now())
    .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
    .slice(0, 20)

  // Fetch signal metadata from localStorage (set by post-trade-modal after upload)
  function getSignalMeta(txDigest: string): { blobId?: string; policyObjectId?: string; feeDusd?: string; isPremium: boolean } | null {
    try {
      const raw = localStorage.getItem(`echo_signal_${txDigest}`)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  async function handleReveal(blobId: string) {
    if (revealedReasoning[blobId]) return
    try {
      const text = await fetchFromWalrus(blobId)
      setRevealedReasoning(prev => ({ ...prev, [blobId]: text }))
    } catch {
      setRevealedReasoning(prev => ({ ...prev, [blobId]: "(failed to load)" }))
    }
  }

  async function handleUnlock(policyObjectId: string, predictorAddress: string, blobId: string, feeDusd: string) {
    if (!account) return
    setUnlocking(policyObjectId)
    try {
      // Find predictor profile and a dUSDC coin
      const [policies, coins] = await Promise.all([
        fetchSignalPolicies(predictorAddress),
        suiClient.getCoins({ owner: account.address, coinType: DUSDC_TYPE }),
      ])
      const policy = policies.find(p => p.objectId === policyObjectId)
      if (!policy || !coins.data.length) throw new Error("Cannot unlock")
      // Find predictor's profile object ID
      const profiles = await fetchAllProfiles()
      const predProfile = profiles.find(p => p.wallet.toLowerCase() === predictorAddress.toLowerCase())
      if (!predProfile) throw new Error("Predictor has no Echo profile")
      const predProfileId = (predProfile.id as unknown as { id: string }).id
      const tx = buildPaySignalFeeTx({
        signalPolicyObjectId: policyObjectId,
        predictorProfileObjectId: predProfileId,
        dusdCoinObjectId: coins.data[0].coinObjectId,
        feeDusd: BigInt(Math.round(Number(feeDusd) * 1e6)),
      })
      await signAndExecute({ transaction: tx })
      // After payment, fetch the blob content
      const text = await fetchFromWalrus(blobId)
      setRevealedReasoning(prev => ({ ...prev, [blobId]: text }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRevealedReasoning(prev => ({ ...prev, [blobId]: `Error: ${msg.slice(0, 80)}` }))
    } finally {
      setUnlocking(null)
    }
  }

  // Convert a PositionMinted → ActiveTrade shape for CopyModal
  function toActiveTrade(pos: PositionMinted) {
    const profile = profileMap.get(pos.trader)
    const expiryMinutes = Math.max(1, Math.round((pos.expiry - Date.now()) / 60_000))
    return {
      id: pos.digest,
      predictorAddress: pos.trader,
      direction: pos.is_up ? ("UP" as const) : ("DOWN" as const),
      strike: pos.strike / 1e9,
      expiryMinutes,
      expiryMs: pos.expiry,
      impliedProb: impliedProb(pos.ask_price),
      positionSizeCents: Math.round(pos.cost / 10_000),
      copies: 0,
      postedMinutesAgo: Math.floor((Date.now() - pos.checkpoint_timestamp_ms) / 60_000),
      reasoning: null,
      isPremium: false,
      signalFeeCents: 0,
      btcCurrentPrice: pos.strike / 1e9,
      oracleId: pos.oracle_id,
      predictorProfileObjectId: profile ? (profile.id as unknown as { id: string }).id : undefined,
      predictorDisplay: profile
        ? {
            displayName: profile.display_name,
            initials: profile.display_name.slice(0, 2).toUpperCase(),
            avatarColor: "#7A7FEE",
            winRate: Math.round(Number(profile.win_rate_bps) / 100),
            streak: Number(profile.current_streak),
          }
        : {
            displayName: shortAddr(pos.trader),
            initials: pos.trader.slice(2, 4).toUpperCase(),
            avatarColor: "#7A7FEE",
            winRate: 0,
            streak: 0,
          },
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">
        <section className="my-8">
          {/* Live BTC Price Ticker */}
          <BtcTicker />

          {/* Title */}
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap mt-8">
            <div>
              <h1 className="text-black dark:text-white mb-2 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
                Live Trade
                <span className="block text-[#7A7FEE]">Feed</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? "Loading on-chain positions…" : `${live.length} open positions from Echo predictors · updates every 30s`}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 btn-secondary text-sm text-black dark:text-white mt-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="card p-12 text-center shadow-md">
              <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching live positions…</p>
            </div>
          )}

          {/* Open positions */}
          {!isLoading && (
            <>
              {live.length === 0 && (
                <div className="card p-10 text-center shadow-md mb-8">
                  <p className="text-gray-500 dark:text-gray-400">No open positions right now. Post a trade to be first!</p>
                </div>
              )}

              {live.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
                  {live.map((pos, i) => {
                    const profile = profileMap.get(pos.trader)
                    const name = profile?.display_name ?? shortAddr(pos.trader)
                    const initials = (profile?.display_name ?? pos.trader.slice(2, 4)).slice(0, 2).toUpperCase()
                    const prob = impliedProb(pos.ask_price)
                    const expired = pos.expiry <= Date.now()

                    return (
                      <div key={pos.digest + i} className="card p-5 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-4">
                        {/* Predictor row */}
                        <div className="flex items-center justify-between">
                          <Link href={`/predictor/${pos.trader}`} className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-black dark:text-white group-hover:text-[#7A7FEE] transition-colors leading-tight">{name}</p>
                              <p className="text-xs text-gray-400">{timeAgo(pos.checkpoint_timestamp_ms)}</p>
                            </div>
                          </Link>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                            pos.is_up
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                            <CoinLogo symbol="BTC" size={13} />
                            {pos.is_up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {pos.is_up ? "UP" : "DOWN"}
                          </span>
                        </div>

                        {/* Trade details */}
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Strike</span>
                            <span className="font-semibold text-black dark:text-white">{formatStrike(pos.strike)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Expires</span>
                            <span className={`font-medium ${expired ? "text-red-500" : "text-[#f59e0b]"}`}>{formatExpiry(pos.expiry)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Size</span>
                            <span className="font-medium text-black dark:text-white">{(pos.quantity / 1e6).toFixed(2)} contracts</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Cost</span>
                            <span className="font-medium text-black dark:text-white">{(pos.cost / 1e6).toFixed(2)} dUSDC</span>
                          </div>
                        </div>

                        {/* Probability bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Implied probability</span>
                            <span className="font-medium text-black dark:text-white">{prob}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pos.is_up ? "bg-green-500" : "bg-red-500"}`}
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                        </div>

                        {/* Reasoning / SEAL unlock section */}
                        {(() => {
                          const signal = getSignalMeta(pos.digest)
                          if (!signal) return null
                          const revealed = signal.blobId ? revealedReasoning[signal.blobId] : undefined
                          if (signal.isPremium && signal.policyObjectId && !revealed) {
                            return (
                              <button
                                onClick={() => handleUnlock(signal.policyObjectId!, pos.trader, signal.blobId!, signal.feeDusd ?? "0.5")}
                                disabled={unlocking === signal.policyObjectId}
                                className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-purple-400/30 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                              >
                                {unlocking === signal.policyObjectId
                                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Unlocking…</>
                                  : <><Lock className="w-3 h-3" /> Unlock reasoning · {signal.feeDusd} dUSDC</>}
                              </button>
                            )
                          }
                          if (revealed) {
                            return (
                              <div className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 italic">
                                <span className="text-[10px] text-gray-400 not-italic block mb-1 flex items-center gap-1"><Unlock className="w-2.5 h-2.5" /> Reasoning</span>
                                "{revealed}"
                              </div>
                            )
                          }
                          if (!signal.isPremium && signal.blobId && !revealed) {
                            return (
                              <button
                                onClick={() => handleReveal(signal.blobId!)}
                                className="w-full text-xs py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-[#7A7FEE] hover:border-[#7A7FEE] transition-colors"
                              >
                                View reasoning
                              </button>
                            )
                          }
                          return null
                        })()}

                        {/* Copy button — hidden for your own trades */}
                        {pos.trader.toLowerCase() === account?.address?.toLowerCase() ? (
                          <div className="w-full py-2 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            Your trade
                          </div>
                        ) : (
                          <button
                            onClick={() => setCopyTarget(pos)}
                            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Trade
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Recently expired */}
              {expired.length > 0 && (
                <>
                  <h2 className="text-black dark:text-white mb-4 text-2xl font-medium">
                    Recently <span className="text-gray-400">Expired</span>
                  </h2>
                  <div className="card overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            {["Predictor", "Direction", "Strike", "Size", "Cost", "When"].map(h => (
                              <th key={h} className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {expired.map((pos, i) => {
                            const profile = profileMap.get(pos.trader)
                            const name = profile?.display_name ?? shortAddr(pos.trader)
                            const initials = (profile?.display_name ?? pos.trader.slice(2, 4)).slice(0, 2).toUpperCase()
                            return (
                              <tr key={pos.digest + "e" + i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors">
                                <td className="p-4">
                                  <Link href={`/predictor/${pos.trader}`} className="flex items-center gap-2 group">
                                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">{initials}</div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-[#7A7FEE] transition-colors">{name}</span>
                                  </Link>
                                </td>
                                <td className="p-4">
                                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${pos.is_up ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                    {pos.is_up ? "UP" : "DOWN"}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{formatStrike(pos.strike)}</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{(pos.quantity / 1e6).toFixed(2)}</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{(pos.cost / 1e6).toFixed(2)} dUSDC</td>
                                <td className="p-4 text-sm text-gray-400">{timeAgo(pos.checkpoint_timestamp_ms)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      <Footer />

      {copyTarget && (
        <CopyModal
          trade={toActiveTrade(copyTarget)}
          open={!!copyTarget}
          onOpenChange={(o) => { if (!o) setCopyTarget(null) }}
        />
      )}
    </main>
  )
}
