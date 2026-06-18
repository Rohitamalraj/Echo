'use client'

import { TrendingUp, Activity, Users, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { globalStats } from '@/lib/mock-data'

export function StatsTicker() {
  const stats = [
    {
      icon: TrendingUp,
      label: 'BTC Price',
      value: `$${globalStats.btcPrice.toLocaleString()}`,
      sub: `+${globalStats.btcChange24h}% 24h`,
      subColor: 'text-emerald-400',
    },
    {
      icon: Activity,
      label: 'Volume Today',
      value: `$${(globalStats.totalVolumeToday / 1000).toFixed(1)}k dUSDC`,
      sub: 'across all markets',
      subColor: 'text-muted-foreground',
    },
    {
      icon: Copy,
      label: 'Active Positions',
      value: `${globalStats.activePositions}`,
      sub: 'open right now',
      subColor: 'text-muted-foreground',
    },
    {
      icon: Users,
      label: 'Live Predictors',
      value: `${globalStats.livePredictors}`,
      sub: 'posting today',
      subColor: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, sub, subColor }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 + i * 0.08 }}
          className="rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Icon className="size-3.5" />
            {label}
          </div>
          <div className="text-lg font-bold font-heading">{value}</div>
          <div className={`text-xs ${subColor}`}>{sub}</div>
        </motion.div>
      ))}
    </div>
  )
}
