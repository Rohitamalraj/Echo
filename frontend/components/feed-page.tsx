'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { TradeCard } from '@/components/trade-card'
import { CopyModal } from '@/components/copy-modal'
import { StatsTicker } from '@/components/stats-ticker'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { activeTrades, predictors, type ActiveTrade, type Direction } from '@/lib/mock-data'

type Filter = 'ALL' | Direction

export function FeedPage() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [copyTrade, setCopyTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  function handleCopy(trade: ActiveTrade) {
    setCopyTrade(trade)
    setCopyOpen(true)
  }

  const filtered = filter === 'ALL' ? activeTrades : activeTrades.filter(t => t.direction === filter)

  const topPredictors = [...predictors].sort((a, b) => b.winRate - a.winRate).slice(0, 5)

  const filters: { label: string; value: Filter }[] = [
    { label: 'All Trades', value: 'ALL' },
    { label: '▲ BTC UP', value: 'UP' },
    { label: '▼ BTC DOWN', value: 'DOWN' },
    { label: '↔ Range', value: 'RANGE' },
  ]

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(125% 80% at 50% 0%, oklch(0.145 0 0) 45%, #4338ca 140%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400"
          >
            <Zap className="size-3" />
            Live on Sui Testnet · DeepBook Predict
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="font-heading text-4xl font-extrabold text-balance lg:text-6xl"
          >
            Copy the Best Traders.
            <br />
            <span className="text-indigo-400">Win Together.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
            className="mx-auto mt-4 max-w-xl text-muted-foreground lg:text-lg"
          >
            On-chain copy trading on DeepBook Predict. Verified track records. Automatic 85/15 payout split — enforced by Move smart contract.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500" size="lg">
              Connect Wallet
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/leaderboard" className="flex items-center gap-2">
                View Leaderboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Social proof avatars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <span className="flex -space-x-2">
              {topPredictors.map(p => (
                <Avatar key={p.address} className="size-8 border-2 border-background">
                  <AvatarFallback className={`text-xs ${p.avatarColor}`}>{p.initials}</AvatarFallback>
                </Avatar>
              ))}
            </span>
            <span><strong className="text-foreground">23 predictors</strong> posting trades right now</span>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats ticker */}
        <div className="mb-8">
          <StatsTicker />
        </div>

        <div className="flex gap-8">
          {/* Feed column */}
          <div className="flex-1 min-w-0">
            {/* Filter tabs */}
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-muted-foreground">{filtered.length} trades</span>
            </div>

            {/* Trade cards grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((trade, i) => (
                <TradeCard key={trade.id} trade={trade} index={i} onCopy={handleCopy} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold font-heading text-sm">Top Predictors</h3>
                  <Link href="/leaderboard" className="text-xs text-indigo-400 hover:text-indigo-300">
                    See all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {topPredictors.map((p, i) => (
                    <Link
                      key={p.address}
                      href={`/predictor/${p.address}`}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-4 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <Avatar className="size-8">
                        <AvatarFallback className={`text-xs ${p.avatarColor}`}>{p.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{p.displayName}</div>
                        <div className="text-xs text-muted-foreground">{p.streak}🔥 · {p.roi7d}% 7d ROI</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-400">{p.winRate}%</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold font-heading text-sm">How Echo Works</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {[
                    { n: '1', t: 'Browse the feed', d: 'See live trades from verified predictors' },
                    { n: '2', t: 'Copy a trade', d: 'One tap — your position goes on-chain' },
                    { n: '3', t: 'Win together', d: '85% yours · 15% to the predictor, auto-split' },
                  ].map(({ n, t, d }) => (
                    <div key={n} className="flex gap-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                        {n}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{t}</div>
                        <div className="text-xs">{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <CopyModal trade={copyTrade} open={copyOpen} onOpenChange={setCopyOpen} />
    </>
  )
}
