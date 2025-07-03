'use client'

import React from 'react'
import { cn } from '@/shared/utils/cn'
import { GlassNavigation, NavItem } from '../glass/glass-navigation'

export interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  className?: string
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  className,
  sidebarCollapsed = false,
  onSidebarToggle,
}) => {
  // Default navigation items
  const defaultNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      active: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      label: 'Templates',
      href: '/templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Builder',
      href: '/create',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
    },
    {
      label: 'Campaigns',
      href: '/campaigns',
      badge: '3',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  // Logo component
  const defaultLogo = (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">E</span>
      </div>
      {!sidebarCollapsed && (
        <div className="flex flex-col">
          <span className="text-white font-semibold text-lg font-primary">Email-Makers</span>
          <span className="text-white/60 text-xs">AI Email Platform</span>
        </div>
      )}
    </div>
  )

  // User actions
  const userActions = (
    <div className="flex items-center gap-3">
      {/* Notifications */}
      <button className="glass-button p-2 text-white/70 hover:text-white relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 0-5-4.03-5-4.03V5a2 2 0 012-2h4a2 2 0 012 2v9.97S13 19 9 19z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
      </button>

      {/* User Menu */}
      <div className="glass-button p-1 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <span className="text-white font-medium text-sm">U</span>
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">User Name</span>
            <span className="text-white/60 text-xs">user@email.com</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-light">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-animated-gradient opacity-30 pointer-events-none" />
      
      <div className="relative flex h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex-shrink-0 transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {sidebar || (
            <GlassNavigation
              items={defaultNavItems}
              orientation="vertical"
              variant="sidebar"
              logo={defaultLogo}
              actions={userActions}
            />
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {header && (
            <header className="flex-shrink-0">
              {header}
            </header>
          )}

          {/* Page Content */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-6',
              'scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent',
              className
            )}
          >
            {children}
          </div>
        </main>

        {/* Sidebar Toggle Button */}
        {onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="fixed top-4 left-4 z-50 glass-button p-2 text-white md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

DashboardLayout.displayName = 'DashboardLayout'

export { DashboardLayout }
 