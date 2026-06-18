'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Medal, ArrowUpDown, Users, Copy, Flame } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyModal } from '@/components/copy-modal'
import { predictors, activeTrades, type ActiveTrade } from '@/lib/mock-data'

type SortKey = 'winRate' | 'roi7d' | 'roi30d' | 'streak' | 'followerCount' | 'totalTrades'

export function LeaderboardPage() {
  const [sortKey, setSortKey] = useState<SortKey>('winRate')
  const [sortAsc, setSortAsc] = useState(false)
  const [copyTrade, setCopyTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  function handleCopyLatest(address: string) {
    const latest = activeTrades.find(t => t.predictorAddress === address)
    if (latest) { setCopyTrade(latest); setCopyOpen(true) }
  }

  const sorted = [...predictors].sort((a, b) => {
    const av = a[sortKey] as number
    const bv = b[sortKey] as number
    return sortAsc ? av - bv : bv - av
  })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'winRate', label: 'Win Rate' },
    { key: 'roi7d', label: '7D ROI' },
    { key: 'roi30d', label: '30D ROI' },
    { key: 'streak', label: 'Streak' },
    { key: 'followerCount', label: 'Followers' },
    { key: 'totalTrades', label: 'Trades' },
  ]

  const top3 = [...predictors].sort((a, b) => b.winRate - a.winRate).slice(0, 3)

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <Medal className="size-3" />
            On-chain verified stats — tamper-proof
          </div>
          <h1 className="font-heading text-4xl font-extrabold lg:text-5xl">Leaderboard</h1>
          <p className="mt-3 text-muted-foreground">
            Every stat is stored on-chain. No screenshots. No faking.
          </p>
        </motion.div>

        {/* Podium — top 3 */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[top3[1], top3[0], top3[2]].map((p, podiumPos) => {
            const rank = podiumPos === 1 ? 1 : podiumPos === 0 ? 2 : 3
            const heights = ['h-28', 'h-36', 'h-24']
            const rankColors = ['text-slate-400', 'text-yellow-400', 'text-amber-600']
            const medalEmoji = ['🥈', '🥇', '🥉']
            return (
              <motion.div
                key={p.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + podiumPos * 0.1 }}
                className="flex flex-col items-center"
              >
                <Link href={`/predictor/${p.address}`} className="group flex flex-col items-center gap-2 mb-2">
                  <span className="text-2xl">{medalEmoji[podiumPos]}</span>
                  <Avatar className="size-14 border-2 border-border">
                    <AvatarFallback className={`text-sm font-bold ${p.avatarColor}`}>{p.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="font-semibold text-sm group-hover:text-indigo-400 transition-colors">{p.displayName}</div>
                    <div className={`text-lg font-extrabold font-heading ${rankColors[podiumPos]}`}>{p.winRate}%</div>
                    <div className="text-xs text-muted-foreground">{p.totalTrades} trades</div>
                  </div>
                </Link>
                <div className={`w-full rounded-t-xl border border-border bg-card ${heights[podiumPos]} flex items-end justify-center pb-3`}>
                  <span className={`text-2xl font-black font-heading ${rankColors[podiumPos]}`}>#{rank}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-border overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-4 text-left font-medium text-muted-foreground w-8">#</th>
                <th className="px-5 py-4 text-left font-medium text-muted-foreground">Predictor</th>
                {cols.map(c => (
                  <th
                    key={c.key}
                    className="hidden px-4 py-4 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors md:table-cell"
                    onClick={() => handleSort(c.key)}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {c.label}
                      <ArrowUpDown className={`size-3 ${sortKey === c.key ? 'text-indigo-400' : ''}`} />
                    </span>
                  </th>
                ))}
                <th className="px-5 py-4 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const hasActiveTrade = activeTrades.some(t => t.predictorAddress === p.address)
                return (
                  <tr key={p.address} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 text-muted-foreground font-bold">{i + 1}</td>
                    <td className="px-5 py-4">
                      <Link href={`/predictor/${p.address}`} className="flex items-center gap-3 hover:text-indigo-400 transition-colors">
                        <Avatar className="size-9">
                          <AvatarFallback className={`text-xs ${p.avatarColor}`}>{p.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{p.displayName}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Users className="size-3" />
                            {p.followerCount} followers
                            {p.streak >= 5 && (
                              <span className="ml-1 flex items-center gap-0.5">
                                <Flame className="size-3 text-orange-400" />
                                {p.streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell">
                      <span className={`font-bold ${p.winRate >= 70 ? 'text-emerald-400' : p.winRate >= 60 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {p.winRate}%
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell">
                      <span className={`font-medium ${p.roi7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.roi7d >= 0 ? '+' : ''}{p.roi7d}%
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell">
                      <span className={`font-medium ${p.roi30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.roi30d >= 0 ? '+' : ''}{p.roi30d}%
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell">
                      <span>{p.streak}🔥</span>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell text-muted-foreground">{p.followerCount}</td>
                    <td className="hidden px-4 py-4 text-right md:table-cell text-muted-foreground">{p.totalTrades}</td>
                    <td className="px-5 py-4 text-right">
                      {hasActiveTrade ? (
                        <Button
                          size="sm"
                          className="bg-indigo-600 text-white hover:bg-indigo-500"
                          onClick={() => handleCopyLatest(p.address)}
                        >
                          Copy Latest
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/predictor/${p.address}`}>View Profile</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>

        {/* Stats footer */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Copy, label: 'Total Copies', value: '341' },
            { icon: TrendingUp, label: 'Avg Win Rate', value: `${Math.round(predictors.reduce((s, p) => s + p.winRate, 0) / predictors.length)}%` },
            { icon: Users, label: 'Total Followers', value: predictors.reduce((s, p) => s + p.followerCount, 0).toLocaleString() },
            { icon: TrendingDown, label: 'Total Earnings', value: `$${(predictors.reduce((s, p) => s + p.earningsCents, 0) / 100).toLocaleString()}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <Icon className="size-5 mx-auto mb-2 text-indigo-400" />
              <div className="text-xl font-bold font-heading">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </main>

      <CopyModal trade={copyTrade} open={copyOpen} onOpenChange={setCopyOpen} />
    </>
  )
}
