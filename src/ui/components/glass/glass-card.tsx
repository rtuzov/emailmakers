'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'modal' | 'subtle'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  hover?: boolean
  children: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'primary', blur = 'md', glow = false, hover = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-xl border backdrop-blur transition-all duration-300 ease-in-out'
    
    const variantClasses = {
      primary: 'bg-glass-primary border-glass-border shadow-glass hover:shadow-glass-lg',
      secondary: 'bg-glass-secondary border-glass-border shadow-glass-sm hover:shadow-glass',
      modal: 'bg-glass-modal border-glass-border-dark shadow-glass-lg',
      subtle: 'bg-white/5 border-white/10 shadow-glass-sm hover:bg-white/10',
    }

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    const glowClasses = glow ? {
      primary: 'hover:shadow-glow',
      secondary: 'hover:shadow-glow-secondary',
      modal: 'hover:shadow-glow',
      subtle: 'hover:shadow-glow',
    } : {}

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          blurClasses[blur],
          glow && glowClasses[variant],
          hover && 'hover:scale-[1.02] hover:border-glass-border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard } 