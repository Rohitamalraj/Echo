"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, Users, Lock } from "lucide-react"
import { activeTrades, getPredictorByAddress, type ActiveTrade } from "@/lib/mock-data"
import dynamic from "next/dynamic"

const CopyModal = dynamic(() => import("@/components/echo/copy-modal"), { ssr: false })

function dirClasses(dir: string) {
  if (dir === "UP") return { badge: "bg-green-500/10 text-green-500 border border-green-500/20" }
  if (dir === "DOWN") return { badge: "bg-red-500/10 text-red-500 border border-red-500/20" }
  return { badge: "bg-blue-500/10 text-blue-500 border border-blue-500/20" }
}

function formatExpiry(minutes: number): string {
  if (minutes <= 0) return "Expired"
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function Projects() {
  const trades = activeTrades.slice(0, 3)
  const [selectedTrade, setSelectedTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  function handleCopy(trade: ActiveTrade) {
    setSelectedTrade(trade)
    setCopyOpen(true)
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trades.map((trade) => {
          const predictor = getPredictorByAddress(trade.predictorAddress)
          const name = predictor?.displayName ?? trade.predictorDisplay?.displayName ?? "Unknown"
          const winRate = predictor?.winRate ?? trade.predictorDisplay?.winRate ?? 0
          const dc = dirClasses(trade.direction)
          const amount = (trade.positionSizeCents / 100).toFixed(2)

          return (
            <div
              key={trade.id}
              className="card overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-[1.02]"
            >
              {/* Direction banner */}
              <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${dc.badge} border-b border-gray-100 dark:border-gray-800`}>
                <span>BTC {trade.direction} ${trade.strike.toLocaleString()}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatExpiry(trade.expiryMinutes)}
                </span>
              </div>

              <div className="p-4 md:p-6">
                {/* Predictor */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#7A7FEE] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(predictor?.initials ?? name.slice(0, 2)).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500">{winRate}% win rate · {trade.postedMinutesAgo}m ago</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{trade.impliedProb}% implied prob.</span>
                  <span>{amount} dUSDC</span>
                </div>

                {/* Reasoning */}
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4 min-h-[48px] flex items-center">
                  {trade.isPremium ? (
                    <span className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                      <Lock className="w-3 h-3" /> Premium signal — {(trade.signalFeeCents / 100).toFixed(2)} dUSDC
                    </span>
                  ) : (
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">"{trade.reasoning}"</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" /> {trade.copies} copying
                  </span>
                  <button
                    onClick={() => handleCopy(trade)}
                    className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group"
                  >
                    Copy Trade{" "}
                    <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
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

      <CopyModal trade={selectedTrade} open={copyOpen} onOpenChange={setCopyOpen} />
    </section>
  )
}
