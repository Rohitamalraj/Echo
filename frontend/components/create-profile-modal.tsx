'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, User, CheckCircle, X } from 'lucide-react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { buildCreateProfileTx } from '@/lib/sui-client'

interface CreateProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProfileModal({ open, onOpenChange, onSuccess }: CreateProfileModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  function reset() {
    setStatus('idle')
    setDisplayName('')
    setTxDigest(null)
    setErrorMsg(null)
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  async function handleCreate() {
    if (!displayName.trim()) return
    setStatus('pending')
    setErrorMsg(null)
    try {
      const tx = buildCreateProfileTx(displayName.trim())
      signAndExecute(
        { transaction: tx },
        {
          onSuccess(result) {
            setTxDigest(result.digest)
            setStatus('success')
          },
          onError(err) {
            setErrorMsg(err.message ?? 'Transaction failed')
            setStatus('error')
          },
        }
      )
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl mx-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        <h2 className="font-heading text-xl font-bold mb-1">Create Your Predictor Profile</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your on-chain profile stores your win rate, streak, and copy earnings — verifiable by anyone.
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <CheckCircle className="size-12 text-emerald-400" />
            <div>
              <div className="font-semibold mb-1">Profile created!</div>
              <p className="text-sm text-muted-foreground">Your on-chain predictor profile is live.</p>
            </div>
            {txDigest && (
              <a
                href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                View on Suiscan →
              </a>
            )}
            <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500 mt-2"
              onClick={() => {
                handleClose()
                onSuccess?.()
              }}
            >
              Post a Trade
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                  placeholder="e.g. BTC Wizard"
                  className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  maxLength={32}
                  disabled={status === 'pending'}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <p className="text-xs text-muted-foreground">Stored permanently on Sui. Choose wisely.</p>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
              disabled={!displayName.trim() || status === 'pending'}
              onClick={handleCreate}
            >
              {status === 'pending' ? (
                <><Loader2 className="size-4 animate-spin mr-2" />Creating profile…</>
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
