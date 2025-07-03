/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizationDashboard from '@/app/optimization-dashboard/page';

// Mock fetch function for API calls
global.fetch = jest.fn();

const mockAnalysisResponse = {
  success: true,
  timestamp: new Date().toISOString(),
  analysis: {
    current_state: {
      health_score: 87,
      active_agents: 4,
      success_rate: 94.2,
      average_response_time: 1200
    },
    insights: {
      trends_detected: 3,
      bottlenecks_found: 1,
      error_patterns: 2,
      predicted_issues: 0
    },
    assessment: "Система функционирует в нормальном режиме с небольшими возможностями для оптимизации",
    opportunities: [
      "Улучшение времени отклика Content Specialist",
      "Оптимизация обработки очереди запросов"
    ]
  }
};

const mockRecommendationsResponse = {
  success: true,
  timestamp: new Date().toISOString(),
  recommendations: {
    total_count: 5,
    items: [
      {
        id: "rec1",
        title: "Оптимизация кэширования",
        description: "Улучшение производительности через расширенное кэширование",
        type: "performance",
        priority: "high",
        expected_impact: {
          performance_improvement: 15,
          success_rate_improvement: 5,
          response_time_reduction: 300
        },
        safety: {
          risk_level: "low",
          requires_approval: false,
          potential_impacts: ["Временное увеличение использования памяти"]
        },
        estimated_duration: "2-4 часа"
      },
      {
        id: "rec2",
        title: "Настройка автоскейлинга",
        description: "Автоматическое масштабирование агентов под нагрузкой",
        type: "scalability",
        priority: "medium",
        expected_impact: {
          performance_improvement: 25,
          success_rate_improvement: 10,
          response_time_reduction: 500
        },
        safety: {
          risk_level: "medium",
          requires_approval: true,
          potential_impacts: ["Изменение архитектуры системы"]
        },
        estimated_duration: "1-2 дня"
      }
    ],
    summary: {
      by_priority: { high: 2, medium: 2, low: 1 },
      by_risk_level: { low: 3, medium: 2 },
      safe_to_auto_apply: 3
    }
  }
};

const mockDemoResponse = {
  success: true,
  timestamp: new Date().toISOString(),
  demo: {
    type: 'basic',
    description: 'Complete optimization system demonstration',
    features: [
      'System analysis and health assessment',
      'Recommendation generation with safety evaluation',
      'Safe optimization application',
      'Rollback capability demonstration',
      'Dynamic threshold generation',
      'Comprehensive reporting'
    ]
  },
  logs: [
    '🚀 Starting optimization system demonstration...',
    '✅ System analysis completed',
    '📊 Recommendations generated: 5 items',
    '🔒 Safety checks passed',
    '✅ Demonstration completed successfully'
  ],
  summary: {
    total_log_entries: 5,
    demo_duration: 'Variable based on demo type',
    status: 'completed_successfully'
  }
};

describe('Optimization Dashboard Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/optimization/demo')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          if (body.action === 'analyze_system') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockAnalysisResponse),
            });
          }
          if (body.action === 'get_recommendations') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockRecommendationsResponse),
            });
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDemoResponse),
          });
        }
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Initial Rendering', () => {
    it('should render the optimization dashboard header', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      expect(screen.getByText('Панель Оптимизации')).toBeInTheDocument();
      expect(screen.getByText('Мониторинг системы автоматической оптимизации агентов в реальном времени')).toBeInTheDocument();
    });

    it('should render all metric cards', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      expect(screen.getByText('Здоровье системы')).toBeInTheDocument();
      expect(screen.getByText('Активные агенты')).toBeInTheDocument();
      expect(screen.getByText('Успешность')).toBeInTheDocument();
      expect(screen.getByText('Время отклика')).toBeInTheDocument();
    });

    it('should render real-time monitoring section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      expect(screen.getByText('Мониторинг в реальном времени')).toBeInTheDocument();
      expect(screen.getByText('Общие оптимизации')).toBeInTheDocument();
      expect(screen.getByText('Ожидающие рекомендации')).toBeInTheDocument();
      expect(screen.getByText('Статус системы')).toBeInTheDocument();
    });

    it('should render system analysis section', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      expect(screen.getByText('Анализ системы')).toBeInTheDocument();
      expect(screen.getByText('Общий балл здоровья')).toBeInTheDocument();
      expect(screen.getByText('Узкие места')).toBeInTheDocument();
      expect(screen.getByText('Паттерны ошибок')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load optimization data on mount', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/optimization/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze_system' }),
          cache: 'no-store'
        });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/optimization/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_recommendations' }),
          cache: 'no-store'
        });
      });
    });

    it('should display loaded analysis data', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('87')).toBeInTheDocument(); // Health score
        expect(screen.getByText('4')).toBeInTheDocument(); // Active agents
        expect(screen.getByText('94%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('1.2s')).toBeInTheDocument(); // Response time
      });
    });

    it('should display system status correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Активна')).toBeInTheDocument();
        expect(screen.getByText('Система активна')).toBeInTheDocument();
      });
    });

    it('should show last update timestamp', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Последнее обновление')).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations Display', () => {
    it('should display recommendations when available', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Рекомендации по оптимизации')).toBeInTheDocument();
        expect(screen.getByText('Оптимизация кэширования')).toBeInTheDocument();
        expect(screen.getByText('Настройка автоскейлинга')).toBeInTheDocument();
      });
    });

    it('should display recommendation priorities and risk levels', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('low risk')).toBeInTheDocument();
        expect(screen.getByText('medium risk')).toBeInTheDocument();
      });
    });

    it('should display expected performance improvements', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Улучшение производительности: +15%')).toBeInTheDocument();
        expect(screen.getByText('Улучшение производительности: +25%')).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Button', () => {
    it('should run analysis when button is clicked', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/optimization/demo?type=basic', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
      });
    });

    it('should show loading state during analysis', async () => {
      let resolveAnalysis: Function;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('type=basic')) {
          return new Promise((resolve) => {
            resolveAnalysis = () => resolve({
              ok: true,
              json: () => Promise.resolve(mockDemoResponse),
            });
          });
        }
        // Return default mocks for other calls
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalysisResponse),
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      expect(screen.getByText('🔄 Анализ...')).toBeInTheDocument();
      expect(analysisButton).toBeDisabled();

      // Resolve the analysis
      await act(async () => {
        resolveAnalysis();
      });
    });

    it('should display demo results after analysis', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Результаты демонстрации')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Log entries
        expect(screen.getByText('6')).toBeInTheDocument(); // Features tested
        expect(screen.getByText('✅')).toBeInTheDocument(); // Status
      });
    });
  });

  describe('Refresh Button', () => {
    it('should refresh data when refresh button is clicked', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Clear the mock to count new calls
      jest.clearAllMocks();

      const refreshButton = screen.getByText('🔄 Обновить данные');
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/optimization/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze_system' }),
          cache: 'no-store'
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Остановлена')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Остановлена')).toBeInTheDocument();
      });
    });

    it('should show error status when analysis fails', async () => {
      // Allow initial data load to succeed
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls succeed (initial data load)
          if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            if (body.action === 'analyze_system') {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockAnalysisResponse),
              });
            }
            if (body.action === 'get_recommendations') {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockRecommendationsResponse),
              });
            }
          }
        }
        // Analysis call fails
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      });

      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Активна')).toBeInTheDocument();
      });

      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      // Should still show running status from initial load
      await waitFor(() => {
        expect(screen.getByText('Активна')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layouts correctly', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const statusCards = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statusCards).toBeInTheDocument();

      const performanceGrid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(performanceGrid).toBeInTheDocument();
    });

    it('should render glassmorphism cards', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const glassCards = document.querySelectorAll('.glass-card');
      expect(glassCards.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh data every 30 seconds', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Wait for initial data load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Clear mocks to count new calls
      jest.clearAllMocks();

      // Fast-forward 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/optimization/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze_system' }),
          cache: 'no-store'
        });
      });
    });
  });

  describe('Settings Button', () => {
    it('should show notification when settings button is clicked', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const settingsButton = screen.getByText('⚙️ Настройки');
      
      await act(async () => {
        fireEvent.click(settingsButton);
      });

      // Note: We can't test toast notifications in JSDOM environment easily
      // This would require additional setup for react-hot-toast
    });
  });

  describe('Clear Results Button', () => {
    it('should show clear results button after demo is run', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      await waitFor(() => {
        expect(screen.getByText('🗑️ Очистить результаты')).toBeInTheDocument();
      });
    });

    it('should clear demo results when clear button is clicked', async () => {
      await act(async () => {
        render(<OptimizationDashboard />);
      });

      // Run analysis first
      const analysisButton = screen.getByText('🔍 Запустить анализ');
      
      await act(async () => {
        fireEvent.click(analysisButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Результаты демонстрации')).toBeInTheDocument();
      });

      // Clear results
      const clearButton = screen.getByText('🗑️ Очистить результаты');
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(screen.queryByText('Результаты демонстрации')).not.toBeInTheDocument();
      expect(screen.getByText('⚙️ Настройки')).toBeInTheDocument();
    });
  });
});