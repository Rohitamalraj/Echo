'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, ArrowLeftRight, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type ActiveTrade, getPredictorByAddress } from '@/lib/mock-data'

interface CopyModalProps {
  trade: ActiveTrade | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const directionIcon = { UP: TrendingUp, DOWN: TrendingDown, RANGE: ArrowLeftRight }
const directionBadge = { UP: 'bull', DOWN: 'bear', RANGE: 'range' } as const
const directionLabel = { UP: 'BTC ABOVE', DOWN: 'BTC BELOW', RANGE: 'BTC IN RANGE' }
const directionColor = { UP: 'text-emerald-400', DOWN: 'text-red-400', RANGE: 'text-indigo-400' }

export function CopyModal({ trade, open, onOpenChange }: CopyModalProps) {
  const [amount, setAmount] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (!open || !trade) return null

  const predictor = getPredictorByAddress(trade.predictorAddress)
  if (!predictor) return null

  const Icon = directionIcon[trade.direction]
  const amountNum = parseFloat(amount) || 0
  const potentialPayout = amountNum * (trade.impliedProb > 50 ? 1.7 : 2.1)
  const yourCut = potentialPayout * 0.85
  const predictorCut = potentialPayout * 0.15

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => {
      setConfirmed(false)
      setAmount('')
      onOpenChange(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {confirmed ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Zap className="size-8 text-emerald-400" />
            </div>
            <p className="text-center text-lg font-semibold font-heading">Copy Trade Submitted!</p>
            <p className="text-center text-sm text-muted-foreground">Your position is live on Sui testnet.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-lg font-semibold font-heading">Copy Trade</h2>
                <p className="text-sm text-muted-foreground">Mirror {predictor.displayName}'s position</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Predictor + trade summary */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className={predictor.avatarColor}>{predictor.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{predictor.displayName}</p>
                    <p className="text-xs text-muted-foreground">{predictor.winRate}% win • {predictor.streak}🔥 streak</p>
                  </div>
                </div>
                <Badge variant={directionBadge[trade.direction]}>
                  <Icon className="size-3" />
                  {trade.direction}
                </Badge>
              </div>

              {/* Trade details */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prediction</span>
                  <span className={`font-semibold ${directionColor[trade.direction]}`}>
                    {directionLabel[trade.direction]} ${trade.strike.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expires in</span>
                  <span className="font-medium">
                    {trade.expiryMinutes >= 60
                      ? `${Math.floor(trade.expiryMinutes / 60)}h ${trade.expiryMinutes % 60}m`
                      : `${trade.expiryMinutes} min`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Implied probability</span>
                  <span className="font-medium">{trade.impliedProb}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${trade.impliedProb}%` }}
                  />
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="mb-2 block text-sm font-medium">Your copy amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 pr-20 text-lg font-semibold outline-none placeholder:text-muted-foreground/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">dUSDC</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {[10, 25, 50, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="flex-1 rounded-lg border border-border bg-muted/30 py-1.5 text-xs font-medium text-muted-foreground hover:border-indigo-500/50 hover:text-foreground transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout breakdown */}
              {amountNum > 0 && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                  <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide">If this wins</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross payout (~{trade.impliedProb}% odds)</span>
                    <span className="font-medium">{potentialPayout.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your 85% cut</span>
                    <span className="font-semibold text-emerald-400">+{yourCut.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Predictor 15% cut</span>
                    <span className="text-muted-foreground">{predictorCut.toFixed(2)} dUSDC</span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3" />
                    Split enforced by Move smart contract. No admin key.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6">
              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                size="lg"
                disabled={!amountNum || amountNum <= 0}
                onClick={handleConfirm}
              >
                Confirm Copy Trade
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Transaction will be signed with your Sui wallet
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
