'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, ExternalLink, Users, Copy, Flame, DollarSign, Trophy } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TradeCard } from '@/components/trade-card'
import { CopyModal } from '@/components/copy-modal'
import { getPredictorByAddress, getTradesByPredictor, predictors, type ActiveTrade } from '@/lib/mock-data'

interface PredictorPageProps { address: string }

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const outcomeBadge = { WIN: 'win', LOSS: 'loss', OPEN: 'pending' } as const
const directionColor = { UP: 'text-emerald-400', DOWN: 'text-red-400', RANGE: 'text-indigo-400' }
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC RANGE' }

export function PredictorPage({ address }: PredictorPageProps) {
  const [tab, setTab] = useState<'positions' | 'history' | 'followers'>('positions')
  const [copyTrade, setCopyTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  // Fall back to first predictor if address not found (for demo nav)
  const predictor = getPredictorByAddress(address) ?? predictors[0]
  const activeTrades = getTradesByPredictor(predictor.address)

  const stats = [
    { icon: Trophy, label: 'Win Rate', value: `${predictor.winRate}%`, color: predictor.winRate >= 70 ? 'text-emerald-400' : 'text-foreground' },
    { icon: Copy, label: 'Total Trades', value: predictor.totalTrades.toString(), color: 'text-foreground' },
    { icon: Users, label: 'Followers', value: predictor.followerCount.toLocaleString(), color: 'text-foreground' },
    { icon: TrendingUp, label: '30D ROI', value: `+${predictor.roi30d}%`, color: 'text-emerald-400' },
    { icon: Flame, label: 'Best Streak', value: `${predictor.bestStreak}🔥`, color: 'text-orange-400' },
    { icon: DollarSign, label: 'Copy Earnings', value: `$${(predictor.earningsCents / 100).toLocaleString()}`, color: 'text-indigo-400' },
  ]

  const tabs = [
    { key: 'positions' as const, label: `Active (${activeTrades.length})` },
    { key: 'history' as const, label: `Trade History (${predictor.recentTrades.length})` },
    { key: 'followers' as const, label: `Followers (${predictor.followerCount})` },
  ]

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Back */}
        <Link href="/leaderboard" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back to Leaderboard
        </Link>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-2xl border border-border bg-card p-6"
          style={{ background: 'linear-gradient(135deg, oklch(0.178 0 0) 0%, oklch(0.16 0.04 264) 100%)' }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-border">
                <AvatarFallback className={`text-xl font-bold ${predictor.avatarColor}`}>{predictor.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-extrabold font-heading">{predictor.displayName}</h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="font-mono text-xs">{predictor.address.slice(0, 10)}...{predictor.address.slice(-6)}</code>
                  <ExternalLink className="size-3" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">Joined {predictor.joinedDaysAgo}d ago</Badge>
                  {predictor.streak >= 5 && <Badge variant="pending">{predictor.streak}🔥 Active Streak</Badge>}
                  {predictor.winRate >= 70 && <Badge variant="bull">Top Predictor</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/predictor/${predictor.address}`}>Follow</Link>
              </Button>
              {activeTrades.length > 0 && (
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => { setCopyTrade(activeTrades[0]); setCopyOpen(true) }}
                >
                  Copy Latest Trade
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 grid grid-cols-3 gap-3 lg:grid-cols-6"
        >
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <Icon className="size-4 mx-auto mb-1.5 text-muted-foreground" />
              <div className={`text-xl font-bold font-heading ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
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

        {/* Tab content */}
        {tab === 'positions' && (
          <motion.div key="positions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {activeTrades.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeTrades.map((trade, i) => (
                  <TradeCard key={trade.id} trade={trade} index={i} onCopy={(t) => { setCopyTrade(t); setCopyOpen(true) }} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card py-16 text-center">
                <p className="text-muted-foreground">No active positions right now.</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Trade</th>
                    <th className="hidden px-4 py-3.5 text-right font-medium text-muted-foreground sm:table-cell">Copies</th>
                    <th className="hidden px-4 py-3.5 text-right font-medium text-muted-foreground sm:table-cell">Prob</th>
                    <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">Position</th>
                    <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {predictor.recentTrades.map(trade => {
                    const Icon = directionIcon[trade.direction]
                    return (
                      <tr key={trade.id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-2 font-semibold ${directionColor[trade.direction]}`}>
                            <Icon className="size-4" />
                            {directionLabel[trade.direction]} ${trade.strike.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {trade.settledHoursAgo < 24 ? `${trade.settledHoursAgo}h ago` : `${Math.floor(trade.settledHoursAgo / 24)}d ago`}
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 text-right text-muted-foreground sm:table-cell">{trade.copies}</td>
                        <td className="hidden px-4 py-4 text-right text-muted-foreground sm:table-cell">{trade.impliedProb}%</td>
                        <td className="px-4 py-4 text-right text-muted-foreground">
                          ${(trade.positionSizeCents / 100).toFixed(0)} dUSDC
                        </td>
                        <td className="px-5 py-4 text-right">
                          {trade.outcome === 'WIN' ? (
                            <div>
                              <Badge variant="win">WIN</Badge>
                              <div className="text-xs text-emerald-400 mt-0.5 font-medium">
                                +${((trade.payoutCents - trade.positionSizeCents) / 100).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Badge variant="loss">LOSS</Badge>
                              <div className="text-xs text-red-400 mt-0.5 font-medium">
                                -${(trade.positionSizeCents / 100).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === 'followers' && (
          <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: Math.min(predictor.followerCount, 16) }).map((_, i) => {
                  const colors = ['bg-indigo-500/20 text-indigo-400', 'bg-emerald-500/20 text-emerald-400', 'bg-amber-500/20 text-amber-400', 'bg-pink-500/20 text-pink-400', 'bg-violet-500/20 text-violet-400']
                  const initials = ['0x1a', '0x4f', '0xb2', '0x7e', '0xc3', '0x8d', '0x2f', '0x5a', '0x91', '0x3c', '0x6b', '0xe7', '0x04', '0x9f', '0xd1', '0x58']
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className={`text-xs ${colors[i % colors.length]}`}>
                          {initials[i]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-mono text-muted-foreground">{initials[i]}...{(i * 7 + 3).toString(16).padStart(4, '0')}</div>
                        <div className="text-xs text-muted-foreground">{Math.floor(Math.random() * 20 + 1)} copies</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {predictor.followerCount > 16 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  +{predictor.followerCount - 16} more followers
                </p>
              )}
            </div>
          </motion.div>
        )}
      </main>

      <CopyModal trade={copyTrade} open={copyOpen} onOpenChange={setCopyOpen} />
    </>
  )
}
