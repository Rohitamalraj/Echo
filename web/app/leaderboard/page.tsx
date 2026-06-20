"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import { useProfiles, bpsToPercent } from "@/hooks/useProfiles"
import type { PredictorProfileFields } from "@/lib/sui-client"
import { ArrowUpRight, TrendingUp, Loader2, RefreshCw } from "lucide-react"

type SortKey = "winRate" | "totalTrades" | "streak" | "followerCount"

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Win Rate", value: "winRate" },
  { label: "Streak", value: "streak" },
  { label: "Total Trades", value: "totalTrades" },
  { label: "Followers", value: "followerCount" },
]

const MIN_TRADE_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "5+", value: 5 },
  { label: "10+", value: 10 },
  { label: "25+", value: 25 },
]

// Normalise on-chain profile → display row
function onChainToRow(p: PredictorProfileFields) {
  return {
    address: p.wallet,
    displayName: p.display_name,
    winRate: bpsToPercent(p.win_rate_bps),
    totalTrades: Number(p.total_trades),
    streak: Number(p.current_streak),
    followerCount: Number(p.follower_count),
    roi7d: 0, // not tracked on-chain yet
    isLive: true,
  }
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortKey>("winRate")
  const [minTrades, setMinTrades] = useState(0)

  const { data: onChainProfiles, isLoading, refetch } = useProfiles()

  const rows = (onChainProfiles ?? []).map(onChainToRow)

  const sorted = [...rows]
    .filter((p) => p.totalTrades >= minTrades)
    .sort((a, b) => b[sortBy] - a[sortBy])

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />

      <div className="container pt-4">
        <section className="my-8">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-black dark:text-white mb-2 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
                Predictor
                <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Leaderboard</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? "Loading…" : `${rows.length} verified predictors · live on-chain data`}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#7A7FEE] transition-colors mt-2"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    sortBy === s.value
                      ? "bg-[#7A7FEE] text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Min trades:</span>
              {MIN_TRADE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setMinTrades(o.value)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    minTrades === o.value
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="card p-12 text-center shadow-md">
              <Loader2 className="w-8 h-8 animate-spin text-[#7A7FEE] mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading on-chain profiles...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="card p-12 text-center shadow-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No predictors yet.</p>
              <p className="text-xs text-gray-400">Create a profile via <strong className="text-[#7A7FEE]">Post Trade</strong> to be the first on the leaderboard.</p>
            </div>
          ) : (
            <div className="card overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {["#", "Predictor", "Win Rate", "Streak", "Trades", "Followers", ""].map((h) => (
                        <th
                          key={h}
                          className={`p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                            h === "#" || h === "" || h === "Predictor" ? "text-left" : "text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((predictor, index) => (
                      <tr
                        key={predictor.address}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors"
                      >
                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400 font-medium w-10">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {predictor.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
                                {predictor.displayName}
                                {predictor.isLive && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full font-medium">
                                    LIVE
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {predictor.address.slice(0, 10)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`text-sm font-semibold ${
                              predictor.winRate >= 70
                                ? "text-green-500"
                                : predictor.winRate >= 60
                                ? "text-[#f59e0b]"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {predictor.winRate}%
                          </span>
                        </td>
                        <td className="p-4 text-right text-sm text-black dark:text-white font-medium">
                          {predictor.streak > 0 ? `${predictor.streak} 🔥` : predictor.streak}
                        </td>
                        <td className="p-4 text-right text-sm text-gray-700 dark:text-gray-300">{predictor.totalTrades}</td>
                        <td className="p-4 text-right text-sm text-gray-700 dark:text-gray-300">{predictor.followerCount}</td>
                        <td className="p-4">
                          <Link
                            href={`/predictor/${predictor.address}`}
                            className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group"
                          >
                            View{" "}
                            <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="card my-20 p-8 md:p-10 shadow-md">
          <h2 className="text-black dark:text-white mb-4 text-2xl md:text-3xl font-medium">
            Ready to <span className="text-[#7A7FEE]">Start Predicting?</span>
          </h2>
          <p className="mb-6 max-w-md text-gray-700 dark:text-gray-300 text-sm">
            Connect your wallet, create a Predictor Profile on-chain, and build a verifiable track record.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Connect Wallet</button>
            <Link href="/" className="btn-secondary text-black dark:text-white">Browse Feed</Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
