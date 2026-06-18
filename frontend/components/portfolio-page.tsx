'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowLeftRight, Wallet, DollarSign, Target, BarChart2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPredictorByAddress, portfolioPositions, MOCK_WALLET } from '@/lib/mock-data'

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const directionColor = { UP: 'text-emerald-400', DOWN: 'text-red-400', RANGE: 'text-indigo-400' }
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC RANGE' }

export function PortfolioPage() {
  const [tab, setTab] = useState<'open' | 'settled' | 'earnings'>('open')

  const openPositions = portfolioPositions.filter(p => p.outcome === 'OPEN')
  const settledPositions = portfolioPositions.filter(p => p.outcome !== 'OPEN')
  const wins = settledPositions.filter(p => p.outcome === 'WIN')
  const losses = settledPositions.filter(p => p.outcome === 'LOSS')

  const totalInvested = portfolioPositions.reduce((s, p) => s + p.amountCents, 0)
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
    { key: 'open' as const, label: `Open (${openPositions.length})` },
    { key: 'settled' as const, label: `Settled (${settledPositions.length})` },
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
                <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <code className="font-mono text-xs">{MOCK_WALLET.slice(0, 10)}...{MOCK_WALLET.slice(-6)}</code>
                <span className="text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5">Connected</span>
              </div>
            </div>
            <Button variant="outline" size="sm">Disconnect</Button>
          </div>
        </motion.div>

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
                            {pos.copiedMinutesAgo < 60 ? `${pos.copiedMinutesAgo}m ago` : `${Math.floor(pos.copiedMinutesAgo / 60)}h ago`}
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

        {/* Settled positions */}
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
                    const pnl = pos.outcome === 'WIN'
                      ? pos.payoutCents - pos.amountCents
                      : -pos.amountCents
                    return (
                      <tr key={pos.id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-2 font-semibold ${directionColor[pos.direction]}`}>
                            <Icon className="size-4" />
                            {directionLabel[pos.direction]} ${pos.strike.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {pos.copiedMinutesAgo < 60
                              ? `${pos.copiedMinutesAgo}m ago`
                              : `${Math.floor(pos.copiedMinutesAgo / 60)}h ago`}
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
                        <td className="px-4 py-4 text-right text-muted-foreground">
                          ${(pos.amountCents / 100).toFixed(2)}
                        </td>
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

            {/* Summary row */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{wins.length} wins · {losses.length} losses</span>
                <span>Win rate: <strong className="text-foreground">{winRate}%</strong></span>
              </div>
              <div className={`font-bold text-base ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Net P&L: {netPnL >= 0 ? '+' : ''}${(netPnL / 100).toFixed(2)} dUSDC
              </div>
            </div>
          </motion.div>
        )}

        {/* Earnings breakdown */}
        {tab === 'earnings' && (
          <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div>
                <h3 className="font-semibold font-heading mb-1">Predictor Cut Paid</h3>
                <p className="text-sm text-muted-foreground mb-4">Amount automatically sent to predictors from your winning trades</p>
                <div className="text-3xl font-extrabold font-heading text-indigo-400">
                  ${(predictorCutsPaid / 100).toFixed(2)} dUSDC
                </div>
                <p className="text-xs text-muted-foreground mt-1">15% of your gross winnings, split by smart contract</p>
              </div>

              <div className="border-t border-border pt-5">
                <h3 className="font-semibold font-heading mb-3">Breakdown by Predictor</h3>
                <div className="space-y-3">
                  {settledPositions
                    .filter(p => p.outcome === 'WIN' && p.predictorCutCents > 0)
                    .map(pos => {
                      const predictor = getPredictorByAddress(pos.predictorAddress)
                      if (!predictor) return null
                      return (
                        <div key={pos.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                          <Link href={`/predictor/${predictor.address}`} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                            <Avatar className="size-8">
                              <AvatarFallback className={`text-xs ${predictor.avatarColor}`}>{predictor.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{predictor.displayName}</div>
                              <div className="text-xs text-muted-foreground">
                                {directionLabel[pos.direction]} ${pos.strike.toLocaleString()}
                              </div>
                            </div>
                          </Link>
                          <div className="text-right">
                            <div className="font-semibold text-indigo-400">${(pos.predictorCutCents / 100).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">15% cut</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-muted-foreground">
                All payouts are split automatically by the Echo Move smart contract at settlement. No admin key. No manual withdrawal required.
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </>
  )
}
