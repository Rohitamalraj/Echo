'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowLeftRight, Wallet, DollarSign, Target, BarChart2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPredictorByAddress, portfolioPositions } from '@/lib/mock-data'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { fetchFollowerCopies } from '@/lib/sui-client'
import { DUSDC_DECIMALS } from '@/lib/constants'

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const directionColor = { UP: 'text-emerald-400', DOWN: 'text-red-400', RANGE: 'text-indigo-400' }
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC RANGE' }

function formatDusd(raw: string | number) {
  const n = Number(raw) / Math.pow(10, DUSDC_DECIMALS)
  return n.toFixed(2)
}

function truncate(addr: string) {
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`
}

export function PortfolioPage() {
  const account = useCurrentAccount()
  const [tab, setTab] = useState<'open' | 'settled' | 'earnings'>('open')

  // Real on-chain copy events for connected wallet
  const { data: onChainCopies, isLoading } = useQuery({
    queryKey: ['follower-copies', account?.address],
    queryFn: () => fetchFollowerCopies(account!.address),
    enabled: !!account,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  // Use on-chain data if available, fall back to mock
  const useLive = !!account && !!onChainCopies && onChainCopies.length > 0
  const displayPositions = useLive
    ? [] // on-chain events are shown in the events section below
    : portfolioPositions

  const openPositions = displayPositions.filter(p => p.outcome === 'OPEN')
  const settledPositions = displayPositions.filter(p => p.outcome !== 'OPEN')
  const wins = settledPositions.filter(p => p.outcome === 'WIN')
  const losses = settledPositions.filter(p => p.outcome === 'LOSS')

  const totalInvested = displayPositions.reduce((s, p) => s + p.amountCents, 0)
  const totalPayout = settledPositions.reduce((s, p) => s + p.payoutCents, 0)
  const netPnL = totalPayout - settledPositions.reduce((s, p) => s + p.amountCents, 0)
  const winRate = settledPositions.length > 0 ? Math.round((wins.length / settledPositions.length) * 100) : 0
  const openValue = openPositions.reduce((s, p) => s + p.amountCents, 0)
  const predictorCutsPaid = settledPositions.reduce((s, p) => s + p.predictorCutCents, 0)

  const summaryStats = [
    { icon: DollarSign, label: 'Net P&L', value: `${netPnL >= 0 ? '+' : ''}$${(netPnL / 100).toFixed(2)}`, color: netPnL >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? 'text-emerald-400' : 'text-foreground' },
    { icon: Wallet, label: 'Open Value', value: `$${(openValue / 100).toFixed(2)}`, color: 'text-amber-400' },
    { icon: BarChart2, label: 'Total Traded', value: `$${(totalInvested / 100).toFixed(2)}`, color: 'text-foreground' },
  ]

  const tabs = [
    { key: 'open' as const, label: `Open` },
    { key: 'settled' as const, label: `Settled` },
    { key: 'earnings' as const, label: 'Earnings' },
  ]

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-extrabold">My Portfolio</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                {account ? (
                  <>
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <code className="font-mono text-xs">{truncate(account.address)}</code>
                    <span className="text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5">Connected</span>
                  </>
                ) : (
                  <span className="text-amber-400 text-sm">Connect wallet to see your positions</span>
                )}
              </div>
            </div>
            {account && (
              <Link
                href={`/predictor/${account.address}`}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline"
              >
                View my predictor profile →
              </Link>
            )}
          </div>
        </motion.div>

        {/* No wallet connected */}
        {!account && (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <Wallet className="size-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-semibold font-heading mb-2">Connect your wallet</p>
            <p className="text-sm text-muted-foreground">Connect to see your open and settled copy-trade positions</p>
          </div>
        )}

        {account && (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
              {summaryStats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Icon className="size-3.5" />
                    {label}
                  </div>
                  <div className={`text-2xl font-bold font-heading ${color}`}>{value}</div>
                </div>
              ))}
            </motion.div>

            {/* Live on-chain copy events */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Loader2 className="size-4 animate-spin" /> Loading on-chain positions…
              </div>
            )}

            {onChainCopies && onChainCopies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">
                    {onChainCopies.length} on-chain copy record{onChainCopies.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <div className="space-y-3">
                  {onChainCopies.slice(0, 10).map((event, i) => {
                    const json = event.parsedJson as {
                      copy_record_id: string
                      follower: string
                      predictor: string
                      oracle_id: string
                      is_up: boolean
                      expiry_ms: string
                      amount_dusd: string
                    }
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                        <div>
                          <div className={`font-semibold ${json.is_up ? 'text-emerald-400' : 'text-red-400'}`}>
                            BTC {json.is_up ? 'UP ▲' : 'DOWN ▼'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Copying {json.predictor.slice(0, 8)}…
                            · Expires {new Date(Number(json.expiry_ms)).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatDusd(json.amount_dusd)} dUSDC</div>
                          <Badge variant="pending" className="mt-1">LIVE</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Tabs — mock fallback when no on-chain data */}
            {!useLive && (
              <>
                <div className="mb-6 flex gap-1 rounded-xl bg-muted/30 p-1">
                  {tabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                        tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Open positions */}
                {tab === 'open' && (
                  <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    {openPositions.length === 0 ? (
                      <div className="rounded-2xl border border-border bg-card py-16 text-center">
                        <p className="text-muted-foreground">No open positions.</p>
                        <Button className="mt-4 bg-indigo-600 text-white hover:bg-indigo-500" asChild>
                          <Link href="/">Browse the Feed</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {openPositions.map(pos => {
                          const predictor = getPredictorByAddress(pos.predictorAddress)
                          const Icon = directionIcon[pos.direction]
                          return (
                            <motion.div
                              key={pos.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                                  <Clock className="size-5 text-amber-400" />
                                </div>
                                <div>
                                  <div className={`flex items-center gap-2 font-semibold ${directionColor[pos.direction]}`}>
                                    <Icon className="size-4" />
                                    {directionLabel[pos.direction]} ${pos.strike.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    Copying {predictor?.displayName ?? 'Unknown'}
                                    <span>·</span>
                                    Expires in {pos.expiryMinutes}m
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${(pos.amountCents / 100).toFixed(2)}</div>
                                <Badge variant="pending" className="mt-1">LIVE</Badge>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Settled */}
                {tab === 'settled' && (
                  <motion.div key="settled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Trade</th>
                            <th className="hidden px-4 py-3.5 text-left font-medium text-muted-foreground sm:table-cell">Copied from</th>
                            <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">Amount</th>
                            <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">Your P&L</th>
                            <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settledPositions.map(pos => {
                            const predictor = getPredictorByAddress(pos.predictorAddress)
                            const Icon = directionIcon[pos.direction]
                            const pnl = pos.outcome === 'WIN' ? pos.payoutCents - pos.amountCents : -pos.amountCents
                            return (
                              <tr key={pos.id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                                <td className="px-5 py-4">
                                  <div className={`flex items-center gap-2 font-semibold ${directionColor[pos.direction]}`}>
                                    <Icon className="size-4" />
                                    {directionLabel[pos.direction]} ${pos.strike.toLocaleString()}
                                  </div>
                                </td>
                                <td className="hidden px-4 py-4 sm:table-cell">
                                  {predictor ? (
                                    <Link href={`/predictor/${predictor.address}`} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                                      <Avatar className="size-6">
                                        <AvatarFallback className={`text-xs ${predictor.avatarColor}`}>{predictor.initials}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{predictor.displayName}</span>
                                    </Link>
                                  ) : '—'}
                                </td>
                                <td className="px-4 py-4 text-right text-muted-foreground">${(pos.amountCents / 100).toFixed(2)}</td>
                                <td className={`px-4 py-4 text-right font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {pnl >= 0 ? '+' : ''}${(pnl / 100).toFixed(2)}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  {pos.outcome === 'WIN' ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <CheckCircle className="size-4 text-emerald-400" />
                                      <Badge variant="win">WIN</Badge>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <XCircle className="size-4 text-red-400" />
                                      <Badge variant="loss">LOSS</Badge>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
                      <span className="text-muted-foreground">{wins.length} wins · {losses.length} losses · {winRate}% win rate</span>
                      <span className={`font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Net: {netPnL >= 0 ? '+' : ''}${(netPnL / 100).toFixed(2)} dUSDC
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Earnings */}
                {tab === 'earnings' && (
                  <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                      <div>
                        <h3 className="font-semibold font-heading mb-1">Predictor Cut Paid</h3>
                        <p className="text-sm text-muted-foreground mb-4">15% of your gross winnings, split automatically by the Move contract</p>
                        <div className="text-3xl font-extrabold font-heading text-indigo-400">
                          ${(predictorCutsPaid / 100).toFixed(2)} dUSDC
                        </div>
                      </div>
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-muted-foreground">
                        All payouts split automatically by <code className="text-xs text-indigo-400">echo::copy_trade::settle_copy</code> at settlement. No admin key. No manual withdrawal.
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
