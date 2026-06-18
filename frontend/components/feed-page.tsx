'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, TrendingUp, TrendingDown, Clock, Loader2, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { TradeCard } from '@/components/trade-card'
import { CopyModal } from '@/components/copy-modal'
import { StatsTicker } from '@/components/stats-ticker'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { activeTrades, predictors, type ActiveTrade, type Direction } from '@/lib/mock-data'
import { useCopyCreatedEvents, useProfiles } from '@/hooks/useProfiles'
import { useQuery } from '@tanstack/react-query'
import { fetchActiveOracles, formatExpiry, formatStrike } from '@/lib/predict-api'
import { DUSDC_DECIMALS } from '@/lib/constants'

type Filter = 'ALL' | Direction

function formatDusd(raw: string | number) {
  return (Number(raw) / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

export function FeedPage() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [copyTrade, setCopyTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const account = useCurrentAccount()

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

  // Real on-chain data
  const { data: copyEvents, isLoading: eventsLoading, refetch: refetchEvents } = useCopyCreatedEvents(20)
  const { data: onChainProfiles } = useProfiles()
  const { data: oracles, isLoading: oraclesLoading } = useQuery({
    queryKey: ['active-oracles'],
    queryFn: fetchActiveOracles,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const hasLiveEvents = !!copyEvents && copyEvents.data.length > 0
  const hasOracles = !!oracles && oracles.length > 0

  // Build a quick address → name map from on-chain profiles
  const profileNameMap = new Map<string, string>()
  onChainProfiles?.forEach(p => profileNameMap.set(p.wallet, p.display_name))

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
            {account ? (
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500" size="lg" asChild>
                <Link href="/portfolio">My Portfolio →</Link>
              </Button>
            ) : (
              <ConnectButton connectText="Connect Wallet" className="!bg-indigo-600 !text-white hover:!bg-indigo-500 !h-11 !px-6 !text-base !rounded-lg" />
            )}
            <Button variant="outline" size="lg" asChild>
              <Link href="/leaderboard" className="flex items-center gap-2">
                View Leaderboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Social proof */}
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
            {hasLiveEvents ? (
              <span>
                <strong className="text-emerald-400">{copyEvents.data.length} live copy trade{copyEvents.data.length !== 1 ? 's' : ''}</strong> on-chain right now
              </span>
            ) : (
              <span><strong className="text-foreground">{predictors.length} predictors</strong> posting trades right now</span>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats ticker */}
        <div className="mb-8">
          <StatsTicker />
        </div>

        {/* Live on-chain activity banner */}
        {(hasLiveEvents || eventsLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" />
                <span className="font-semibold text-emerald-400 text-sm">
                  {eventsLoading ? 'Loading live activity…' : `${copyEvents!.data.length} live on-chain copy trades`}
                </span>
                {eventsLoading && <Loader2 className="size-3.5 text-emerald-400 animate-spin" />}
              </div>
              <button
                onClick={() => refetchEvents()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="size-3" /> Refresh
              </button>
            </div>

            {hasLiveEvents && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {copyEvents.data.slice(0, 6).map((event, i) => {
                  const json = event.parsedJson as {
                    copy_record_id: string
                    follower: string
                    predictor: string
                    oracle_id: string
                    is_up: boolean
                    expiry_ms: string
                    amount_dusd: string
                  }
                  const predictorName = profileNameMap.get(json.predictor)
                    ?? `${json.predictor.slice(0, 8)}…`
                  const followerShort = `${json.follower.slice(0, 8)}…`
                  const expiryLabel = formatExpiry(Number(json.expiry_ms))
                  return (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <div className={`flex items-center gap-1.5 font-semibold ${json.is_up ? 'text-emerald-400' : 'text-red-400'}`}>
                          {json.is_up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                          BTC {json.is_up ? 'UP' : 'DOWN'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {followerShort} copying <span className="text-indigo-400">{predictorName}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {expiryLabel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatDusd(json.amount_dusd)}</div>
                        <div className="text-xs text-muted-foreground">dUSDC</div>
                        <Badge variant="win" className="mt-1">LIVE</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

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
              <span className="ml-auto text-xs text-muted-foreground">{filtered.length} trades · demo</span>
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
              {/* Live oracle markets */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold font-heading text-sm flex items-center gap-2">
                    <Activity className="size-3.5 text-emerald-400" />
                    Live BTC Markets
                  </h3>
                  {oraclesLoading && <Loader2 className="size-3.5 text-muted-foreground animate-spin" />}
                </div>
                {hasOracles ? (
                  <div className="space-y-2">
                    {oracles.slice(0, 4).map(oracle => (
                      <div key={oracle.oracle_id} className="rounded-xl border border-border p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{oracle.underlying_asset}</span>
                          <Badge variant="win" className="text-[10px]">LIVE</Badge>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatExpiry(oracle.expiry)}
                          </span>
                          <span>min {formatStrike(oracle.min_strike)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    {oraclesLoading ? 'Fetching oracle data…' : 'No active markets'}
                  </div>
                )}
              </div>

              {/* Top predictors */}
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
