'use client'

import React from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(20, 28, 40)' }}>
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: 'rgba(20, 28, 40, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Email<span style={{ color: 'rgb(29, 168, 87)' }}>Makers</span>
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-4">
              <a href="/" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-80">
                Dashboard
              </a>
              <a href="/templates" className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:opacity-80">
                Templates
              </a>
              <a href="/create" className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:opacity-80">
                Create
              </a>
            </div>

            {/* Account Button */}
            <div className="flex items-center">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white border" style={{ backgroundColor: 'rgba(29, 168, 87, 0.2)', borderColor: 'rgba(29, 168, 87, 0.5)' }}>
                Account
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
} 