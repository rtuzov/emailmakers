'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  variant?: 'primary' | 'secondary' | 'accent'
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ 
    className, 
    label,
    leftIcon,
    rightIcon,
    error,
    variant = 'primary',
    ...props 
  }, ref) => {
    const baseClasses = 'w-full px-4 py-3 bg-glass-primary border border-glass-border rounded-lg text-white placeholder-white/60 focus:bg-glass-primary focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/50 focus:outline-none backdrop-blur-md transition-all duration-300'
    
    const variantClasses = {
      primary: 'focus:border-primary/50 focus:ring-primary/50',
      secondary: 'focus:border-background-light/50 focus:ring-background-light/50',
      accent: 'focus:border-accent/50 focus:ring-accent/50',
    }

    const errorClasses = error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              baseClasses,
              variantClasses[variant],
              errorClasses,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

export { GlassInput } 