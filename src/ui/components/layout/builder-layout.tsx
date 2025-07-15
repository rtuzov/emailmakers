'use client'

import React, { ReactNode } from 'react'
import { GlassNavigation } from '@/ui/components/glass/glass-navigation'
import { GlassCard } from '@/ui/components/glass/glass-card'
import { GlassButton } from '@/ui/components/glass/glass-button'

export interface BuilderLayoutProps {
  children: ReactNode
  leftPanel?: ReactNode
  rightPanel?: ReactNode
}

export function BuilderLayout({ children, leftPanel, rightPanel }: BuilderLayoutProps) {
  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
        </svg>
      )
    },
    { 
      label: 'Templates', 
      href: '/templates',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      label: 'Create', 
      href: '/create',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      active: true
    }
  ]

  const _userActions = [
    {
      label: 'Save Template',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      variant: 'primary' as const
    },
    {
      label: 'Preview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      variant: 'outline' as const
    }
  ]

  const DefaultLeftPanel = () => (
    <GlassCard className="h-full p-6">
      <div className="space-y-6">
        {/* AI Assistant Header */}
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
          <p className="text-sm text-white/70">Get smart suggestions as you build</p>
        </div>

        {/* AI Suggestions */}
        <div className="space-y-4">
          <div className="glass-primary p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-kupibilet-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-kupibilet-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">Content Optimization</h4>
                <p className="text-sm text-white/80 mb-3">Your subject line could be more engaging. Try adding urgency or personalization.</p>
                <GlassButton size="sm" variant="outline">Apply Suggestion</GlassButton>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-kupibilet-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-kupibilet-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">Design Enhancement</h4>
                <p className="text-sm text-white/80 mb-3">Consider adding more visual hierarchy with different font sizes.</p>
                <GlassButton size="sm" variant="outline">View Options</GlassButton>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Quick Actions</h4>
          <div className="space-y-2">
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Images
            </GlassButton>
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0v18l-9-5-9 5V4h9z" />
              </svg>
              Save as Template
            </GlassButton>
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Duplicate
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  )

  const DefaultRightPanel = () => (
    <GlassCard className="h-full p-6">
      <div className="space-y-6">
        {/* Properties Header */}
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Properties</h3>
          <p className="text-sm text-white/70">Customize your email template</p>
        </div>

        {/* Template Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Email Width</label>
            <select className="w-full glass-card p-3 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-lg">
              <option value="600">600px (Standard)</option>
              <option value="640">640px (Wide)</option>
              <option value="100%">100% (Responsive)</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Background Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value="#2C3959" 
                className="w-12 h-10 glass-card rounded-lg border-none cursor-pointer"
              />
              <input 
                type="text" 
                value="#2C3959" 
                className="flex-1 glass-card p-3 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Text Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value="#FFFFFF" 
                className="w-12 h-10 glass-card rounded-lg border-none cursor-pointer"
              />
              <input 
                type="text" 
                value="#FFFFFF" 
                className="flex-1 glass-card p-3 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-kupibilet-primary/50 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Brand Colors</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="w-full h-10 bg-kupibilet-primary rounded-lg cursor-pointer border-2 border-white/20"></div>
            <div className="w-full h-10 bg-kupibilet-accent rounded-lg cursor-pointer border-2 border-transparent"></div>
            <div className="w-full h-10 bg-kupibilet-secondary rounded-lg cursor-pointer border-2 border-transparent"></div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Export Options</h4>
          <div className="space-y-2">
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download HTML
            </GlassButton>
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export MJML
            </GlassButton>
            <GlassButton variant="outline" size="sm" className="w-full justify-start">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Save to Cloud
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  )

  return (
    <div className="min-h-screen bg-kupibilet-background">
      {/* Navigation */}
      <GlassNavigation 
        logo="Email-Makers"
        items={navItems}
        orientation="horizontal"
      />

      {/* Builder Layout - 3 Columns */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - AI Assistant */}
        <div className="w-80 border-r border-white/10 p-4">
          {leftPanel || <DefaultLeftPanel />}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-4">
          {children}
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 border-l border-white/10 p-4">
          {rightPanel || <DefaultRightPanel />}
        </div>
      </div>
    </div>
  )
} 