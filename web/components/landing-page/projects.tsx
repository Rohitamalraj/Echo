"use client"

import Link from "next/link"
import { ArrowUpRight, Clock, Users, Lock } from "lucide-react"
import { MOCK_TRADE_CALLS } from "@/components/echo/mock-data"
import { getDirectionClasses, formatExpiry, formatPostedAt } from "@/components/echo/mock-data"

export default function Projects() {
  const trades = MOCK_TRADE_CALLS.slice(0, 3)

  return (
    <section id="projects" className="my-20">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        Live Trade
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Feed</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Verified predictors post their DeepBook Predict positions in real time. Browse open calls, check their
        on-chain track record, and copy with one tap.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trades.map((trade) => {
          const dirClasses = getDirectionClasses(trade.direction)
          const isExpired = trade.expiryMs <= Date.now()
          return (
            <div
              key={trade.id}
              className="card overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-[1.02]"
            >
              {/* Direction banner */}
              <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${dirClasses.badge} border-b border-gray-100 dark:border-gray-800`}>
                <span>BTC {trade.direction} ${trade.strike.toLocaleString()}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isExpired ? "Expired" : formatExpiry(trade.expiryMs)}
                </span>
              </div>

              <div className="p-4 md:p-6">
                {/* Predictor */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {trade.predictor.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black dark:text-white">{trade.predictor.displayName}</p>
                    <p className="text-xs text-gray-500">{trade.predictor.winRate}% win rate · {formatPostedAt(trade.postedAt)}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{trade.impliedProb}% implied prob.</span>
                  <span>{trade.positionSize} dUSDC</span>
                </div>

                {/* Reasoning preview */}
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4 min-h-[48px] flex items-center">
                  {trade.isPremium ? (
                    <span className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                      <Lock className="w-3 h-3" /> Premium signal — {trade.signalFee} dUSDC to unlock
                    </span>
                  ) : (
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">"{trade.reasoning}"</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" /> {trade.copiers} copying
                  </span>
                  <div className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group">
                    Copy Trade{" "}
                    <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/leaderboard" className="btn-primary">
          View Leaderboard
        </Link>
      </div>
    </section>
  )
}
