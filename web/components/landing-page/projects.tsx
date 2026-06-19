"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { fetchMintedPositions, type PositionMinted } from "@/lib/predict-api"
import { fetchAllProfiles, type PredictorProfileFields } from "@/lib/sui-client"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"

const CopyModal = dynamic(() => import("@/components/echo/copy-modal"), { ssr: false })

function formatExpiry(expiryMs: number): string {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

function impliedProb(askPrice: number): number {
  return Math.round((askPrice / 1e9) * 100)
}

export default function Projects() {
  const [copyTarget, setCopyTarget] = useState<PositionMinted | null>(null)

  const { data: positions, isLoading } = useQuery({
    queryKey: ["home-feed"],
    queryFn: () => fetchMintedPositions(50),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
  })

  const profileMap = new Map<string, PredictorProfileFields>()
  profiles?.forEach(p => profileMap.set(p.wallet, p))

  // 3 most recent non-expired positions from Echo-registered predictors only
  const featured = (positions ?? [])
    .filter(p => p.expiry > Date.now() && profileMap.has(p.trader))
    .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
    .slice(0, 3)

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
      predictorProfileObjectId: profile ? (profile.id as unknown as { id: string }).id : pos.trader,
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
    <section id="projects" className="my-20">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        Live Trade
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Feed</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Verified predictors post their DeepBook Predict positions in real time. Browse open calls, check
        their on-chain track record, and copy with one tap.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE]" />
        </div>
      ) : featured.length === 0 ? (
        <div className="card p-10 text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400">No open positions right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((pos) => {
            const profile = profileMap.get(pos.trader)
            const name = profile?.display_name ?? shortAddr(pos.trader)
            const initials = (profile?.display_name ?? pos.trader.slice(2, 4)).slice(0, 2).toUpperCase()
            const prob = impliedProb(pos.ask_price)
            const isUp = pos.is_up

            return (
              <div key={pos.digest} className="card overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
                {/* Direction banner */}
                <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold border-b border-gray-100 dark:border-gray-800 ${
                  isUp
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>BTC {isUp ? "UP" : "DOWN"} ${(pos.strike / 1e9).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                  <span className="ml-auto flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatExpiry(pos.expiry)}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  {/* Predictor */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black dark:text-white">{name}</p>
                      <p className="text-xs text-gray-500">
                        {prob}% implied prob · {(pos.cost / 1e6).toFixed(2)} dUSDC
                      </p>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mb-4">
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isUp ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${pos.digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-[#7A7FEE] transition-colors"
                    >
                      {pos.digest.slice(0, 10)}…
                    </a>
                    <button
                      onClick={() => setCopyTarget(pos)}
                      className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group"
                    >
                      Copy Trade
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Link href="/feed" className="btn-primary">
          View All Live Trades
        </Link>
      </div>

      {copyTarget && (
        <CopyModal
          trade={toActiveTrade(copyTarget)}
          open={!!copyTarget}
          onOpenChange={(o) => { if (!o) setCopyTarget(null) }}
        />
      )}
    </section>
  )
}
