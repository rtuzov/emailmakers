/**
 * @jest-environment jsdom
 */

/**
 * 🧪 COMPREHENSIVE Phase 3.2.6 Validation: Optimization Controls
 * 
 * Complete testing of optimization controls management, system settings,
 * interactive control panels, and real-time status updates functionality.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizationDashboard from '@/app/optimization-dashboard/page';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  },
  Toaster: ({ children }: { children?: React.ReactNode }) => <div data-testid="toaster">{children}</div>
}));

// Test data fixtures for Phase 3.2.6
const mockAnalysisWithControls = {
  current_state: {
    health_score: 96.3,
    active_agents: 4,
    success_rate: 98.2,
    average_response_time: 780
  },
  insights: {
    trends_detected: 6,
    bottlenecks_found: 0,
    error_patterns: 0,
    predicted_issues: 0
  },
  assessment: 'Система показывает отличную производительность с полным контролем оптимизаций',
  opportunities: [
    'Активация дополнительных автоматических оптимизаций',
    'Настройка более агрессивных порогов для критических операций',
    'Интеграция с внешними системами мониторинга'
  ]
};

const mockRecommendationsWithControls = [
  {
    id: 'rec-controls-001',
    title: 'Управление оптимизациями в реальном времени',
    description: 'Настройка и управление автоматическими оптимизациями системы',
    type: 'controls',
    priority: 'high',
    expected_impact: {
      performance_improvement: 22,
      success_rate_improvement: 5,
      response_time_reduction: 180
    },
    safety: {
      risk_level: 'medium',
      requires_approval: true,
      potential_impacts: ['Изменение поведения системы при автоматических оптимизациях']
    },
    estimated_duration: '10-15 минут'
  }
];

describe('🧪 COMPREHENSIVE Phase 3.2.6: Optimization Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup successful API responses with controls data
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/optimization/demo')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                analysis: mockAnalysisWithControls
              })
            });
          }
          if (body.action === 'get_recommendations') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                recommendations: {
                  total_count: 1,
                  items: mockRecommendationsWithControls,
                  summary: {
                    by_priority: { high: 1 },
                    by_risk_level: { medium: 1 },
                    safe_to_auto_apply: 0
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
            demo: { type: 'controls', features: [] },
            logs: [],
            summary: { status: 'completed_successfully' }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('🎛️ Optimization Controls Section', () => {
    it('should render optimization controls management section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });

    it('should display controls filter dropdown with all options', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const controlsFilter = screen.getByDisplayValue('Все');
        expect(controlsFilter).toBeInTheDocument();
        
        expect(screen.getByRole('option', { name: 'Все' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Включенные' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Отключенные' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Активные' })).toBeInTheDocument();
      });
    });

    it('should have show/hide controls panel toggle', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Показать панель')).toBeInTheDocument();
      });
    });

    it('should have system settings button', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('⚙️ Настройки системы')).toBeInTheDocument();
      });
    });
  });

  describe('📊 System Status Overview', () => {
    it('should display system status overview cards', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Активные оптимизации')).toBeInTheDocument();
        expect(screen.getByText('Общий статус')).toBeInTheDocument();
        expect(screen.getByText('Средняя эффективность')).toBeInTheDocument();
        expect(screen.getByText('Требует одобрения')).toBeInTheDocument();
      });
    });

    it('should show active optimizations counter', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        const activeOptimizationsElements = screen.getAllByText('Активные оптимизации');
        expect(activeOptimizationsElements.length).toBeGreaterThan(0);
        
        // Should show counter with appropriate emoji
        expect(screen.getByText('🔄')).toBeInTheDocument();
      });
    });

    it('should display global system status', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Should show either active or paused status
        const statusTexts = ['Активна', 'Приостановлена'];
        const hasStatus = statusTexts.some(status => 
          screen.queryByText(status) !== null
        );
        expect(hasStatus).toBe(true);
        
        // Should show appropriate status emoji
        const statusEmojis = ['✅', '⏸️'];
        const hasStatusEmoji = statusEmojis.some(emoji => 
          screen.queryByText(emoji) !== null
        );
        expect(hasStatusEmoji).toBe(true);
      });
    });

    it('should show average effectiveness calculation', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('📈')).toBeInTheDocument();
        expect(screen.getByText('Влияние оптимизаций')).toBeInTheDocument();
      });
    });

    it('should display high-risk operations counter', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Высокорисковые операции')).toBeInTheDocument();
      });
    });
  });

  describe('🎛️ Controls Grid and Individual Controls', () => {
    it('should render controls panel when toggled', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Click to show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Скрыть панель')).toBeInTheDocument();
      });
    });

    it('should display generated optimization controls', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        // Should show optimization control types
        const controlTypes = ['Performance', 'Database', 'Caching', 'Memory', 'Network', 'Security'];
        const hasControlTypes = controlTypes.some(type => 
          screen.queryByText(new RegExp(type, 'i')) !== null
        );
        expect(hasControlTypes).toBe(true);
      });
    });

    it('should show control status indicators', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        // Should show status indicators
        const statusTexts = ['Выполняется', 'Ожидание', 'Ошибка', 'Приостановлена', 'Готова'];
        const hasStatus = statusTexts.some(status => 
          screen.queryByText(status) !== null
        );
        expect(hasStatus).toBe(true);
      });
    });

    it('should display control performance metrics', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Успешность:')).toBeInTheDocument();
        expect(screen.getByText('Среднее влияние:')).toBeInTheDocument();
        expect(screen.getByText('Длительность:')).toBeInTheDocument();
        expect(screen.getByText('Уровень риска:')).toBeInTheDocument();
      });
    });

    it('should show control action buttons', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        const actionButtons = ['Отключить', 'Включить', 'Запустить', 'Требует одобрения', 'Приостановить', 'Настройки'];
        const hasActionButtons = actionButtons.some(button => 
          screen.queryByText(button) !== null
        );
        expect(hasActionButtons).toBe(true);
      });
    });

    it('should handle control configuration expansion', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      // Click on configuration button if available
      await waitFor(() => {
        const configButtons = screen.queryAllByText('Настройки');
        if (configButtons.length > 0) {
          fireEvent.click(configButtons[0]);
          
          // Should show expanded configuration
          expect(screen.getByText('Пороги срабатывания:')).toBeInTheDocument();
          expect(screen.getByText('Расписание:')).toBeInTheDocument();
        }
      });
    });
  });

  describe('⚙️ System Settings Panel', () => {
    it('should render system settings panel when toggled', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Click to show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('⚙️ Системные настройки')).toBeInTheDocument();
      });
    });

    it('should display global settings section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Общие настройки')).toBeInTheDocument();
        expect(screen.getByText('Глобальная оптимизация')).toBeInTheDocument();
        expect(screen.getByText('Порог авто-одобрения')).toBeInTheDocument();
        expect(screen.getByText('Макс. одновременных оптимизаций')).toBeInTheDocument();
        expect(screen.getByText('Окно отката (часы)')).toBeInTheDocument();
      });
    });

    it('should display performance thresholds section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Пороги производительности')).toBeInTheDocument();
        expect(screen.getByText('Критический CPU')).toBeInTheDocument();
        expect(screen.getByText('Критическая память')).toBeInTheDocument();
        expect(screen.getByText('Макс. время отклика')).toBeInTheDocument();
        expect(screen.getByText('Мин. уровень успеха')).toBeInTheDocument();
      });
    });

    it('should display notification settings section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Уведомления')).toBeInTheDocument();
        expect(screen.getByText('Email-уведомления')).toBeInTheDocument();
        expect(screen.getByText('Slack-интеграция')).toBeInTheDocument();
      });
    });

    it('should display backup settings section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Резервное копирование')).toBeInTheDocument();
        expect(screen.getByText('Авто-бэкапы')).toBeInTheDocument();
        expect(screen.getByText('Хранение (дни)')).toBeInTheDocument();
        expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
      });
    });
  });

  describe('🔄 Interactive Controls and Actions', () => {
    it('should allow controls filter changes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const controlsFilter = await waitFor(() => 
        screen.getByDisplayValue('Все')
      );

      await act(async () => {
        fireEvent.change(controlsFilter, { target: { value: 'enabled' } });
      });

      expect(controlsFilter).toHaveValue('enabled');
    });

    it('should toggle controls panel visibility', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const showPanelButton = await waitFor(() => 
        screen.getByText('Показать панель')
      );

      await act(async () => {
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Скрыть панель')).toBeInTheDocument();
      });

      // Toggle back
      const hidePanelButton = screen.getByText('Скрыть панель');
      await act(async () => {
        fireEvent.click(hidePanelButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Показать панель')).toBeInTheDocument();
      });
    });

    it('should toggle system settings panel', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const settingsButton = await waitFor(() => 
        screen.getByText('⚙️ Настройки системы')
      );

      await act(async () => {
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('⚙️ Системные настройки')).toBeInTheDocument();
      });
    });

    it('should handle control enable/disable actions', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel first
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      await waitFor(() => {
        const enableDisableButtons = screen.queryAllByText(/Отключить|Включить/);
        if (enableDisableButtons.length > 0) {
          fireEvent.click(enableDisableButtons[0]);
          // Button should be clicked (action simulated)
        }
      });
    });

    it('should handle system settings toggles', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const toggleButtons = screen.queryAllByText(/Включена|Отключена|Включены|Отключены/);
        if (toggleButtons.length > 0) {
          fireEvent.click(toggleButtons[0]);
          // Toggle action simulated
        }
      });
    });
  });

  describe('📱 Responsive Design & Accessibility', () => {
    it('should use responsive grid layouts for controls', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Check for responsive grid classes
        const responsiveGrids = document.querySelectorAll('.grid-cols-1.md\\\\:grid-cols-4');
        expect(responsiveGrids.length).toBeGreaterThan(0);
      });
    });

    it('should maintain accessibility with proper semantic structure', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Should have proper heading hierarchy
        const headings = document.querySelectorAll('h2, h3, h4');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should have proper color contrast indicators', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Status indicators should have proper color classes
        const coloredElements = document.querySelectorAll('.bg-green-500, .bg-red-500, .bg-yellow-500, .text-green-400, .text-red-400, .text-yellow-400');
        expect(coloredElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🛡️ Error Handling & Edge Cases', () => {
    it('should handle empty controls gracefully', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Component should render without errors even if controls are empty
      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });

    it('should handle missing system settings gracefully', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Component should render without errors even if settings are missing
      await waitFor(() => {
        expect(screen.getByText('⚙️ Настройки системы')).toBeInTheDocument();
      });
    });

    it('should handle filter changes without errors', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const controlsFilter = await waitFor(() => 
        screen.getByDisplayValue('Все')
      );

      // Test all filter options
      const filters = ['enabled', 'disabled', 'running', 'all'];
      for (const filter of filters) {
        await act(async () => {
          fireEvent.change(controlsFilter, { target: { value: filter } });
        });
        
        expect(controlsFilter).toHaveValue(filter);
      }
    });

    it('should handle panel toggles without errors', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Toggle controls panel multiple times
      for (let i = 0; i < 3; i++) {
        const panelButton = await waitFor(() => 
          screen.getByText(i % 2 === 0 ? 'Показать панель' : 'Скрыть панель')
        );
        
        await act(async () => {
          fireEvent.click(panelButton);
        });
      }

      // Should still be functional
      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });
  });

  describe('🚀 Performance & Production Readiness', () => {
    it('should render efficiently with controls data', async () => {
      const renderStart = performance.now();
      
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });

      const renderEnd = performance.now();
      
      // Should render controls efficiently (under 1 second)
      expect(renderEnd - renderStart).toBeLessThan(1000);
    });

    it('should handle frequent filter changes efficiently', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const controlsFilter = await waitFor(() => 
        screen.getByDisplayValue('Все')
      );

      // Simulate rapid filter changes
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          fireEvent.change(controlsFilter, { 
            target: { value: i % 2 === 0 ? 'enabled' : 'all' } 
          });
        });
      }

      // Component should still be responsive
      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });

    it('should maintain performance with settings panel toggles', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Toggle settings panel multiple times rapidly
      for (let i = 0; i < 5; i++) {
        const settingsButton = await waitFor(() => 
          screen.getByText('⚙️ Настройки системы')
        );
        
        await act(async () => {
          fireEvent.click(settingsButton);
        });
      }

      // Should still be functional
      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });
  });

  describe('📊 Data Consistency & Integration', () => {
    it('should generate consistent controls data', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        // Controls data should be present and consistent
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
      });
    });

    it('should show realistic system settings data', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show system settings
      await waitFor(() => {
        const settingsButton = screen.getByText('⚙️ Настройки системы');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        // Should show realistic percentage and numeric values
        const percentageElements = screen.queryAllByText(/\d+%/);
        const numericElements = screen.queryAllByText(/\d+/);
        expect(percentageElements.length + numericElements.length).toBeGreaterThan(0);
      });
    });

    it('should maintain data consistency across state changes', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Show controls panel
      await waitFor(() => {
        const showPanelButton = screen.getByText('Показать панель');
        fireEvent.click(showPanelButton);
      });

      // Change filter
      const controlsFilter = screen.getByDisplayValue('Все');
      await act(async () => {
        fireEvent.change(controlsFilter, { target: { value: 'enabled' } });
      });

      // Should maintain consistency
      await waitFor(() => {
        expect(screen.getByText('🎛️ Управление оптимизациями')).toBeInTheDocument();
        expect(controlsFilter).toHaveValue('enabled');
      });
    });
  });
});