'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'default' | 'modal'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  hover?: boolean
  interactive?: boolean
  children: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    variant = 'default', 
    blur = 'md', 
    glow = false, 
    hover = false,
    interactive = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-xl border transition-all duration-300 ease-in-out'
    
    const variantClasses = {
      default: 'glass-card',
      primary: 'glass-primary',
      secondary: 'glass-secondary', 
      accent: 'glass-accent',
      modal: 'glass-modal',
    }

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    const glowClasses = glow ? {
      default: 'glow-green',
      primary: 'glow-green',
      secondary: 'glow-purple',
      accent: 'glow-orange',
      modal: 'glow-green',
    } : {}

    const hoverClasses = hover ? 'glass-hover' : ''
    const interactiveClasses = interactive ? 'interactive cursor-pointer' : ''

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          blurClasses[blur],
          glow && glowClasses[variant],
          hoverClasses,
          interactiveClasses,
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