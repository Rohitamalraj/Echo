'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, ArrowLeftRight, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { fetchActiveOracles, formatStrike, formatExpiry, type OracleState } from '@/lib/predict-api'
import { buildPostTradeTx } from '@/lib/sui-client'
import { parseDusd } from '@/lib/constants'
import { suiClient } from '@/lib/sui-client'
import { DUSDC_TYPE } from '@/lib/constants'

interface PostTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostTradeModal({ open, onOpenChange }: PostTradeModalProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP')
  const [oracles, setOracles] = useState<OracleState[]>([])
  const [selectedOracleIdx, setSelectedOracleIdx] = useState(0)
  const [amount, setAmount] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [signalFee, setSignalFee] = useState('0.5')
  const [status, setStatus] = useState<'idle' | 'loading-markets' | 'posting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [txDigest, setTxDigest] = useState('')

  useEffect(() => {
    if (!open) return
    setStatus('loading-markets')
    fetchActiveOracles()
      .then(o => {
        // Show first 4 soonest-expiring oracles
        const sorted = [...o].sort((a, b) => a.expiry - b.expiry).slice(0, 4)
        setOracles(sorted)
        setStatus('idle')
      })
      .catch(() => {
        setStatus('idle')
      })
  }, [open])

  if (!open) return null

  const oracle = oracles[selectedOracleIdx]
  const canPost = parseFloat(amount) > 0 && !!oracle && !!account

  async function handlePost() {
    if (!canPost || !account || !oracle) return
    setStatus('posting')
    setErrorMsg('')

    try {
      // Find user's dUSDC coins
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: DUSDC_TYPE,
      })

      if (!coins.data.length) {
        setErrorMsg('No dUSDC in wallet. Request testnet tokens first.')
        setStatus('error')
        return
      }

      // Find user's PredictManager
      const managers = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::predict_manager::PredictManager`,
        },
      })

      if (!managers.data.length) {
        setErrorMsg('No PredictManager found. Please create one first via the Predict protocol.')
        setStatus('error')
        return
      }

      const amountRaw = parseDusd(amount)
      const tx = buildPostTradeTx({
        oracleId: oracle.oracle_id,
        strike: BigInt(oracle.min_strike),
        isUp: direction === 'UP',
        expiryMs: BigInt(oracle.expiry),
        quantity: amountRaw,
        managerObjectId: managers.data[0].data!.objectId,
        dusdCoinObjectId: coins.data[0].coinObjectId,
      })

      const result = await signAndExecute({ transaction: tx })
      setTxDigest(result.digest)
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        setAmount('')
        setReasoning('')
        onOpenChange(false)
      }, 3000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg.slice(0, 120))
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-indigo-500/20">
              <CheckCircle className="size-8 text-indigo-400" />
            </div>
            <p className="text-lg font-semibold font-heading">Trade Posted On-Chain!</p>
            <p className="text-sm text-muted-foreground text-center">Your call is live. Followers can now copy it.</p>
            {txDigest && (
              <a
                href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 underline"
              >
                View on Suiscan ↗
              </a>
            )}
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
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { d: 'UP' as const, Icon: TrendingUp, label: 'BTC UP', cls: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
                    { d: 'DOWN' as const, Icon: TrendingDown, label: 'BTC DOWN', cls: 'border-red-500/50 bg-red-500/10 text-red-400' },
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

              {/* Market / Expiry — live from Predict Server */}
              <div>
                <label className="mb-2 block text-sm font-medium">Market & Expiry</label>
                {status === 'loading-markets' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="size-4 animate-spin" /> Loading live markets…
                  </div>
                ) : oracles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active markets found</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {oracles.map((o, i) => (
                      <button
                        key={o.oracle_id}
                        onClick={() => setSelectedOracleIdx(i)}
                        className={`rounded-xl border p-3 text-left text-xs transition-all ${
                          selectedOracleIdx === i
                            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                            : 'border-border text-muted-foreground hover:border-border/80'
                        }`}
                      >
                        <div className="font-semibold">{formatExpiry(o.expiry)}</div>
                        <div className="text-muted-foreground mt-0.5">Strike {formatStrike(o.min_strike)}</div>
                      </button>
                    ))}
                  </div>
                )}
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
                  Reasoning <span className="text-muted-foreground font-normal">(optional)</span>
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
                      <p className="text-xs text-muted-foreground">Encrypt reasoning via Seal — followers pay to unlock</p>
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

              {/* Wallet required notice */}
              {!account && (
                <p className="text-sm text-amber-400 text-center">
                  Connect wallet to post a trade
                </p>
              )}

              {status === 'error' && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {errorMsg || 'Transaction failed. Please try again.'}
                </p>
              )}
            </div>

            <div className="border-t border-border p-6">
              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                size="lg"
                disabled={!canPost || status === 'posting'}
                onClick={handlePost}
              >
                {status === 'posting' ? (
                  <><Loader2 className="size-4 animate-spin mr-2" /> Signing transaction…</>
                ) : (
                  'Post & Trade'
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Earns 15% of follower winnings at settlement · No admin key
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
