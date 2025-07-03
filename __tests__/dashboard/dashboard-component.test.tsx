/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Simple dashboard component for testing
function DashboardMinimal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Templates Created</h3>
            <p className="text-3xl font-bold text-green-400">1,247</p>
            <p className="text-green-400 text-sm">+12.5% this month</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Active Campaigns</h3>
            <p className="text-3xl font-bold text-blue-400">43</p>
            <p className="text-blue-400 text-sm">+8.2% this month</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Open Rate</h3>
            <p className="text-3xl font-bold text-purple-400">24.8%</p>
            <p className="text-purple-400 text-sm">+3.1% this month</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Click Rate</h3>
            <p className="text-3xl font-bold text-orange-400">8.4%</p>
            <p className="text-orange-400 text-sm">+5.7% this month</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Recent Templates</h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Black Friday Campaign</h3>
                      <p className="text-sm text-white/60">2 hours ago</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">89%</div>
                      <div className="text-xs text-white/60">Performance</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Newsletter November</h3>
                      <p className="text-sm text-white/60">1 day ago</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">76%</div>
                      <div className="text-xs text-white/60">Performance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors rounded-lg p-3 text-left">
                  <div className="font-medium">Create New Template</div>
                  <div className="text-xs opacity-80">Start with AI assistance</div>
                </button>
                
                <button className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors rounded-lg p-3 text-left">
                  <div className="font-medium">Browse Templates</div>
                  <div className="text-xs opacity-80">Explore our library</div>
                </button>
                
                <button className="w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors rounded-lg p-3 text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-xs opacity-80">Check performance</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

describe('Dashboard Component Tests', () => {
  describe('Basic Rendering', () => {
    it('should render dashboard title', () => {
      render(<DashboardMinimal />)
      
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Dashboard')
    })

    it('should render all stat cards', () => {
      render(<DashboardMinimal />)
      
      expect(screen.getByText('Templates Created')).toBeInTheDocument()
      expect(screen.getByText('1,247')).toBeInTheDocument()
      
      expect(screen.getByText('Active Campaigns')).toBeInTheDocument()
      expect(screen.getByText('43')).toBeInTheDocument()
      
      expect(screen.getByText('Open Rate')).toBeInTheDocument()
      expect(screen.getByText('24.8%')).toBeInTheDocument()
      
      expect(screen.getByText('Click Rate')).toBeInTheDocument()
      expect(screen.getByText('8.4%')).toBeInTheDocument()
    })

    it('should render recent templates section', () => {
      render(<DashboardMinimal />)
      
      expect(screen.getByText('Recent Templates')).toBeInTheDocument()
      expect(screen.getByText('Black Friday Campaign')).toBeInTheDocument()
      expect(screen.getByText('Newsletter November')).toBeInTheDocument()
      expect(screen.getByText('89%')).toBeInTheDocument()
      expect(screen.getByText('76%')).toBeInTheDocument()
    })

    it('should render quick actions section', () => {
      render(<DashboardMinimal />)
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Create New Template')).toBeInTheDocument()
      expect(screen.getByText('Browse Templates')).toBeInTheDocument()
      expect(screen.getByText('View Analytics')).toBeInTheDocument()
    })
  })

  describe('Interactive Elements', () => {
    it('should have clickable quick action buttons', () => {
      render(<DashboardMinimal />)
      
      const createButton = screen.getByRole('button', { name: /Create New Template/i })
      const browseButton = screen.getByRole('button', { name: /Browse Templates/i })
      const analyticsButton = screen.getByRole('button', { name: /View Analytics/i })
      
      expect(createButton).toBeInTheDocument()
      expect(browseButton).toBeInTheDocument()
      expect(analyticsButton).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should have proper CSS classes for layout', () => {
      render(<DashboardMinimal />)
      
      const container = screen.getByRole('heading', { level: 1 }).closest('div')
      expect(container).toHaveClass('max-w-7xl', 'mx-auto')
    })

    it('should have proper background styling', () => {
      render(<DashboardMinimal />)
      
      const mainContainer = screen.getByRole('heading', { level: 1 }).closest('div')?.parentElement
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-blue-900', 'to-slate-800')
    })
  })

  describe('Content Structure', () => {
    it('should display proper stat values', () => {
      render(<DashboardMinimal />)
      
      // Test individual stat values
      expect(screen.getByText('1,247')).toBeInTheDocument()
      expect(screen.getByText('43')).toBeInTheDocument()
      expect(screen.getByText('24.8%')).toBeInTheDocument()
      expect(screen.getByText('8.4%')).toBeInTheDocument()
      
      // Test change indicators
      expect(screen.getByText('+12.5% this month')).toBeInTheDocument()
      expect(screen.getByText('+8.2% this month')).toBeInTheDocument()
      expect(screen.getByText('+3.1% this month')).toBeInTheDocument()
      expect(screen.getByText('+5.7% this month')).toBeInTheDocument()
    })

    it('should display template performance data', () => {
      render(<DashboardMinimal />)
      
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
      expect(screen.getByText('1 day ago')).toBeInTheDocument()
      expect(screen.getAllByText('Performance')).toHaveLength(2)
    })

    it('should display action descriptions', () => {
      render(<DashboardMinimal />)
      
      expect(screen.getByText('Start with AI assistance')).toBeInTheDocument()
      expect(screen.getByText('Explore our library')).toBeInTheDocument()
      expect(screen.getByText('Check performance')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    it('should have proper grid structure for stats', () => {
      render(<DashboardMinimal />)
      
      // Find the stats grid container
      const statsGrid = screen.getByText('Templates Created').closest('div')?.parentElement
      expect(statsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
    })

    it('should have proper grid structure for main content', () => {
      render(<DashboardMinimal />)
      
      // Find the main content grid
      const mainGrid = screen.getByText('Recent Templates').closest('div')?.parentElement?.parentElement
      expect(mainGrid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DashboardMinimal />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1).toBeInTheDocument()
      expect(h2Elements.length).toBeGreaterThan(0)
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    it('should have descriptive button text', () => {
      render(<DashboardMinimal />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy()
        expect(button.textContent?.length).toBeGreaterThan(5)
      })
    })
  })
})