'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface NavItem {
  label: string
  href?: string
  icon?: React.ReactNode
  badge?: string | number
  active?: boolean
  onClick?: () => void
  children?: NavItem[]
}

export interface GlassNavigationProps {
  items: NavItem[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'primary' | 'sidebar' | 'floating'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  logo?: React.ReactNode
  actions?: React.ReactNode
}

const GlassNavigation: React.FC<GlassNavigationProps> = ({
  items,
  orientation = 'horizontal',
  variant = 'primary',
  size = 'md',
  className,
  logo,
  actions,
}) => {
  const baseClasses = orientation === 'horizontal' 
    ? 'glass-nav flex items-center justify-between w-full' 
    : 'glass-nav flex flex-col w-64 h-full'

  const variantClasses = {
    primary: 'sticky top-0 z-40',
    sidebar: 'h-screen border-r border-white/10',
    floating: 'fixed top-4 left-4 right-4 z-50 rounded-xl',
  }

  const sizeClasses = {
    sm: orientation === 'horizontal' ? 'px-4 py-2' : 'p-3',
    md: orientation === 'horizontal' ? 'px-6 py-3' : 'p-4',
    lg: orientation === 'horizontal' ? 'px-8 py-4' : 'p-6',
  }

  const renderNavItem = (item: NavItem, index: number) => {
    const itemClasses = cn(
      'glass-button flex items-center gap-3 transition-all duration-200',
      orientation === 'horizontal' ? 'px-4 py-2' : 'w-full px-4 py-3 justify-start',
      item.active 
        ? 'glow-green bg-kupibilet-primary/20 text-kupibilet-primary border-kupibilet-primary/30'
        : 'text-white/80 hover:text-white hover:bg-white/10',
      size === 'sm' && 'text-sm',
      size === 'lg' && 'text-lg'
    )

    const content = (
      <>
        {item.icon && (
          <span className="flex-shrink-0 w-5 h-5">
            {item.icon}
          </span>
        )}
        <span className={orientation === 'horizontal' && size === 'sm' ? 'hidden sm:inline' : ''}>
          {item.label}
        </span>
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-kupibilet-accent/20 text-kupibilet-accent rounded-full border border-kupibilet-accent/30">
            {item.badge}
          </span>
        )}
      </>
    )

    if (item.href) {
      return (
        <a
          key={`${item.label}-${index}`}
          href={item.href}
          className={itemClasses}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        key={`${item.label}-${index}`}
        onClick={item.onClick}
        className={itemClasses}
      >
        {content}
      </button>
    )
  }

  return (
    <nav
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {orientation === 'horizontal' ? (
        <>
          {/* Left side - Logo + Nav Items */}
          <div className="flex items-center gap-8">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}
            <div className="hidden md:flex items-center gap-2">
              {items.map(renderNavItem)}
            </div>
          </div>

          {/* Right side - Actions */}
          {actions && (
            <div className="flex items-center gap-4">
              {actions}
            </div>
          )}

          {/* Mobile menu toggle (if needed) */}
          <div className="md:hidden">
            <button className="glass-button p-2 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Vertical Navigation */}
          {logo && (
            <div className="flex-shrink-0 pb-6 border-b border-white/10 mb-6">
              {logo}
            </div>
          )}
          
          <div className="flex-1 space-y-2 overflow-y-auto">
            {items.map(renderNavItem)}
          </div>

          {actions && (
            <div className="flex-shrink-0 pt-6 border-t border-white/10 mt-6">
              {actions}
            </div>
          )}
        </>
      )}
    </nav>
  )
}

GlassNavigation.displayName = 'GlassNavigation'

export { GlassNavigation }
 