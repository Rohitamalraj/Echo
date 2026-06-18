'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, BarChart2, Briefcase, Plus, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { PostTradeModal } from '@/components/post-trade-modal'
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit'

const navLinks = [
  { href: '/', label: 'Feed', icon: Zap },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
]

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function WalletMenu() {
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const [open, setOpen] = useState(false)

  if (!account) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
      >
        <div className="size-5 rounded-full bg-indigo-600 flex items-center justify-center">
          <User className="size-3 text-white" />
        </div>
        {truncate(account.address)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-xl z-50">
          <Link
            href={`/predictor/${account.address}`}
            className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors rounded-t-lg"
            onClick={() => setOpen(false)}
          >
            <User className="size-4" />
            My Profile
          </Link>
          <button
            onClick={() => { disconnect(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-accent transition-colors rounded-b-lg"
          >
            <LogOut className="size-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [postOpen, setPostOpen] = useState(false)
  const account = useCurrentAccount()

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-extrabold text-white font-heading">E</span>
            </div>
            <span className="text-xl font-extrabold font-heading tracking-tight">echo</span>
            <span className="hidden rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 sm:inline">
              testnet
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {account && (
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-1.5 sm:flex"
                onClick={() => setPostOpen(true)}
              >
                <Plus className="size-4" />
                Post Trade
              </Button>
            )}
            {account ? (
              <WalletMenu />
            ) : (
              <ConnectButton
                connectText="Connect Wallet"
                className="!bg-indigo-600 !text-white !hover:bg-indigo-500 !rounded-lg !px-3 !py-1.5 !text-sm !font-medium"
              />
            )}
          </div>
        </div>
      </nav>

      <PostTradeModal open={postOpen} onOpenChange={setPostOpen} />
    </>
  )
}
