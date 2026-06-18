'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, ExternalLink,
  Users, Copy, Flame, DollarSign, Trophy, Loader2, Activity,
  CheckCircle, XCircle, Clock
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TradeCard } from '@/components/trade-card'
import { CopyModal } from '@/components/copy-modal'
import { CreateProfileModal } from '@/components/create-profile-modal'
import {
  getPredictorByAddress, getTradesByPredictor, predictors, type ActiveTrade
} from '@/lib/mock-data'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { useProfiles, useCopyCreatedEvents, useCopySettledEvents, bpsToPercent } from '@/hooks/useProfiles'
import { type PredictorProfileFields } from '@/lib/sui-client'
import { DUSDC_DECIMALS, ECHO_PACKAGE_ID } from '@/lib/constants'
import { formatExpiry } from '@/lib/predict-api'

interface PredictorPageProps { address: string }

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const outcomeBadge = { WIN: 'win', LOSS: 'loss', OPEN: 'pending' } as const
const directionColor = { UP: 'text-emerald-400', DOWN: 'text-red-400', RANGE: 'text-indigo-400' }
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC RANGE' }

function formatDusd(raw: string | number) {
  return (Number(raw) / Math.pow(10, DUSDC_DECIMALS)).toFixed(2)
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function msToJoinedLabel(createdAtMs: string) {
  const days = Math.floor((Date.now() - Number(createdAtMs)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days}d ago`
}

export function PredictorPage({ address }: PredictorPageProps) {
  const [tab, setTab] = useState<'positions' | 'history' | 'followers'>('positions')
  const [copyTrade, setCopyTrade] = useState<ActiveTrade | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [createProfileOpen, setCreateProfileOpen] = useState(false)

  const account = useCurrentAccount()
  const isOwnProfile = account?.address === address

  // On-chain data
  const { data: allProfiles, isLoading: profilesLoading } = useProfiles()
  const { data: copyCreatedData, isLoading: eventsLoading } = useCopyCreatedEvents(100)
  const { data: copySettledData } = useCopySettledEvents(100)

  // Find this address's on-chain profile
  const onChainProfile = allProfiles?.find(p => p.wallet === address)

  // Events for this predictor
  type CopyCreatedJson = {
    copy_record_id: string; follower: string; predictor: string
    oracle_id: string; is_up: boolean; expiry_ms: string; amount_dusd: string
  }
  type CopySettledJson = {
    copy_record_id: string; follower: string; predictor: string
    won: boolean; gross_payout_dusd: string; follower_payout_dusd: string; predictor_cut_dusd: string
  }

  const predictorCopyEvents = (copyCreatedData?.data ?? []).filter(
    e => (e.parsedJson as CopyCreatedJson).predictor === address
  )
  const predictorSettledEvents = (copySettledData?.data ?? []).filter(
    e => (e.parsedJson as CopySettledJson).predictor === address
  )

  // Mock fallback
  const mockPredictor = getPredictorByAddress(address) ?? (onChainProfile ? null : predictors[0])
  const mockTrades = mockPredictor ? getTradesByPredictor(mockPredictor.address) : []

  const isLive = !!onChainProfile
  const isLoading = profilesLoading || eventsLoading

  // Build display values — prefer on-chain, fall back to mock
  const displayName = onChainProfile?.display_name ?? mockPredictor?.displayName ?? shortAddr(address)
  const winRate = onChainProfile ? bpsToPercent(onChainProfile.win_rate_bps) : (mockPredictor?.winRate ?? 0)
  const totalTrades = onChainProfile ? Number(onChainProfile.total_trades) : (mockPredictor?.totalTrades ?? 0)
  const followerCount = onChainProfile ? Number(onChainProfile.follower_count) : (mockPredictor?.followerCount ?? 0)
  const currentStreak = onChainProfile ? Number(onChainProfile.current_streak) : (mockPredictor?.streak ?? 0)
  const bestStreak = onChainProfile ? Number(onChainProfile.best_streak) : (mockPredictor?.bestStreak ?? 0)
  const copyEarnings = onChainProfile
    ? Number(onChainProfile.copy_earnings_cents) / 100
    : (mockPredictor ? mockPredictor.earningsCents / 100 : 0)
  const joinedLabel = onChainProfile
    ? msToJoinedLabel(onChainProfile.created_at_ms)
    : (mockPredictor ? `${mockPredictor.joinedDaysAgo}d ago` : '—')

  const avatarInitials = initials(displayName)
  const avatarColor = mockPredictor?.avatarColor ?? 'bg-indigo-500/20 text-indigo-400'

  // Build an ActiveTrade from the most recent CopyCreated event for "Copy Latest" button
  function buildLatestTrade(): ActiveTrade | null {
    if (!predictorCopyEvents.length) return null
    const latest = predictorCopyEvents[0]
    const json = latest.parsedJson as CopyCreatedJson
    const expiryMs = Number(json.expiry_ms)
    const expiryMinutes = Math.max(0, Math.floor((expiryMs - Date.now()) / 60_000))
    return {
      id: json.copy_record_id,
      predictorAddress: address,
      predictorProfileObjectId: onChainProfile?.id.id,
      predictorDisplay: { displayName, initials: avatarInitials, avatarColor, winRate, streak: currentStreak },
      direction: json.is_up ? 'UP' : 'DOWN',
      strike: 0, // unknown without oracle lookup
      expiryMinutes,
      impliedProb: 50,
      positionSizeCents: Math.round(Number(json.amount_dusd) / 10_000),
      copies: predictorCopyEvents.length,
      postedMinutesAgo: 0,
      reasoning: null,
      isPremium: false,
      signalFeeCents: 0,
      btcCurrentPrice: 0,
      oracleId: json.oracle_id,
    }
  }

  const latestLiveTrade = buildLatestTrade()
  const canCopyLatest = isLive ? !!latestLiveTrade : mockTrades.length > 0

  function handleCopyLatest() {
    if (isLive && latestLiveTrade) {
      setCopyTrade(latestLiveTrade)
      setCopyOpen(true)
    } else if (mockTrades.length > 0) {
      setCopyTrade(mockTrades[0])
      setCopyOpen(true)
    }
  }

  const stats = [
    { icon: Trophy, label: 'Win Rate', value: `${winRate}%`, color: winRate >= 70 ? 'text-emerald-400' : 'text-foreground' },
    { icon: Copy, label: 'Total Trades', value: totalTrades.toString(), color: 'text-foreground' },
    { icon: Users, label: 'Followers', value: followerCount.toLocaleString(), color: 'text-foreground' },
    { icon: Flame, label: 'Streak', value: `${currentStreak}🔥`, color: 'text-orange-400' },
    { icon: Trophy, label: 'Best Streak', value: `${bestStreak}🔥`, color: 'text-orange-400' },
    { icon: DollarSign, label: 'Copy Earnings', value: `$${copyEarnings.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, color: 'text-indigo-400' },
  ]

  const tabs = [
    { key: 'positions' as const, label: isLive ? `Copies (${predictorCopyEvents.length})` : `Active (${mockTrades.length})` },
    { key: 'history' as const, label: isLive ? `Settled (${predictorSettledEvents.length})` : `History (${mockPredictor?.recentTrades.length ?? 0})` },
    { key: 'followers' as const, label: `Followers (${followerCount})` },
  ]

  // Unknown address with no data anywhere
  const isUnknown = !onChainProfile && !mockPredictor && !isLoading

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Back */}
        <Link href="/leaderboard" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back to Leaderboard
        </Link>

        {/* Loading */}
        {isLoading && !onChainProfile && !mockPredictor && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Looking up on-chain profile…
          </div>
        )}

        {/* Unknown address */}
        {isUnknown && (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <Users className="size-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-semibold font-heading mb-2">No predictor profile found</p>
            <p className="text-sm text-muted-foreground mb-6">
              <code className="font-mono text-xs">{shortAddr(address)}</code> hasn't created an Echo profile yet.
            </p>
            {isOwnProfile && (
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-500"
                onClick={() => setCreateProfileOpen(true)}
              >
                Create My Profile
              </Button>
            )}
          </div>
        )}

        {/* Profile found (live or mock) */}
        {(onChainProfile || mockPredictor) && (
          <>
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
                    <AvatarFallback className={`text-xl font-bold ${avatarColor}`}>{avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold font-heading">{displayName}</h1>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          <Activity className="size-2.5" /> on-chain
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <a
                        href={`https://suiscan.xyz/testnet/account/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-mono text-xs hover:text-indigo-400 transition-colors"
                      >
                        {shortAddr(address)}
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">Joined {joinedLabel}</Badge>
                      {currentStreak >= 5 && <Badge variant="pending">{currentStreak}🔥 Active Streak</Badge>}
                      {winRate >= 70 && <Badge variant="bull">Top Predictor</Badge>}
                      {isLive && onChainProfile && (
                        <a
                          href={`https://suiscan.xyz/testnet/object/${onChainProfile.id.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          <ExternalLink className="size-2.5" />
                          View profile object
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canCopyLatest && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
                      onClick={handleCopyLatest}
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

            {/* — Active Positions / Live Copies — */}
            {tab === 'positions' && (
              <motion.div key="positions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {isLive ? (
                  predictorCopyEvents.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card py-16 text-center">
                      <p className="text-muted-foreground text-sm">No copies recorded for this predictor yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center gap-2 text-xs text-emerald-400">
                        <Activity className="size-3.5" />
                        {predictorCopyEvents.length} copy trade{predictorCopyEvents.length !== 1 ? 's' : ''} placed on this predictor's signals
                      </div>
                      <div className="space-y-3">
                        {predictorCopyEvents.map((event, i) => {
                          const json = event.parsedJson as CopyCreatedJson
                          const expiryMs = Number(json.expiry_ms)
                          const expiryLabel = formatExpiry(expiryMs)
                          const expired = expiryMs < Date.now()
                          return (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
                              <div>
                                <div className={`flex items-center gap-2 font-semibold ${json.is_up ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {json.is_up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                                  BTC {json.is_up ? 'UP' : 'DOWN'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                  <span>Follower: <code className="font-mono">{shortAddr(json.follower)}</code></span>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="size-3" />
                                    {expired ? 'Expired' : expiryLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatDusd(json.amount_dusd)} dUSDC</div>
                                <Badge variant={expired ? 'outline' : 'pending'} className="mt-1">
                                  {expired ? 'EXPIRED' : 'LIVE'}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                ) : (
                  // Mock fallback
                  mockTrades.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {mockTrades.map((trade, i) => (
                        <TradeCard key={trade.id} trade={trade} index={i} onCopy={(t) => { setCopyTrade(t); setCopyOpen(true) }} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-card py-16 text-center">
                      <p className="text-muted-foreground">No active positions right now.</p>
                    </div>
                  )
                )}
              </motion.div>
            )}

            {/* — History / Settled — */}
            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {isLive ? (
                  predictorSettledEvents.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card py-16 text-center">
                      <p className="text-muted-foreground text-sm">No settled trades yet.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Follower</th>
                            <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">Gross Payout</th>
                            <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">Your Cut (15%)</th>
                            <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictorSettledEvents.map((event, i) => {
                            const json = event.parsedJson as CopySettledJson
                            return (
                              <tr key={i} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                                <td className="px-5 py-4">
                                  <code className="font-mono text-xs text-muted-foreground">{shortAddr(json.follower)}</code>
                                </td>
                                <td className="px-4 py-4 text-right text-muted-foreground">
                                  {formatDusd(json.gross_payout_dusd)} dUSDC
                                </td>
                                <td className="px-4 py-4 text-right font-semibold text-indigo-400">
                                  +{formatDusd(json.predictor_cut_dusd)} dUSDC
                                </td>
                                <td className="px-5 py-4 text-right">
                                  {json.won ? (
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
                      <div className="border-t border-border px-5 py-3 flex justify-between items-center text-xs text-muted-foreground">
                        <span>{predictorSettledEvents.filter(e => (e.parsedJson as CopySettledJson).won).length} wins · {predictorSettledEvents.filter(e => !(e.parsedJson as CopySettledJson).won).length} losses</span>
                        <span className="text-indigo-400 font-medium">
                          Total earned: {formatDusd(
                            predictorSettledEvents.reduce((s, e) => s + Number((e.parsedJson as CopySettledJson).predictor_cut_dusd), 0)
                          )} dUSDC
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  // Mock fallback
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
                        {(mockPredictor?.recentTrades ?? []).map(trade => {
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
                              <td className="px-4 py-4 text-right text-muted-foreground">${(trade.positionSizeCents / 100).toFixed(0)} dUSDC</td>
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
                )}
              </motion.div>
            )}

            {/* — Followers — */}
            {tab === 'followers' && (
              <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {isLive && predictorCopyEvents.length > 0 ? (
                  // Real followers from CopyCreated events
                  (() => {
                    const uniqueFollowers = Array.from(
                      new Map(predictorCopyEvents.map(e => {
                        const json = e.parsedJson as CopyCreatedJson
                        return [json.follower, json]
                      })).values()
                    )
                    return (
                      <div className="rounded-2xl border border-border bg-card p-6">
                        <p className="text-xs text-muted-foreground mb-4">
                          {uniqueFollowers.length} unique wallet{uniqueFollowers.length !== 1 ? 's' : ''} have copied this predictor
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {uniqueFollowers.map((json, i) => {
                            const colors = ['bg-indigo-500/20 text-indigo-400', 'bg-emerald-500/20 text-emerald-400', 'bg-amber-500/20 text-amber-400', 'bg-pink-500/20 text-pink-400']
                            return (
                              <div key={json.follower} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                                <Avatar className="size-8">
                                  <AvatarFallback className={`text-xs ${colors[i % colors.length]}`}>
                                    {json.follower.slice(2, 4).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <code className="text-xs font-mono text-muted-foreground truncate">
                                  {shortAddr(json.follower)}
                                </code>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  // Mock followers
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: Math.min(followerCount, 16) }).map((_, i) => {
                        const colors = ['bg-indigo-500/20 text-indigo-400', 'bg-emerald-500/20 text-emerald-400', 'bg-amber-500/20 text-amber-400', 'bg-pink-500/20 text-pink-400', 'bg-violet-500/20 text-violet-400']
                        const hex = ['1a', '4f', 'b2', '7e', 'c3', '8d', '2f', '5a', '91', '3c', '6b', 'e7', '04', '9f', 'd1', '58']
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                            <Avatar className="size-8">
                              <AvatarFallback className={`text-xs ${colors[i % colors.length]}`}>
                                0x{hex[i]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs font-mono text-muted-foreground">0x{hex[i]}…{(i * 7 + 3).toString(16).padStart(4, '0')}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {followerCount > 16 && (
                      <p className="mt-4 text-center text-sm text-muted-foreground">+{followerCount - 16} more followers</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </main>

      <CopyModal trade={copyTrade} open={copyOpen} onOpenChange={setCopyOpen} />
      <CreateProfileModal
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
      />
    </>
  )
}
