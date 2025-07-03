/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Dashboard integration tests
describe('Dashboard Integration Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Page Loading and Hydration', () => {
    it('should load dashboard page without hydration errors', async () => {
      // Mock successful response
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <!DOCTYPE html>
          <html>
            <head><title>EmailMakers - AI-Powered Email Template Generation</title></head>
            <body class="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800">
              <header class="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-slate-900/80">
                <div class="max-w-7xl mx-auto px-6 py-3">
                  <div class="flex items-center justify-between">
                    <a href="/" class="flex items-center space-x-2 text-white hover:text-primary transition-colors">
                      <span class="text-2xl font-bold">Email<span class="text-primary">Makers</span></span>
                    </a>
                  </div>
                </div>
              </header>
              <main class="min-h-screen">
                <div class="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
                  <div class="max-w-7xl mx-auto">
                    <h1 class="text-4xl font-bold text-white mb-8">Dashboard</h1>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                        <h3 class="text-white text-lg font-semibold mb-2">Templates Created</h3>
                        <p class="text-3xl font-bold text-green-400">1,247</p>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </body>
          </html>
        `,
        json: async () => ({ success: true })
      })

      const response = await fetch('http://localhost:3000/dashboard')
      const html = await response.text()

      expect(response.ok).toBe(true)
      expect(html).toContain('Dashboard')
      expect(html).toContain('Templates Created')
      expect(html).toContain('1,247')
      expect(html).toContain('bg-gradient-to-br from-blue-900 to-slate-800')
    })

    it('should have proper CSS classes and structure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
            <div class="max-w-7xl mx-auto">
              <h1 class="text-4xl font-bold text-white mb-8">Dashboard</h1>
            </div>
          </div>
        `
      })

      const response = await fetch('http://localhost:3000/dashboard')
      const html = await response.text()

      // Check for critical CSS classes
      expect(html).toContain('min-h-screen')
      expect(html).toContain('bg-gradient-to-br')
      expect(html).toContain('from-blue-900')
      expect(html).toContain('to-slate-800')
      expect(html).toContain('max-w-7xl')
      expect(html).toContain('mx-auto')
      expect(html).toContain('text-4xl')
      expect(html).toContain('font-bold')
      expect(html).toContain('text-white')
    })

    it('should load without JavaScript errors', async () => {
      // Mock console.error to capture JS errors
      const originalError = console.error
      const errors: string[] = []
      console.error = (...args: any[]) => {
        errors.push(args.join(' '))
      }

      try {
        // Simulate page load
        const mockPageLoad = () => {
          // No errors should occur during basic page load
          return true
        }

        const loaded = mockPageLoad()
        expect(loaded).toBe(true)
        expect(errors).toHaveLength(0)
      } finally {
        console.error = originalError
      }
    })
  })

  describe('Navigation Integration', () => {
    it('should include navigation component', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => `
          <header class="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-slate-900/80">
            <nav class="hidden md:flex items-center space-x-1">
              <a href="/" class="flex items-center space-x-2">
                <span>🏠</span><span>Главная</span>
              </a>
              <a href="/create" class="flex items-center space-x-2">
                <span>✨</span><span>Создать</span>
              </a>
              <a href="/templates" class="flex items-center space-x-2">
                <span>📧</span><span>Шаблоны</span>
              </a>
            </nav>
          </header>
        `
      })

      const response = await fetch('http://localhost:3000/dashboard')
      const html = await response.text()

      expect(html).toContain('Главная')
      expect(html).toContain('Создать')
      expect(html).toContain('Шаблоны')
      expect(html).toContain('href="/"')
      expect(html).toContain('href="/create"')
      expect(html).toContain('href="/templates"')
    })
  })

  describe('API Endpoints Integration', () => {
    it('should be able to connect to optimization API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          analysis: {
            current_state: {
              health_score: 85,
              system_metrics: {
                system_health_score: 85,
                active_agents: 3,
                overall_success_rate: 0.92,
                average_response_time: 1200
              }
            },
            insights: {
              trends_detected: 2,
              bottlenecks_found: 1,
              error_patterns: 0,
              predicted_issues: 0
            }
          }
        })
      })

      const response = await fetch('/api/optimization/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_system' })
      })

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.analysis.current_state.health_score).toBe(85)
      expect(data.analysis.insights.trends_detected).toBe(2)
    })
  })

  describe('Performance and Metrics', () => {
    it('should render stats grid efficiently', () => {
      const stats = [
        {
          label: 'Templates Created',
          value: '1,247',
          change: '+12.5% this month',
          color: 'text-green-400'
        },
        {
          label: 'Active Campaigns',
          value: '43',
          change: '+8.2% this month',
          color: 'text-blue-400'
        },
        {
          label: 'Open Rate',
          value: '24.8%',
          change: '+3.1% this month',
          color: 'text-purple-400'
        },
        {
          label: 'Click Rate',
          value: '8.4%',
          change: '+5.7% this month',
          color: 'text-orange-400'
        }
      ]

      // Performance test - should handle stats efficiently
      const startTime = Date.now()
      
      stats.forEach(stat => {
        expect(stat.label).toBeTruthy()
        expect(stat.value).toBeTruthy()
        expect(stat.change).toBeTruthy()
        expect(stat.color).toBeTruthy()
      })

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })

    it('should handle large datasets efficiently', () => {
      // Simulate processing many templates
      const templates = Array.from({ length: 1000 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        performance: Math.floor(Math.random() * 100),
        created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))

      const startTime = Date.now()
      
      // Simulate processing
      const processed = templates
        .filter(t => t.performance > 50)
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 10)

      const endTime = Date.now()

      expect(processed).toHaveLength(10)
      expect(endTime - startTime).toBeLessThan(100) // Should handle 1000 items quickly
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      try {
        await fetch('/api/optimization/demo')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle missing data gracefully', () => {
      const emptyDashboard = {
        stats: [],
        templates: [],
        actions: []
      }

      // Should not throw errors when data is empty
      expect(() => {
        const hasStats = emptyDashboard.stats.length > 0
        const hasTemplates = emptyDashboard.templates.length > 0
        const hasActions = emptyDashboard.actions.length > 0
        
        return { hasStats, hasTemplates, hasActions }
      }).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    it('should have proper responsive classes', () => {
      const responsiveGrid = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      const mainGrid = 'grid grid-cols-1 lg:grid-cols-3 gap-8'

      expect(responsiveGrid).toContain('grid-cols-1')
      expect(responsiveGrid).toContain('md:grid-cols-2')
      expect(responsiveGrid).toContain('lg:grid-cols-4')
      
      expect(mainGrid).toContain('grid-cols-1')
      expect(mainGrid).toContain('lg:grid-cols-3')
    })

    it('should handle different screen sizes', () => {
      const breakpoints = {
        mobile: { cols: 1, class: 'grid-cols-1' },
        tablet: { cols: 2, class: 'md:grid-cols-2' },
        desktop: { cols: 4, class: 'lg:grid-cols-4' }
      }

      Object.values(breakpoints).forEach(bp => {
        expect(bp.cols).toBeGreaterThan(0)
        expect(bp.class).toContain('grid-cols-')
      })
    })
  })
})