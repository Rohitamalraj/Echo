'use client'

import { TrendingUp, TrendingDown, ArrowLeftRight, Lock, Users, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type ActiveTrade, getPredictorByAddress } from '@/lib/mock-data'

interface TradeCardProps {
  trade: ActiveTrade
  index?: number
  onCopy: (trade: ActiveTrade) => void
}

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const directionBadge = { UP: 'bull', DOWN: 'bear', RANGE: 'range' } as const
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC RANGE' }
const directionColor = {
  UP: 'text-emerald-400',
  DOWN: 'text-red-400',
  RANGE: 'text-indigo-400',
}
const probBarColor = {
  UP: 'bg-emerald-500',
  DOWN: 'bg-red-500',
  RANGE: 'bg-indigo-500',
}

function formatExpiry(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes} min`
}

function formatAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export function TradeCard({ trade, index = 0, onCopy }: TradeCardProps) {
  const predictor = getPredictorByAddress(trade.predictorAddress)
  if (!predictor) return null

  const Icon = directionIcon[trade.direction]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.06 }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className={predictor.avatarColor}>{predictor.initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm leading-none">{predictor.displayName}</span>
              {predictor.streak >= 5 && (
                <span className="text-xs">{predictor.streak}🔥</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{predictor.winRate}%</span>
              <span>win rate</span>
              <span>·</span>
              <span>{predictor.totalTrades} trades</span>
            </div>
          </div>
        </div>
        <Badge variant={directionBadge[trade.direction]}>
          <Icon className="size-3" />
          {trade.direction}
        </Badge>
      </div>

      {/* Trade details */}
      <div className="mb-4">
        <div className={`text-2xl font-extrabold font-heading leading-none ${directionColor[trade.direction]}`}>
          {directionLabel[trade.direction]}
        </div>
        <div className="mt-0.5 text-2xl font-extrabold font-heading leading-none">
          ${trade.strike.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5" />
          Expires in {formatExpiry(trade.expiryMinutes)}
          <span className="ml-1 text-xs">
            (BTC now ${trade.btcCurrentPrice.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Probability */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Implied probability</span>
          <span className="font-semibold">{trade.impliedProb}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${probBarColor[trade.direction]}`}
            style={{ width: `${trade.impliedProb}%` }}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-4 min-h-[3rem] flex-1">
        {trade.isPremium ? (
          <div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 text-sm">
            <Lock className="size-3.5 shrink-0 text-purple-400" />
            <span className="text-purple-400 font-medium">Premium signal</span>
            <span className="text-muted-foreground">— unlock for {(trade.signalFeeCents / 100).toFixed(2)} dUSDC</span>
          </div>
        ) : trade.reasoning ? (
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            "{trade.reasoning}"
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">No reasoning shared</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {trade.copies} copying
          </span>
          <span>·</span>
          <span>{formatAgo(trade.postedMinutesAgo)}</span>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 text-white hover:bg-indigo-500"
          onClick={() => onCopy(trade)}
        >
          Copy Trade
        </Button>
      </div>
    </motion.div>
  )
}
