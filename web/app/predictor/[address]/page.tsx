"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { predictors, activeTrades, getPredictorByAddress } from "@/lib/mock-data"
import { fetchAllProfiles, fetchCopyCreatedEvents } from "@/lib/sui-client"
import { bpsToPercent } from "@/hooks/useProfiles"
import { DUSDC_DECIMALS } from "@/lib/constants"
import { useQuery } from "@tanstack/react-query"
import { Lock, Clock, Users } from "lucide-react"

interface Props {
  params: { address: string }
}

function dirClasses(dir: string | boolean) {
  const d = typeof dir === "boolean" ? (dir ? "UP" : "DOWN") : dir
  if (d === "UP") return { badge: "bg-green-500/10 text-green-500 border border-green-500/20", label: "UP" }
  if (d === "DOWN") return { badge: "bg-red-500/10 text-red-500 border border-red-500/20", label: "DOWN" }
  return { badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20", label: "RANGE" }
}

function formatDusd(raw: string | number) {
  return (Number(raw) / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function PredictorProfilePage({ params }: Props) {
  const { address } = params

  // Fetch all on-chain profiles and find this one
  const { data: onChainProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 30_000,
  })

  // Fetch copy events where this address is the predictor
  const { data: copyEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["copy-events-predictor", address],
    queryFn: () => fetchCopyCreatedEvents(200),
    staleTime: 15_000,
  })

  const isLoading = profilesLoading || eventsLoading

  // Find on-chain profile for this address
  const onChainProfile = onChainProfiles?.find((p) => p.wallet === address)

  // Fallback to mock data
  const mockPredictor = getPredictorByAddress(address) ?? predictors[0]

  // Build display values — prefer on-chain, fall back to mock
  const displayName = onChainProfile?.display_name ?? mockPredictor.displayName
  const winRate = onChainProfile ? bpsToPercent(onChainProfile.win_rate_bps) : mockPredictor.winRate
  const totalTrades = onChainProfile ? Number(onChainProfile.total_trades) : mockPredictor.totalTrades
  const streak = onChainProfile ? Number(onChainProfile.current_streak) : mockPredictor.streak
  const followerCount = onChainProfile ? Number(onChainProfile.follower_count) : mockPredictor.followerCount
  const earnings = onChainProfile
    ? `${formatDusd(onChainProfile.copy_earnings_cents)} dUSDC`
    : `${(mockPredictor.earningsCents / 100).toFixed(2)} dUSDC`
  const isLive = !!onChainProfile

  const stats = [
    { label: "Win Rate", value: `${winRate}%`, color: winRate >= 70 ? "text-green-500" : "text-[#f59e0b]" },
    { label: "Total Trades", value: String(totalTrades), color: "text-black dark:text-white" },
    { label: "Current Streak", value: `${streak} 🔥`, color: "text-black dark:text-white" },
    { label: "Followers", value: String(followerCount), color: "text-[#7A7FEE]" },
    { label: "Copy Earnings", value: earnings, color: "text-green-500" },
  ]

  // On-chain copy events where this wallet is predictor
  const predictorCopyEvents = copyEvents?.data.filter(
    (e) => (e.parsedJson as { predictor: string }).predictor === address
  ) ?? []

  // Fallback mock trade history
  const mockTrades = mockPredictor.recentTrades

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4 pb-20">
        <Link
          href="/leaderboard"
          className="inline-flex items-center text-gray-400 hover:text-[#7A7FEE] my-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leaderboard
        </Link>

        {/* Profile hero card */}
        <section className="card my-4 p-8 md:p-10 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-black dark:text-white text-3xl md:text-4xl font-medium leading-tight">
                  {displayName}
                </h1>
                {isLive && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium border border-green-500/20">
                    LIVE ON-CHAIN
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-mono mb-4">{address}</p>
              <button className="btn-primary text-sm">Follow Predictor</button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="my-8">
          {isLoading ? (
            <div className="card p-8 text-center shadow-md">
              <Loader2 className="w-6 h-6 animate-spin text-[#7A7FEE] mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Active Trades / Copy Events */}
          <div className="lg:col-span-2">
            <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
              {isLive ? "On-Chain" : "Active"}{" "}
              <span className="text-[#7A7FEE]">Trade Calls</span>
            </h2>

            {isLive && predictorCopyEvents.length > 0 ? (
              <div className="space-y-4">
                {predictorCopyEvents.slice(0, 5).map((e) => {
                  const j = e.parsedJson as {
                    copy_record_id: string
                    predictor: string
                    oracle_id: string
                    strike: string
                    is_up: boolean
                    expiry_ms: string
                    amount_dusd: string
                  }
                  const dc = dirClasses(j.is_up)
                  const expMs = Number(j.expiry_ms)
                  return (
                    <div key={j.copy_record_id} className="card overflow-hidden shadow-md">
                      <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${dc.badge} border-b border-gray-100 dark:border-gray-800`}>
                        <span>BTC {dc.label} ${(Number(j.strike) / 1e9).toLocaleString()}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatExpiry(expMs)}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDusd(j.amount_dusd)} dUSDC</span>
                          <span className="font-mono">{j.copy_record_id.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Fallback mock active trades
              <div className="space-y-4">
                {activeTrades
                  .filter((t) => t.predictorAddress === address)
                  .slice(0, 3)
                  .map((trade) => {
                    const dc = dirClasses(trade.direction)
                    const expiryMs = Date.now() + trade.expiryMinutes * 60000
                    return (
                      <div key={trade.id} className="card overflow-hidden shadow-md">
                        <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${dc.badge} border-b border-gray-100 dark:border-gray-800`}>
                          <span>BTC {trade.direction} ${trade.strike.toLocaleString()}</span>
                          <span className="ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatExpiry(expiryMs)}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>{trade.impliedProb}% implied prob.</span>
                            <span>${(trade.positionSizeCents / 100).toFixed(2)} dUSDC</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4">
                            {trade.isPremium ? (
                              <span className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                                <Lock className="w-3 h-3" /> Premium signal — {(trade.signalFeeCents / 100).toFixed(2)} dUSDC
                              </span>
                            ) : (
                              <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{trade.reasoning}"</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" /> {trade.copies} copying
                            </span>
                            <button className="btn-primary text-sm px-4 py-2">Copy Trade</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {activeTrades.filter((t) => t.predictorAddress === address).length === 0 && (
                  <div className="card p-8 shadow-md text-center">
                    <p className="text-gray-700 dark:text-gray-300">No active trade calls.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trade History */}
          <div>
            <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
              Trade <span className="text-[#7A7FEE]">History</span>
            </h2>
            <div className="card overflow-hidden shadow-md">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {mockTrades.map((t) => {
                  const dc = dirClasses(t.direction)
                  const won = t.outcome === "WIN"
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dc.badge}`}>{t.direction}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">${t.strike.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${won ? "text-green-500" : "text-red-500"}`}>
                          {won ? `+${(t.payoutCents / 100).toFixed(2)}` : "Lost"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.settledHoursAgo}h ago</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group w-full justify-center">
                  View full history{" "}
                  <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
