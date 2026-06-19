"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { fetchAllProfiles } from "@/lib/sui-client"
import { fetchMintedPositions, type PositionMinted } from "@/lib/predict-api"
import { bpsToPercent } from "@/hooks/useProfiles"
import { DUSDC_DECIMALS } from "@/lib/constants"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"

const CopyModal = dynamic(() => import("@/components/echo/copy-modal"), { ssr: false })

interface Props {
  params: { address: string }
}

function formatDusd(raw: string | number) {
  return (Number(raw) / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function impliedProb(askPrice: number): number {
  return Math.round((askPrice / 1e9) * 100)
}

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

export default function PredictorProfilePage({ params }: Props) {
  const { address } = params
  const [copyTarget, setCopyTarget] = useState<PositionMinted | null>(null)

  // On-chain Echo profile
  const { data: onChainProfiles, isLoading: profileLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 30_000,
  })

  // All minted positions — filter client-side by this trader
  const { data: allPositions, isLoading: posLoading } = useQuery({
    queryKey: ["all-minted"],
    queryFn: () => fetchMintedPositions(200),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })



  const isLoading = profileLoading || posLoading
  const profile = onChainProfiles?.find(p => p.wallet === address)

  // Split this trader's positions into open vs history
  const traderPositions = (allPositions ?? [])
    .filter(p => p.trader === address)
    .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
  const openTrades = traderPositions.filter(p => p.expiry > Date.now())

  const displayName = profile?.display_name ?? shortAddr(address)
  const winRate = profile ? bpsToPercent(profile.win_rate_bps) : null

  function toActiveTrade(pos: PositionMinted) {
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
      predictorDisplay: {
        displayName,
        initials: displayName.slice(0, 2).toUpperCase(),
        avatarColor: "#7A7FEE",
        winRate: profile ? Math.round(Number(profile.win_rate_bps) / 100) : 0,
        streak: profile ? Number(profile.current_streak) : 0,
      },
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">
        <Link href="/leaderboard" className="inline-flex items-center text-gray-400 hover:text-[#7A7FEE] my-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboard
        </Link>

        {/* Profile hero */}
        <section className="card my-4 p-8 md:p-10 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-black dark:text-white text-3xl md:text-4xl font-medium">{displayName}</h1>
                {profile && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium border border-green-500/20">
                    ON-CHAIN
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm font-mono mb-4 break-all">{address}</p>
              <a
                href={`https://suiscan.xyz/testnet/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#7A7FEE] hover:underline"
              >
                View on Suiscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Stats — real on-chain profile only */}
        {isLoading ? (
          <div className="card p-8 text-center shadow-md my-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#7A7FEE] mx-auto" />
          </div>
        ) : profile ? (
          <section className="my-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Win Rate", value: `${winRate}%`, color: (winRate ?? 0) >= 60 ? "text-green-500" : "text-[#f59e0b]" },
                { label: "Total Trades", value: String(Number(profile.total_trades)), color: "text-black dark:text-white" },
                { label: "Streak", value: `${Number(profile.current_streak)} 🔥`, color: "text-black dark:text-white" },
                { label: "Followers", value: String(Number(profile.follower_count)), color: "text-[#7A7FEE]" },
                { label: "Copy Earnings", value: `${formatDusd(profile.copy_earnings_cents)} dUSDC`, color: "text-green-500" },
              ].map(s => (
                <div key={s.label} className="card p-6 shadow-md text-center hover:shadow-lg transition-shadow">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        ) : !isLoading && (
          <div className="card p-5 my-8 shadow-sm border border-[#f59e0b]/20 bg-[#f59e0b]/5 rounded-xl">
            <p className="text-[#f59e0b] text-sm">This wallet has no Echo profile yet — stats unavailable.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Active Trade Calls */}
          <div className="lg:col-span-2">
            <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium">
              Active <span className="text-[#7A7FEE]">Trade Calls</span>
            </h2>

            {posLoading ? (
              <div className="card p-8 text-center shadow-md">
                <Loader2 className="w-5 h-5 animate-spin text-[#7A7FEE] mx-auto" />
              </div>
            ) : openTrades.length === 0 ? (
              <div className="card p-8 shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No active trade calls.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openTrades.map((pos) => {
                  const prob = impliedProb(pos.ask_price)
                  return (
                    <div key={pos.digest} className="card overflow-hidden shadow-md">
                      <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-bold border-b border-gray-100 dark:border-gray-800 ${
                        pos.is_up ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {pos.is_up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>BTC {pos.is_up ? "UP" : "DOWN"} ${(pos.strike / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        <span className="ml-auto text-gray-400 font-normal">{formatExpiry(pos.expiry)}</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span>{prob}% implied · {(pos.cost / 1e6).toFixed(2)} dUSDC · {timeAgo(pos.checkpoint_timestamp_ms)}</span>
                          <a href={`https://suiscan.xyz/testnet/tx/${pos.digest}`} target="_blank" rel="noopener noreferrer"
                            className="text-[#7A7FEE] hover:underline flex items-center gap-1">
                            {pos.digest.slice(0, 8)}… <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
                          <div className={`h-full rounded-full ${pos.is_up ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${prob}%` }} />
                        </div>
                        <button onClick={() => setCopyTarget(pos)} className="btn-primary w-full text-sm">
                          Copy Trade
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Trade History */}
          <div>
            <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium">
              Trade <span className="text-[#7A7FEE]">History</span>
            </h2>
            <div className="card overflow-hidden shadow-md">
              {traderPositions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No trade history found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {traderPositions.slice(0, 10).map((pos) => {
                    const expired = pos.expiry <= Date.now()
                    return (
                      <div key={pos.digest} className="p-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${
                            pos.is_up ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          }`}>{pos.is_up ? "UP" : "DOWN"}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            ${(pos.strike / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {(pos.cost / 1e6).toFixed(2)} dUSDC
                          </p>
                          <p className={`text-xs ${expired ? "text-red-400" : "text-[#f59e0b]"}`}>
                            {expired ? timeAgo(pos.checkpoint_timestamp_ms) : formatExpiry(pos.expiry)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
