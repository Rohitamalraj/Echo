"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import {
  MOCK_PREDICTORS,
  MOCK_TRADE_CALLS,
  MOCK_TRADE_HISTORY,
  getDirectionClasses,
  formatExpiry,
  formatPostedAt,
} from "@/components/echo/mock-data"
import { Lock, Clock, Users } from "lucide-react"

interface Props {
  params: { address: string }
}

export default function PredictorProfilePage({ params }: Props) {
  const predictor =
    MOCK_PREDICTORS.find((p) => p.address === params.address) ?? MOCK_PREDICTORS[0]

  const activeTrades = MOCK_TRADE_CALLS.filter(
    (t) => t.predictor.address === predictor.address
  )

  const stats = [
    { label: "Win Rate", value: `${predictor.winRate}%`, color: predictor.winRate >= 70 ? "text-green-500" : "text-[#f59e0b]" },
    { label: "Total Trades", value: String(predictor.totalTrades), color: "text-black dark:text-white" },
    { label: "7D ROI", value: `+${predictor.roi7d}%`, color: "text-green-500" },
    { label: "Streak", value: `${predictor.streak} 🔥`, color: "text-black dark:text-white" },
    { label: "Followers", value: String(predictor.followers), color: "text-[#7A7FEE]" },
  ]

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

        {/* Profile hero card — same .card pattern as hero.tsx */}
        <section className="card my-4 p-8 md:p-10 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {predictor.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-black dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-2">
                {predictor.displayName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-mono mb-4">{predictor.address}</p>
              <button className="btn-primary text-sm">Follow Predictor</button>
            </div>
          </div>
        </section>

        {/* Stats — same services 3-col card pattern */}
        <section className="my-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Active Trade Calls */}
          <div className="lg:col-span-2">
            <h2 className="text-black dark:text-white mb-6 text-2xl md:text-3xl font-medium leading-tight">
              Active <span className="text-[#7A7FEE]">Trade Calls</span>
            </h2>

            {activeTrades.length === 0 ? (
              <div className="card p-8 shadow-md text-center">
                <p className="text-gray-700 dark:text-gray-300">No active trade calls right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrades.map((trade) => {
                  const dirClasses = getDirectionClasses(trade.direction)
                  const isExpired = trade.expiryMs <= Date.now()
                  return (
                    <div key={trade.id} className="card overflow-hidden shadow-md">
                      {/* Direction banner */}
                      <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${dirClasses.badge} border-b border-gray-100 dark:border-gray-800`}>
                        <span>BTC {trade.direction} ${trade.strike.toLocaleString()}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isExpired ? "Expired" : formatExpiry(trade.expiryMs)}
                        </span>
                      </div>
                      <div className="p-4 md:p-6">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span>{trade.impliedProb}% implied probability</span>
                          <span>{trade.positionSize} dUSDC position</span>
                          <span>{formatPostedAt(trade.postedAt)}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4">
                          {trade.isPremium ? (
                            <span className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                              <Lock className="w-3 h-3" /> Premium signal — {trade.signalFee} dUSDC to unlock
                            </span>
                          ) : (
                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{trade.reasoning}"</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" /> {trade.copiers} copying
                          </span>
                          <button className="btn-primary text-sm px-4 py-2" disabled={isExpired}>
                            {isExpired ? "Expired" : "Copy Trade"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                {MOCK_TRADE_HISTORY.map((t) => {
                  const dirClasses = getDirectionClasses(t.direction)
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold ${dirClasses.badge}`}>
                          {t.direction}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          ${t.strike.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${t.outcome === "won" ? "text-green-500" : "text-red-500"}`}>
                          {t.outcome === "won" ? `+${t.payout} dUSDC` : "Lost"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(t.date).toLocaleDateString()}
                        </p>
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
