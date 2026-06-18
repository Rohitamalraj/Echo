'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, BarChart2, Briefcase, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { PostTradeModal } from '@/components/post-trade-modal'

const navLinks = [
  { href: '/', label: 'Feed', icon: Zap },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
]

export function Navbar() {
  const pathname = usePathname()
  const [postOpen, setPostOpen] = useState(false)

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
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 sm:flex"
              onClick={() => setPostOpen(true)}
            >
              <Plus className="size-4" />
              Post Trade
            </Button>
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500">
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          </div>
        </div>
      </nav>

      <PostTradeModal open={postOpen} onOpenChange={setPostOpen} />
    </>
  )
}
