'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, ArrowLeftRight, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const markets = [
  { label: 'BTC/USD — 30 min rolling', strike: 68500, expiryMin: 30 },
  { label: 'BTC/USD — 1 hour rolling', strike: 68500, expiryMin: 60 },
  { label: 'BTC/USD — 2 hour rolling', strike: 68500, expiryMin: 120 },
  { label: 'BTC/USD — 4 hour rolling', strike: 68500, expiryMin: 240 },
]

export function PostTradeModal({ open, onOpenChange }: PostTradeModalProps) {
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'RANGE'>('UP')
  const [marketIdx, setMarketIdx] = useState(1)
  const [amount, setAmount] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [signalFee, setSignalFee] = useState('0.5')
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const market = markets[marketIdx]

  function handlePost() {
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setAmount('')
      setReasoning('')
      onOpenChange(false)
    }, 2200)
  }

  const canPost = parseFloat(amount) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-indigo-500/20">
              <CheckCircle className="size-8 text-indigo-400" />
            </div>
            <p className="text-lg font-semibold font-heading">Trade Posted!</p>
            <p className="text-sm text-muted-foreground text-center">Your call is live in the Echo social feed.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-lg font-semibold font-heading">Post a Trade</h2>
                <p className="text-sm text-muted-foreground">Share your prediction and earn from followers</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Direction */}
              <div>
                <label className="mb-2 block text-sm font-medium">Direction</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { d: 'UP' as const, Icon: TrendingUp, label: 'BTC UP', cls: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
                    { d: 'DOWN' as const, Icon: TrendingDown, label: 'BTC DOWN', cls: 'border-red-500/50 bg-red-500/10 text-red-400' },
                    { d: 'RANGE' as const, Icon: ArrowLeftRight, label: 'RANGE', cls: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' },
                  ]).map(({ d, Icon, label, cls }) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                        direction === d ? cls : 'border-border text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <Icon className="size-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market */}
              <div>
                <label className="mb-2 block text-sm font-medium">Market & Expiry</label>
                <div className="grid grid-cols-2 gap-2">
                  {markets.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMarketIdx(i)}
                      className={`rounded-xl border p-3 text-left text-xs transition-all ${
                        marketIdx === i
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                          : 'border-border text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className="font-semibold">{m.expiryMin} min</div>
                      <div className="text-muted-foreground mt-0.5">Strike ~${m.strike.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium">Your position size</label>
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
              </div>

              {/* Reasoning */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reasoning <span className="text-muted-foreground font-normal">(optional, shown to followers)</span>
                </label>
                <textarea
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Why are you making this trade? Share your analysis..."
                  className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">{reasoning.length}/500</div>
              </div>

              {/* Premium toggle */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Seal Premium Signal</p>
                      <p className="text-xs text-muted-foreground">Encrypt reasoning — followers pay to read it</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPremium(!isPremium)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${isPremium ? 'bg-purple-600' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${isPremium ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {isPremium && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Unlock fee</span>
                    <input
                      type="number"
                      value={signalFee}
                      onChange={e => setSignalFee(e.target.value)}
                      className="w-24 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-muted-foreground">dUSDC</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border p-6">
              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                size="lg"
                disabled={!canPost}
                onClick={handlePost}
              >
                Post & Trade
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Earns 15% of follower winnings at settlement
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
