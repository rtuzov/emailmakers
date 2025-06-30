'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/shared/utils/cn'
import { GlassNavigation, NavItem } from '../glass/glass-navigation'
import { GlassButton } from '../glass/glass-button'

export interface LandingLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showNavigation?: boolean
  navigationVariant?: 'floating' | 'primary'
}

const LandingLayout: React.FC<LandingLayoutProps> = ({
  children,
  header,
  footer,
  className,
  showNavigation = true,
  navigationVariant = 'floating',
}) => {
  // Navigation items for landing page
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', active: true },
    { label: 'Features', href: '#features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ]

  // Logo component
  const logo = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-kupibilet-gradient rounded-xl flex items-center justify-center">
        <span className="text-white font-bold text-xl">E</span>
      </div>
      <div className="flex flex-col">
        <span className="text-white font-semibold text-xl font-primary">Email-Makers</span>
        <span className="text-kupibilet-primary text-xs font-medium">AI Email Platform</span>
      </div>
    </div>
  )

  // Action buttons
  const actions = (
    <div className="flex items-center gap-4">
      <Link href="/login">
        <GlassButton variant="ghost" size="md">
          Sign In
        </GlassButton>
      </Link>
      <Link href="/register">
        <GlassButton variant="primary" size="md" glow>
          Get Started
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </GlassButton>
      </Link>
    </div>
  )

  // Default header
  const defaultHeader = (
    <GlassNavigation
      items={navItems}
      orientation="horizontal"
      variant={navigationVariant}
      logo={logo}
      actions={actions}
      size="md"
    />
  )

  // Default footer
  const defaultFooter = (
    <footer className="glass-nav mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-kupibilet-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-white font-semibold text-lg font-primary">Email-Makers</span>
            </div>
            <p className="text-white/70 text-sm mb-6 max-w-md">
              Create stunning, professional email templates with AI-powered content generation and design automation. 
              Perfect for marketers, agencies, and businesses of all sizes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="glass-button p-2 text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="glass-button p-2 text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="glass-button p-2 text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="glass-button p-2 text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.985 1.219-5.985s-.219-.438-.219-1.085c0-1.016.542-1.775 1.219-1.775.594 0 .854.438.854 1.052 0 .657-.438 1.594-.657 2.474-.219.876.438 1.594 1.314 1.594 1.594 0 2.66-2.474 2.66-5.985 0-2.474-1.656-4.319-4.319-4.319-3.158 0-5.133 2.256-5.133 4.758 0 .876.219 1.514.531 2.037.061.073.073.146.053.219-.061.219-.188.657-.219.876-.041.146-.146.188-.292.114-1.031-.438-1.531-1.594-1.531-2.913 0-3.096 2.183-6.916 6.476-6.916 3.439 0 5.798 2.547 5.798 5.281 0 3.61-2.183 6.291-5.281 6.291-1.052 0-2.037-.562-2.329-1.199 0 0-.531 2.037-.657 2.474-.188.657-.531 1.199-.876 1.656.876.292 1.775.438 2.769.438 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">Features</a></li>
              <li><a href="/templates" className="text-white/70 hover:text-white text-sm transition-colors">Templates</a></li>
              <li><a href="#integrations" className="text-white/70 hover:text-white text-sm transition-colors">Integrations</a></li>
              <li><a href="#api" className="text-white/70 hover:text-white text-sm transition-colors">API</a></li>
              <li><a href="#pricing" className="text-white/70 hover:text-white text-sm transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#help" className="text-white/70 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="#docs" className="text-white/70 hover:text-white text-sm transition-colors">Documentation</a></li>
              <li><a href="#contact" className="text-white/70 hover:text-white text-sm transition-colors">Contact Us</a></li>
              <li><a href="#status" className="text-white/70 hover:text-white text-sm transition-colors">System Status</a></li>
              <li><a href="#community" className="text-white/70 hover:text-white text-sm transition-colors">Community</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm">
            © 2024 Email-Makers. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-white/60 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#cookies" className="text-white/60 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )

  return (
    <div className="min-h-screen bg-kupibilet-hero">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-animated-gradient opacity-30 pointer-events-none" />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-kupibilet-primary/30 rounded-full floating" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-kupibilet-accent/20 rounded-full floating-delayed" />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-kupibilet-secondary/25 rounded-full floating" />
        <div className="absolute bottom-20 right-10 w-2.5 h-2.5 bg-kupibilet-primary/20 rounded-full floating-delayed" />
      </div>
      
      <div className="relative">
        {/* Header */}
        {showNavigation && (
          <header className="relative z-50">
            {header || defaultHeader}
          </header>
        )}

        {/* Main Content */}
        <main className={cn('relative z-10', className)}>
          {children}
        </main>

        {/* Footer */}
        {footer !== null && (footer || defaultFooter)}
      </div>
    </div>
  )
}

LandingLayout.displayName = 'LandingLayout'

export { LandingLayout }
 