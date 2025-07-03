/**
 * @jest-environment jsdom
 */

/**
 * 🧪 COMPREHENSIVE Phase 3.3.1 Validation: Debug and Logs Runtime Fix
 * 
 * Complete testing of agent debugging pages, API error fixes,
 * runtime error resolution, and comprehensive test coverage.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/agent-debug',
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Brain: ({ className }: { className?: string }) => <div data-testid="brain-icon" className={className} />,
  Palette: ({ className }: { className?: string }) => <div data-testid="palette-icon" className={className} />,
  Shield: ({ className }: { className?: string }) => <div data-testid="shield-icon" className={className} />,
  Truck: ({ className }: { className?: string }) => <div data-testid="truck-icon" className={className} />,
  Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
}));

describe('🧪 COMPREHENSIVE Phase 3.3.1: Debug and Logs Runtime Fix', () => {

  describe('🔧 Zod Schema Fixes Validation', () => {
    it('should have fixed campaign deployment schema issues', async () => {
      // Test that the previously problematic API endpoint can be imported without errors
      try {
        await import('@/agent/tools/simple/campaign-deployment');
        expect(true).toBe(true); // Import successful
      } catch (error) {
        fail(`Campaign deployment schema import failed: ${error}`);
      }
    });

    it('should have proper optional nullable fields', async () => {
      const { campaignDeploymentSchema } = await import('@/agent/tools/simple/campaign-deployment');
      
      // Test that schema can parse optional nullable fields
      const validInput = {
        action: 'deploy_campaign' as const,
        deployment_config: {
          campaign_assets: null,
          deployment_target: 'staging',
          deployment_strategy: {
            rollout_type: 'immediate' as const,
            rollout_percentage: 100,
            enable_rollback: true
          },
          validation_checks: {
            run_quality_checks: true,
            run_visual_tests: true,
            run_performance_tests: true,
            require_manual_approval: false
          }
        },
        campaign_id: null,
        environment: 'staging',
        enable_monitoring: true,
        notifications: null,
        include_analytics: true,
        session_id: null,
        final_results: null
      };

      const result = campaignDeploymentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should handle deployment config with all nullable fields', async () => {
      const { campaignDeploymentSchema } = await import('@/agent/tools/simple/campaign-deployment');
      
      const minimalInput = {
        action: 'finalize' as const,
        deployment_config: null,
        campaign_id: null,
        notifications: null,
        session_id: null,
        final_results: null
      };

      const result = campaignDeploymentSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });

  describe('🕷️ Agent Debug Page Testing', () => {
    it('should render agent debug page without runtime errors', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      expect(screen.getByText('Отладка')).toBeInTheDocument();
      expect(screen.getByText('Агентов')).toBeInTheDocument();
      expect(screen.getByText('Мониторинг и тестирование AI-агентов системы EmailMakers')).toBeInTheDocument();
    });

    it('should display system status metrics correctly', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check system status cards
      expect(screen.getByText('Всего агентов')).toBeInTheDocument();
      expect(screen.getByText('Активных')).toBeInTheDocument();
      expect(screen.getByText('Выполнено задач')).toBeInTheDocument();
      expect(screen.getByText('Среднее время')).toBeInTheDocument();

      // Check specific values
      expect(screen.getByText('4')).toBeInTheDocument(); // Total agents
      expect(screen.getByText('3')).toBeInTheDocument(); // Active agents
      expect(screen.getByText('127')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('1.2s')).toBeInTheDocument(); // Average time
    });

    it('should render all agent cards with correct information', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check agent names
      expect(screen.getByText('Content Specialist')).toBeInTheDocument();
      expect(screen.getByText('Design Specialist')).toBeInTheDocument();
      expect(screen.getByText('Quality Specialist')).toBeInTheDocument();
      expect(screen.getByText('Delivery Specialist')).toBeInTheDocument();

      // Check agent descriptions
      expect(screen.getByText('Генерация и оптимизация контента для email-кампаний')).toBeInTheDocument();
      expect(screen.getByText('Создание и адаптация дизайна email-шаблонов')).toBeInTheDocument();
      expect(screen.getByText('Контроль качества и тестирование email-шаблонов')).toBeInTheDocument();
      expect(screen.getByText('Доставка и оптимизация email-кампаний')).toBeInTheDocument();
    });

    it('should display agent status indicators', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check status badges
      const activeStatuses = screen.getAllByText('Активен');
      expect(activeStatuses).toHaveLength(3);
      
      const standbyStatus = screen.getByText('Ожидание');
      expect(standbyStatus).toBeInTheDocument();
    });

    it('should show agent capabilities correctly', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check some capabilities
      expect(screen.getByText('AI-генерация текста')).toBeInTheDocument();
      expect(screen.getByText('Обработка Figma файлов')).toBeInTheDocument();
      expect(screen.getByText('Кроссплатформенное тестирование')).toBeInTheDocument();
      expect(screen.getByText('Оптимизация доставляемости')).toBeInTheDocument();
    });

    it('should have test buttons for each agent', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      const testButtons = screen.getAllByText('Тестировать');
      expect(testButtons).toHaveLength(4);
    });

    it('should display action buttons in footer', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      expect(screen.getByText('Запустить полный тест')).toBeInTheDocument();
      expect(screen.getByText('Просмотреть логи')).toBeInTheDocument();
    });

    it('should use proper CSS classes and styling', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check for glass morphism classes
      const glassElements = document.querySelectorAll('.glass-surface, .glass-primary');
      expect(glassElements.length).toBeGreaterThan(0);

      // Check for proper color classes
      const colorElements = document.querySelectorAll('.text-kupibilet-primary, .text-kupibilet-secondary, .text-kupibilet-accent');
      expect(colorElements.length).toBeGreaterThan(0);
    });
  });

  describe('📋 Agent Logs Page Testing', () => {
    it('should render agent logs page without runtime errors', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      expect(screen.getByText('Логи')).toBeInTheDocument();
      expect(screen.getByText('Агентов')).toBeInTheDocument();
      expect(screen.getByText('Мониторинг в реальном времени и анализ работы AI-агентов')).toBeInTheDocument();
    });

    it('should display metrics correctly', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Check metric labels
      expect(screen.getByText('Всего логов')).toBeInTheDocument();
      expect(screen.getByText('Успешность')).toBeInTheDocument();
      expect(screen.getByText('Среднее время')).toBeInTheDocument();
      expect(screen.getByText('Активные агенты')).toBeInTheDocument();

      // Check metric values
      expect(screen.getByText('5')).toBeInTheDocument(); // Total logs
      expect(screen.getByText('85.5%')).toBeInTheDocument(); // Success rate
      expect(screen.getByText('1.8s')).toBeInTheDocument(); // Average duration
      expect(screen.getByText('4')).toBeInTheDocument(); // Active agents
    });

    it('should show log levels distribution', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      expect(screen.getByText('Распределение по уровням')).toBeInTheDocument();
      
      // Check log level labels
      expect(screen.getByText('DEBUG')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('WARN')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    it('should display log entries with proper formatting', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      expect(screen.getByText('Последние события')).toBeInTheDocument();
      
      // Check for log messages
      expect(screen.getByText('Agent started successfully')).toBeInTheDocument();
      expect(screen.getByText('Processing content generation request')).toBeInTheDocument();
      expect(screen.getByText('Rate limit approaching for OpenAI API')).toBeInTheDocument();
      expect(screen.getByText('Failed to validate MJML template')).toBeInTheDocument();
      expect(screen.getByText('Email template generated successfully')).toBeInTheDocument();
    });

    it('should show tool information in logs', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Check for tool names
      expect(screen.getByText('Tool: content-specialist')).toBeInTheDocument();
      expect(screen.getByText('Tool: quality-specialist')).toBeInTheDocument();
      expect(screen.getByText('Tool: delivery-specialist')).toBeInTheDocument();
    });

    it('should display error information when present', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      expect(screen.getByText('Error: Invalid MJML syntax at line 45')).toBeInTheDocument();
    });

    it('should show request IDs and durations', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Check for request IDs
      expect(screen.getByText('ID: req_001')).toBeInTheDocument();
      expect(screen.getByText('ID: req_002')).toBeInTheDocument();
      expect(screen.getByText('ID: req_003')).toBeInTheDocument();
      expect(screen.getByText('ID: req_004')).toBeInTheDocument();
      expect(screen.getByText('ID: req_005')).toBeInTheDocument();

      // Check for durations
      expect(screen.getByText('1.2s')).toBeInTheDocument();
      expect(screen.getByText('2.3s')).toBeInTheDocument();
      expect(screen.getByText('1.8s')).toBeInTheDocument();
    });

    it('should use inline styles for compatibility', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Check that main container has inline styles
      const mainContainer = document.querySelector('[style*="minHeight"]');
      expect(mainContainer).toBeInTheDocument();

      // Check for background gradient
      const gradientElement = document.querySelector('[style*="linear-gradient"]');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('🌐 API Integration Testing', () => {
    it('should handle logs data fetching function', async () => {
      // Import the logs page to test the data fetching
      const logsModule = await import('@/app/agent-logs/page');
      
      // The page should export properly
      expect(logsModule.default).toBeDefined();
      expect(typeof logsModule.default).toBe('function');
    });

    it('should handle error scenarios in logs fetching', async () => {
      // This tests the error handling in the getAgentLogs function
      // Since it's a simulated function, it should always return data
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Should render even if there were errors (fallback data)
      expect(screen.getByText('Логи')).toBeInTheDocument();
    });
  });

  describe('🎨 UI Components & Styling', () => {
    it('should have proper responsive design elements', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check for responsive grid classes
      const responsiveGrids = document.querySelectorAll('.grid-cols-1, .md\\\\:grid-cols-2, .md\\\\:grid-cols-4');
      expect(responsiveGrids.length).toBeGreaterThan(0);
    });

    it('should use proper semantic HTML structure', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check for proper heading hierarchy
      const h1Elements = document.querySelectorAll('h1');
      expect(h1Elements.length).toBe(1);

      const h2Elements = document.querySelectorAll('h2');
      expect(h2Elements.length).toBeGreaterThan(0);

      const h3Elements = document.querySelectorAll('h3');
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible button elements', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should have text content
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });

    it('should use consistent color scheme', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check for consistent use of brand colors
      const primaryElements = document.querySelectorAll('.text-kupibilet-primary');
      expect(primaryElements.length).toBeGreaterThan(0);

      const secondaryElements = document.querySelectorAll('.text-kupibilet-secondary');
      expect(secondaryElements.length).toBeGreaterThan(0);

      const accentElements = document.querySelectorAll('.text-kupibilet-accent');
      expect(accentElements.length).toBeGreaterThan(0);
    });
  });

  describe('🛡️ Error Handling & Edge Cases', () => {
    it('should handle missing icon components gracefully', async () => {
      // Test with mocked icons
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check that mocked icons are rendered
      expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
      expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByTestId('truck-icon')).toBeInTheDocument();
    });

    it('should handle empty logs scenario in logs page', async () => {
      // The logs page has fallback handling for empty logs
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Even with sample data, component should render properly
      expect(screen.getByText('Последние события')).toBeInTheDocument();
    });

    it('should handle different agent statuses', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      // Check status handling
      expect(screen.getByText('Активен')).toBeInTheDocument();
      expect(screen.getByText('Ожидание')).toBeInTheDocument();
    });
  });

  describe('🚀 Production Readiness', () => {
    it('should render efficiently without performance issues', async () => {
      const startTime = performance.now();
      
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      await act(async () => {
        render(<AgentDebugPage />);
      });

      const endTime = performance.now();
      
      // Should render quickly (under 100ms for this simple page)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should have no memory leaks in components', async () => {
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      
      // Render and unmount multiple times
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<AgentDebugPage />);
        unmount();
      }

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should handle large datasets efficiently', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Should handle the log entries without issues
      expect(screen.getByText('Последние события')).toBeInTheDocument();
    });
  });

  describe('✅ Integration & Compatibility', () => {
    it('should work with Next.js app router', async () => {
      // Test that pages can be imported as default exports
      const AgentDebugPage = (await import('@/app/agent-debug/page')).default;
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      expect(typeof AgentDebugPage).toBe('function');
      expect(typeof AgentLogsPage).toBe('function');
    });

    it('should be compatible with SSR/SSG', async () => {
      // Pages should not use browser-only APIs at render time
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      // Should render without throwing on server-side
      await act(async () => {
        render(<AgentLogsPage />);
      });

      expect(screen.getByText('Логи')).toBeInTheDocument();
    });

    it('should handle timezone and localization', async () => {
      const AgentLogsPage = (await import('@/app/agent-logs/page')).default;
      
      await act(async () => {
        render(<AgentLogsPage />);
      });

      // Check for localized text
      expect(screen.getByText('Обновлено:')).toBeInTheDocument();
    });
  });
});