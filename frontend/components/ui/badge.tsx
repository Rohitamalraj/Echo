import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground border-border',
        bull: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        bear: 'border-red-500/30 bg-red-500/10 text-red-400',
        range: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
        premium: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        win: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        loss: 'border-red-500/30 bg-red-500/10 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
