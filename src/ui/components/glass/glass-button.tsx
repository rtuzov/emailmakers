'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  glow?: boolean
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
    glow = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'glass-button inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'
    
    const variantClasses = {
      primary: 'bg-primary-200 border-primary-300 text-primary hover:bg-primary-300 hover:border-primary-400 focus:ring-primary-500',
      secondary: 'bg-secondary-200 border-secondary-300 text-secondary hover:bg-secondary-300 hover:border-secondary-400 focus:ring-secondary-500',
      accent: 'bg-accent-200 border-accent-300 text-accent hover:bg-accent-300 hover:border-accent-400 focus:ring-accent-500',
      ghost: 'bg-white/5 border-white/10 text-white hover:bg-primary-100 hover:border-primary-200 focus:ring-primary-300',
      outline: 'bg-transparent border-white/20 text-white hover:bg-primary-100 hover:border-primary-300 focus:ring-primary-300',
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

    const glowClasses = glow ? {
      primary: 'glow-green',
      secondary: 'glow-purple',
      accent: 'glow-orange',
      ghost: 'hover:glow-green',
      outline: 'hover:glow-green',
    } : {}

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glow && glowClasses[variant],
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
            <span className="relative z-10">{children}</span>
            {rightIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {rightIcon}
              </span>
            )}
          </>
        )}
        
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </button>
    )
  }
)

GlassButton.displayName = 'GlassButton'

export { GlassButton } 