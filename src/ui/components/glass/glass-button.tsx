'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 ease-in-out backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 focus:ring-primary/50 shadow-glass hover:shadow-glow-primary',
      secondary: 'bg-background-light/20 border-background-light/30 text-white hover:bg-background-light/30 hover:border-background-light/50 focus:ring-background-light/50 shadow-glass',
      accent: 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/30 hover:border-accent/50 focus:ring-accent/50 shadow-glass hover:shadow-glow-accent animate-glow-pulse',
      ghost: 'bg-white/5 border-white/10 text-white hover:bg-accent/10 hover:border-accent/20 focus:ring-accent/50 shadow-glass-sm hover:shadow-glow-accent',
      outline: 'bg-transparent border-glass-border text-white hover:bg-glass-accent hover:border-accent/50 focus:ring-accent/50 shadow-glass-sm hover:shadow-glow-accent',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-3',
    }

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          'hover:scale-105 active:scale-95',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', iconSizeClasses[size])} />
        ) : (
          <>
            {leftIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

GlassButton.displayName = 'GlassButton'

export { GlassButton } 