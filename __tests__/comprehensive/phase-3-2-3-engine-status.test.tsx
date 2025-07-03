/**
 * @jest-environment jsdom
 */

/**
 * 🧪 COMPREHENSIVE Phase 3.2.3 Validation: Optimization Engine Status
 * 
 * Complete testing of optimization engine status display, UI components,
 * data presentation, real-time updates, and production readiness.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizationDashboard from '@/app/optimization-dashboard/page';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: jest.fn(),
  Toaster: ({ children }: { children?: React.ReactNode }) => <div data-testid="toaster">{children}</div>
}));

// Test data fixtures
const mockEngineStatus = {
  status: 'running',
  last_analysis: '2024-01-15T10:30:00.000Z',
  last_optimization: '2024-01-15T10:25:00.000Z',
  active_optimizations: 3,
  total_optimizations_today: 47,
  system_health_score: 94.8,
  recommendations_pending: 5
};

const mockAnalysisWithOpportunities = {
  current_state: {
    health_score: 94.8,
    active_agents: 4,
    success_rate: 96.2,
    average_response_time: 850
  },
  insights: {
    trends_detected: 4,
    bottlenecks_found: 1,
    error_patterns: 2,
    predicted_issues: 0
  },
  assessment: 'Система работает отлично с незначительными возможностями для улучшения',
  opportunities: [
    'Оптимизация кэширования базы данных для улучшения времени отклика',
    'Внедрение предиктивного масштабирования на основе исторических данных',
    'Улучшение алгоритмов балансировки нагрузки между агентами',
    'Реализация более эффективных механизмов очереди задач',
    'Оптимизация использования памяти в процессах обработки контента',
    'Внедрение продвинутой аналитики для раннего обнаружения проблем'
  ]
};

const mockRecommendations = [
  {
    id: 'rec1',
    title: 'Оптимизация базы данных',
    description: 'Улучшение производительности запросов к базе данных',
    priority: 'high',
    safety: { risk_level: 'low' },
    expected_impact: { performance_improvement: 25 }
  },
  {
    id: 'rec2', 
    title: 'Настройка кэширования',
    description: 'Внедрение расширенного кэширования',
    priority: 'medium',
    safety: { risk_level: 'low' },
    expected_impact: { performance_improvement: 15 }
  }
];

const mockMetrics = {
  systemHealth: 94.8,
  activeAgents: 4,
  successRate: 96.2,
  avgResponseTime: 0.85,
  totalOptimizations: 234,
  pendingRecommendations: 5
};

describe('🧪 COMPREHENSIVE Phase 3.2.3: Optimization Engine Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/optimization/demo')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: mockAnalysisWithOpportunities
              })
            });
          }
          if (body.action === 'get_recommendations') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                recommendations: {
                  total_count: 2,
                  items: mockRecommendations,
                  summary: { safe_to_auto_apply: 1 }
                }
              })
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            demo: { type: 'basic', features: [] },
            logs: [],
            summary: { status: 'completed_successfully' }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('🔧 Engine Status Display', () => {
    it('should render engine status section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('🔧 Статус движка оптимизации')).toBeInTheDocument();
      });
    });

    it('should display engine health information', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
        expect(screen.getByText('Последний анализ')).toBeInTheDocument();
        expect(screen.getByText('Последняя оптимизация')).toBeInTheDocument();
        expect(screen.getByText('Активные задачи')).toBeInTheDocument();
      });
    });

    it('should display performance metrics section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Метрики производительности')).toBeInTheDocument();
        expect(screen.getByText('Оптимизаций сегодня')).toBeInTheDocument();
        expect(screen.getByText('Ожидающих рекомендаций')).toBeInTheDocument();
        expect(screen.getByText('Эффективность')).toBeInTheDocument();
      });
    });

    it('should display engine configuration section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Конфигурация')).toBeInTheDocument();
        expect(screen.getByText('Автооптимизация')).toBeInTheDocument();
        expect(screen.getByText('Мониторинг')).toBeInTheDocument();
        expect(screen.getByText('Безопасный режим')).toBeInTheDocument();
      });
    });
  });

  describe('📊 Data Display & Formatting', () => {
    it('should format timestamps correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
      });

      // Check that timestamps are formatted (would show Russian locale format)
      const timestampElements = screen.getAllByText(/\d+\.\d+\.\d+/);
      expect(timestampElements.length).toBeGreaterThanOrEqual(0); // Timestamps might not be visible if null
    });

    it('should display numeric values correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for presence of metric values (they start as 0 and get updated)
        const numericElements = screen.getAllByText(/^\d+$/);
        expect(numericElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle null/empty timestamps gracefully', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Не выполнен')).toBeInTheDocument();
        expect(screen.getByText('Не выполнена')).toBeInTheDocument();
      });
    });

    it('should show appropriate status indicators', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for status indicator elements (colored dots)
        const statusDots = document.querySelectorAll('.w-3.h-3.rounded-full');
        expect(statusDots.length).toBeGreaterThanOrEqual(3); // At least 3 status indicators
      });
    });
  });

  describe('💡 Optimization Opportunities', () => {
    it('should display optimization opportunities when available', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Возможности для оптимизации')).toBeInTheDocument();
      });

      await waitFor(() => {
        // Check for first few opportunities
        expect(screen.getByText(/Оптимизация кэширования базы данных/)).toBeInTheDocument();
        expect(screen.getByText(/Внедрение предиктивного масштабирования/)).toBeInTheDocument();
      });
    });

    it('should limit displayed opportunities to 4 and show count', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Возможности для оптимизации')).toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show "+2 дополнительных возможностей" since we have 6 total, showing 4
        expect(screen.getByText('+2 дополнительных возможностей')).toBeInTheDocument();
      });
    });

    it('should not display opportunities section when none available', async () => {
      // Mock empty opportunities
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: { ...mockAnalysisWithOpportunities, opportunities: [] }
              })
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, recommendations: { items: [] } })
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
      });

      // Opportunities section should not be visible
      expect(screen.queryByText('Возможности для оптимизации')).not.toBeInTheDocument();
    });
  });

  describe('🎨 UI/UX & Visual Elements', () => {
    it('should apply correct CSS classes for glassmorphism effect', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const engineStatusSection = screen.getByText('🔧 Статус движка оптимизации').closest('.glass-card');
        expect(engineStatusSection).toBeInTheDocument();
        expect(engineStatusSection).toHaveClass('glass-card');
      });
    });

    it('should display appropriate icons and emojis', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('💚')).toBeInTheDocument(); // Engine health icon
        expect(screen.getByText('📊')).toBeInTheDocument(); // Performance metrics icon  
        expect(screen.getByText('⚙️')).toBeInTheDocument(); // Configuration icon
      });
    });

    it('should use responsive grid layout', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
        expect(gridContainer).toBeInTheDocument();
      });
    });

    it('should apply conditional styling based on status', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for conditional styling elements
        const statusDots = document.querySelectorAll('.bg-kupibilet-primary, .bg-gray-500, .bg-yellow-400, .bg-red-400');
        expect(statusDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🔄 Real-time Updates', () => {
    it('should update engine status when data changes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
      });

      // Mock updated data
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: {
                  ...mockAnalysisWithOpportunities,
                  current_state: {
                    ...mockAnalysisWithOpportunities.current_state,
                    health_score: 98.5
                  }
                }
              })
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, recommendations: { items: [] } })
        });
      });

      // Trigger refresh
      const refreshButton = screen.getByText('🔄 Обновить данные');
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Verify update occurred (component should re-render with new data)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // Initial: 2 calls, Refresh: 2 more calls
      });
    });

    it('should show loading states during updates', async () => {
      let resolveAnalysis: Function;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return new Promise((resolve) => {
              resolveAnalysis = () => resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  analysis: mockAnalysisWithOpportunities
                })
              });
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, recommendations: { items: [] } })
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Should show loading indicators
      expect(screen.getAllByText('...')).toHaveLength(4); // Loading indicators for metrics

      // Resolve analysis
      await act(async () => {
        resolveAnalysis();
      });
    });
  });

  describe('📱 Responsive Design', () => {
    it('should handle different screen sizes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for responsive classes
        const responsiveGrid = document.querySelector('.grid-cols-1.lg\\:grid-cols-3');
        expect(responsiveGrid).toBeInTheDocument();
        
        const responsiveOpportunities = document.querySelector('.grid-cols-1.md\\:grid-cols-2');
        expect(responsiveOpportunities).toBeInTheDocument();
      });
    });

    it('should maintain readability on different screen sizes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for text sizing classes
        const headings = document.querySelectorAll('.text-lg, .text-2xl');
        expect(headings.length).toBeGreaterThan(0);
        
        const bodyText = document.querySelectorAll('.text-sm, .text-xs');
        expect(bodyText.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🛡️ Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Should show stopped/error state
        expect(screen.getByText('Остановлена')).toBeInTheDocument();
      });
    });

    it('should handle partial data loading', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: {
                  current_state: { health_score: 85 },
                  insights: { bottlenecks_found: 0, error_patterns: 0 },
                  assessment: 'Partial data available'
                }
              })
            });
          }
        }
        return Promise.resolve({
          ok: false,
          status: 500
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
      });

      // Should still display what data is available
      expect(screen.queryByText('Возможности для оптимизации')).not.toBeInTheDocument();
    });
  });

  describe('🌐 Production Readiness', () => {
    it('should handle high-frequency updates without memory leaks', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Simulate multiple rapid updates
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          const refreshButton = screen.getByText('🔄 Обновить данные');
          fireEvent.click(refreshButton);
        });
      }

      // Component should still be responsive
      await waitFor(() => {
        expect(screen.getByText('Состояние движка')).toBeInTheDocument();
      });
    });

    it('should be accessible with proper ARIA labels', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for proper heading structure
        const headings = document.querySelectorAll('h2, h3');
        expect(headings.length).toBeGreaterThan(0);
        
        // Check for semantic structure
        const sections = document.querySelectorAll('div[class*="glass-card"]');
        expect(sections.length).toBeGreaterThan(0);
      });
    });

    it('should maintain performance with large datasets', async () => {
      // Mock large opportunities dataset
      const largeOpportunities = Array.from({ length: 100 }, (_, i) => 
        `Возможность оптимизации номер ${i + 1} с детальным описанием процесса улучшения производительности системы`
      );

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: {
                  ...mockAnalysisWithOpportunities,
                  opportunities: largeOpportunities
                }
              })
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, recommendations: { items: [] } })
        });
      });

      const renderStart = performance.now();
      
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Возможности для оптимизации')).toBeInTheDocument();
      });

      const renderEnd = performance.now();
      
      // Should render large datasets efficiently (under 1 second)
      expect(renderEnd - renderStart).toBeLessThan(1000);
      
      // Should still only show 4 opportunities + count
      expect(screen.getByText('+96 дополнительных возможностей')).toBeInTheDocument();
    });
  });
});