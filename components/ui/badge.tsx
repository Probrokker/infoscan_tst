/**
 * Badge — небольшая пилюля для пометок (статусы, аудитория, теги).
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary: 'border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        outline: 'border-[var(--border)] bg-transparent text-[var(--foreground)]',
        success: 'border-transparent bg-[var(--color-success)] text-white',
        warning: 'border-transparent bg-[var(--color-warning)] text-white',
        error: 'border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
