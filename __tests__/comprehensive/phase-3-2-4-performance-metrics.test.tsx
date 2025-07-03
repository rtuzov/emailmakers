/**
 * @jest-environment jsdom
 */

/**
 * 🧪 COMPREHENSIVE Phase 3.2.4 Validation: Performance Metrics and Recommendations
 * 
 * Complete testing of enhanced performance analytics, recommendation categorization,
 * trend analysis, impact visualization, and production readiness.
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

// Test data fixtures for enhanced metrics
const mockEnhancedAnalysis = {
  current_state: {
    health_score: 94.8,
    active_agents: 4,
    success_rate: 96.2,
    average_response_time: 850
  },
  insights: {
    trends_detected: 3,
    bottlenecks_found: 1,
    error_patterns: 2,
    predicted_issues: 0
  },
  assessment: 'Система работает отлично с возможностями для дальнейшей оптимизации',
  opportunities: [
    'Оптимизация кэширования базы данных для улучшения времени отклика',
    'Внедрение предиктивного масштабирования на основе исторических данных',
    'Улучшение алгоритмов балансировки нагрузки между агентами',
    'Реализация более эффективных механизмов очереди задач',
    'Оптимизация использования памяти в процессах обработки контента'
  ]
};

const mockEnhancedRecommendations = [
  {
    id: 'rec-perf-001',
    title: 'Оптимизация базы данных',
    description: 'Внедрение индексирования и кэширования запросов для повышения производительности',
    type: 'performance',
    priority: 'high',
    expected_impact: {
      performance_improvement: 35,
      success_rate_improvement: 8,
      response_time_reduction: 450
    },
    safety: {
      risk_level: 'low',
      requires_approval: false,
      potential_impacts: ['Временное увеличение использования памяти']
    },
    estimated_duration: '4-6 часов'
  },
  {
    id: 'rec-scale-002',
    title: 'Автомасштабирование агентов',
    description: 'Система предиктивного масштабирования на основе нагрузки',
    type: 'scalability',
    priority: 'medium',
    expected_impact: {
      performance_improvement: 25,
      success_rate_improvement: 15,
      response_time_reduction: 300
    },
    safety: {
      risk_level: 'medium',
      requires_approval: true,
      potential_impacts: ['Увеличение затрат на ресурсы', 'Сложность настройки']
    },
    estimated_duration: '1-2 недели'
  },
  {
    id: 'rec-monitor-003',
    title: 'Улучшенный мониторинг',
    description: 'Расширенная система метрик и алертов',
    type: 'monitoring',
    priority: 'low',
    expected_impact: {
      performance_improvement: 10,
      success_rate_improvement: 5,
      response_time_reduction: 100
    },
    safety: {
      risk_level: 'low',
      requires_approval: false,
      potential_impacts: ['Минимальное влияние на производительность']
    },
    estimated_duration: '2-3 дня'
  }
];

describe('🧪 COMPREHENSIVE Phase 3.2.4: Performance Metrics and Recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup successful API responses with enhanced data
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/optimization/demo')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: mockEnhancedAnalysis
              })
            });
          }
          if (body.action === 'get_recommendations') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                recommendations: {
                  total_count: 3,
                  items: mockEnhancedRecommendations,
                  summary: {
                    by_priority: { high: 1, medium: 1, low: 1 },
                    by_risk_level: { low: 2, medium: 1 },
                    safe_to_auto_apply: 2
                  }
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

  describe('📈 Enhanced Performance Analytics', () => {
    it('should display enhanced performance metric cards', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for enhanced metric cards
        expect(screen.getByText('Тренд производительности')).toBeInTheDocument();
        expect(screen.getByText('Эффективность')).toBeInTheDocument();
        expect(screen.getByText('Влияние оптимизаций')).toBeInTheDocument();
        expect(screen.getByText('Точность прогнозов')).toBeInTheDocument();
      });
    });

    it('should show performance trend with correct formatting', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('За последние 24ч')).toBeInTheDocument();
        
        // Should show trend percentage with + or - sign
        const trendElements = screen.getAllByText(/[+\-]\d+\.\d+%/);
        expect(trendElements.length).toBeGreaterThan(0);
      });
    });

    it('should display efficiency score with descriptive text', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Общий балл')).toBeInTheDocument();
        
        // Should show descriptive text based on score
        const descriptions = ['Превосходно', 'Отлично', 'Хорошо', 'Средне'];
        const hasDescription = descriptions.some(desc => 
          screen.queryByText(desc) !== null
        );
        expect(hasDescription).toBe(true);
      });
    });

    it('should show optimization impact metrics', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Улучшение системы')).toBeInTheDocument();
        expect(screen.getByText('За последний месяц')).toBeInTheDocument();
        
        // Should show impact percentage
        const impactElements = screen.getAllByText(/\+\d+\.\d+%/);
        expect(impactElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display prediction accuracy with quality indicators', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Предсказания ИИ')).toBeInTheDocument();
        
        // Should show accuracy quality descriptions
        const accuracyDescriptions = ['Высокая точность', 'Хорошая точность', 'Удовлетворительно'];
        const hasAccuracyDescription = accuracyDescriptions.some(desc => 
          screen.queryByText(desc) !== null
        );
        expect(hasAccuracyDescription).toBe(true);
      });
    });
  });

  describe('📊 Advanced Performance Dashboard', () => {
    it('should render performance analytics section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('📊 Аналитика производительности')).toBeInTheDocument();
        expect(screen.getByText('Тренды производительности')).toBeInTheDocument();
        expect(screen.getByText('Ключевые метрики')).toBeInTheDocument();
      });
    });

    it('should have time range selector functionality', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const timeSelector = screen.getByDisplayValue('24 часа');
        expect(timeSelector).toBeInTheDocument();
        
        // Should have all time range options
        expect(screen.getByRole('option', { name: '1 час' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '24 часа' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '7 дней' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '30 дней' })).toBeInTheDocument();
      });
    });

    it('should toggle advanced metrics display', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const toggleButton = screen.getByText('Показать детали');
        expect(toggleButton).toBeInTheDocument();
      });

      // Click to show advanced metrics
      const toggleButton = screen.getByText('Показать детали');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Скрыть детали')).toBeInTheDocument();
        expect(screen.getByText('Проблем решено')).toBeInTheDocument();
        expect(screen.getByText('Точность ИИ')).toBeInTheDocument();
      });
    });

    it('should display monthly aggregate metrics', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Оптимизаций за месяц')).toBeInTheDocument();
        expect(screen.getByText('Средняя производительность')).toBeInTheDocument();
        expect(screen.getByText('Темп улучшений')).toBeInTheDocument();
      });
    });

    it('should show resource utilization progress bars', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Использование ресурсов')).toBeInTheDocument();
        expect(screen.getByText('Снижение ошибок')).toBeInTheDocument();
        
        // Should have progress bar elements
        const progressBars = document.querySelectorAll('.bg-kupibilet-primary.h-2.rounded-full');
        expect(progressBars.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should render performance chart visualization', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Динамика за последние 24 часа')).toBeInTheDocument();
        
        // Should have chart bars
        const chartBars = document.querySelectorAll('.bg-kupibilet-primary\\/60');
        expect(chartBars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('💡 Enhanced Recommendations System', () => {
    it('should display intelligent recommendations header', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('💡 Интеллектуальные рекомендации')).toBeInTheDocument();
        expect(screen.getByText('3 активных рекомендаций')).toBeInTheDocument();
      });
    });

    it('should show recommendation categories analysis', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Анализ по категориям')).toBeInTheDocument();
        
        // Should show different recommendation types
        expect(screen.getByText('performance')).toBeInTheDocument();
        expect(screen.getByText('scalability')).toBeInTheDocument();
        expect(screen.getByText('monitoring')).toBeInTheDocument();
      });
    });

    it('should display priority matrix with correct categorization', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Матрица приоритетов')).toBeInTheDocument();
        expect(screen.getByText('Высокий приоритет')).toBeInTheDocument();
        expect(screen.getByText('Средний приоритет')).toBeInTheDocument();
        expect(screen.getByText('Низкий приоритет')).toBeInTheDocument();
      });
    });

    it('should show detailed recommendation cards with impact visualization', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Детальные рекомендации')).toBeInTheDocument();
        expect(screen.getByText('Оптимизация базы данных')).toBeInTheDocument();
        expect(screen.getByText('Автомасштабирование агентов')).toBeInTheDocument();
        expect(screen.getByText('Улучшенный мониторинг')).toBeInTheDocument();
      });
    });

    it('should display risk levels and priority badges correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for risk level badges
        expect(screen.getByText('Низкий риск')).toBeInTheDocument();
        expect(screen.getByText('Средний риск')).toBeInTheDocument();
        
        // Check for priority badges
        expect(screen.getByText('Высокий')).toBeInTheDocument();
        expect(screen.getByText('Средний')).toBeInTheDocument();
        expect(screen.getByText('Низкий')).toBeInTheDocument();
      });
    });

    it('should show impact progress bars for each recommendation', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Should show impact percentages
        expect(screen.getByText('+35%')).toBeInTheDocument();
        expect(screen.getByText('+25%')).toBeInTheDocument();
        expect(screen.getByText('+10%')).toBeInTheDocument();
        
        // Should have impact progress bars
        const impactBars = document.querySelectorAll('.bg-kupibilet-primary.h-1\\.5.rounded-full');
        expect(impactBars.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should display estimated costs and duration', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('4-6 часов')).toBeInTheDocument();
        expect(screen.getByText('1-2 недели')).toBeInTheDocument();
        expect(screen.getByText('2-3 дня')).toBeInTheDocument();
        
        // Should show estimated costs (dollar amounts)
        const costElements = screen.getAllByText(/\$[\d,]+/);
        expect(costElements.length).toBeGreaterThan(0);
      });
    });

    it('should show action buttons based on risk level', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('🚀 Применить')).toBeInTheDocument();
        expect(screen.getAllByText('👁️ Подробнее')).toHaveLength(2);
      });
    });
  });

  describe('📋 Implementation Planning', () => {
    it('should display implementation timeline', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('План внедрения')).toBeInTheDocument();
        expect(screen.getByText('Готовы к автоматическому применению')).toBeInTheDocument();
        expect(screen.getByText('Требуют ручной проверки')).toBeInTheDocument();
      });
    });

    it('should calculate total potential improvement correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Общее потенциальное улучшение')).toBeInTheDocument();
        
        // Should show sum of all improvements (35 + 25 + 10 = 70%)
        expect(screen.getByText('+70.0%')).toBeInTheDocument();
      });
    });

    it('should show estimated monthly savings', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Предполагаемая экономия')).toBeInTheDocument();
        expect(screen.getByText(/\$[\d,]+\/месяц/)).toBeInTheDocument();
      });
    });

    it('should count auto-applicable vs manual recommendations', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Should show counts for different categories
        const numbers = screen.getAllByText(/^\d+$/);
        expect(numbers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🎛️ Interactive Controls', () => {
    it('should allow time range selection changes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const timeSelector = await waitFor(() => 
        screen.getByDisplayValue('24 часа')
      );

      await act(async () => {
        fireEvent.change(timeSelector, { target: { value: '7d' } });
      });

      expect(timeSelector).toHaveValue('7d');
    });

    it('should toggle advanced metrics visibility', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const toggleButton = await waitFor(() => 
        screen.getByText('Показать детали')
      );

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Скрыть детали')).toBeInTheDocument();
      });

      // Toggle back
      const hideButton = screen.getByText('Скрыть детали');
      await act(async () => {
        fireEvent.click(hideButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Показать детали')).toBeInTheDocument();
      });
    });

    it('should handle recommendation action buttons', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const applyButton = screen.getByText('🚀 Применить');
        expect(applyButton).toBeInTheDocument();
        
        const detailsButtons = screen.getAllByText('👁️ Подробнее');
        expect(detailsButtons.length).toBe(2);
      });

      // Buttons should be clickable
      const applyButton = screen.getByText('🚀 Применить');
      expect(applyButton).not.toBeDisabled();
    });

    it('should show expanded recommendations when requested', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Since we have exactly 3 recommendations, the "show all" button shouldn't appear
      // But let's test the logic is in place
      await waitFor(() => {
        const showAllButton = screen.queryByText(/Показать все/);
        expect(showAllButton).toBeNull(); // Should not exist with only 3 recommendations
      });
    });
  });

  describe('📱 Responsive Design & Accessibility', () => {
    it('should use responsive grid layouts', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for responsive grid classes
        const responsiveGrids = document.querySelectorAll('.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-4');
        expect(responsiveGrids.length).toBeGreaterThan(0);
        
        const responsiveCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3');
        expect(responsiveCards.length).toBeGreaterThan(0);
      });
    });

    it('should have proper heading structure', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const headings = document.querySelectorAll('h1, h2, h3');
        expect(headings.length).toBeGreaterThan(0);
        
        // Should have hierarchical heading structure
        expect(screen.getByText('Панель')).toBeInTheDocument(); // h1
        expect(screen.getByText('📊 Аналитика производительности')).toBeInTheDocument(); // h2
        expect(screen.getByText('Тренды производительности')).toBeInTheDocument(); // h3
      });
    });

    it('should maintain accessibility with proper color contrast', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for proper color classes that maintain contrast
        const primaryElements = document.querySelectorAll('.text-kupibilet-primary');
        expect(primaryElements.length).toBeGreaterThan(0);
        
        const whiteTextElements = document.querySelectorAll('.text-white');
        expect(whiteTextElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🔄 Real-time Updates', () => {
    it('should update metrics when data changes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Тренд производительности')).toBeInTheDocument();
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
                  ...mockEnhancedAnalysis,
                  current_state: {
                    ...mockEnhancedAnalysis.current_state,
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

      // Verify update occurred
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // Initial: 2 calls, Refresh: 2 more calls
      });
    });

    it('should handle loading states during updates', async () => {
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
                  analysis: mockEnhancedAnalysis
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
        // Should show error state
        expect(screen.getByText('Остановлена')).toBeInTheDocument();
      });
    });

    it('should handle partial data gracefully', async () => {
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
        expect(screen.getByText('Тренд производительности')).toBeInTheDocument();
      });

      // Should still display available data
      expect(screen.queryByText('💡 Интеллектуальные рекомендации')).not.toBeInTheDocument();
    });
  });

  describe('🌐 Production Readiness', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large recommendations dataset
      const largeRecommendationSet = Array.from({ length: 20 }, (_, i) => ({
        ...mockEnhancedRecommendations[0],
        id: `rec-large-${i}`,
        title: `Optimization Recommendation ${i}`,
        description: `Large scale optimization recommendation #${i} with detailed analysis`
      }));

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/optimization/demo') && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'get_recommendations') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                recommendations: {
                  total_count: 20,
                  items: largeRecommendationSet,
                  summary: { safe_to_auto_apply: 15 }
                }
              })
            });
          }
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: mockEnhancedAnalysis
              })
            });
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const renderStart = performance.now();
      
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('💡 Интеллектуальные рекомендации')).toBeInTheDocument();
      });

      const renderEnd = performance.now();
      
      // Should render large datasets efficiently (under 1 second)
      expect(renderEnd - renderStart).toBeLessThan(1000);
      
      // Should show expand button for large dataset
      await waitFor(() => {
        expect(screen.getByText('Показать все 20 рекомендаций')).toBeInTheDocument();
      });
    });

    it('should maintain performance with frequent updates', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Simulate multiple rapid updates
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          const refreshButton = screen.getByText('🔄 Обновить данные');
          fireEvent.click(refreshButton);
        });
      }

      // Component should still be responsive
      await waitFor(() => {
        expect(screen.getByText('Тренд производительности')).toBeInTheDocument();
      });
    });

    it('should have proper CSS classes and styling', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for glassmorphism effects
        const glassCards = document.querySelectorAll('.glass-card');
        expect(glassCards.length).toBeGreaterThan(0);
        
        // Check for proper transition classes
        const transitionElements = document.querySelectorAll('.transition-colors, .transition-all');
        expect(transitionElements.length).toBeGreaterThan(0);
      });
    });
  });
});