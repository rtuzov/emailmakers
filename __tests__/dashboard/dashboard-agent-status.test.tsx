/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '@/app/dashboard/page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Dashboard Agent Status Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Status Display', () => {
    it('should display all four specialist agents', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'idle' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'error' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 650,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check all four specialists are displayed
      expect(screen.getByText('Content Specialist')).toBeInTheDocument();
      expect(screen.getByText('Design Specialist')).toBeInTheDocument();
      expect(screen.getByText('Quality Specialist')).toBeInTheDocument();
      expect(screen.getByText('Delivery Specialist')).toBeInTheDocument();

      // Check icons are displayed
      expect(screen.getByText('📝')).toBeInTheDocument(); // Content
      expect(screen.getByText('🎨')).toBeInTheDocument(); // Design
      expect(screen.getByText('🔍')).toBeInTheDocument(); // Quality
      expect(screen.getByText('🚀')).toBeInTheDocument(); // Delivery
    });

    it('should display correct status indicators for different agent states', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'idle' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'error' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 650,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check status text displays
      const statusTexts = screen.getAllByText(/ACTIVE|IDLE|ERROR/);
      expect(statusTexts.length).toBeGreaterThanOrEqual(4);
      
      // Should have ACTIVE status for content and delivery specialists
      expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
      
      // Should have IDLE status for design specialist
      expect(screen.getByText('IDLE')).toBeInTheDocument();
      
      // Should have ERROR status for quality specialist
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    it('should display agent metrics correctly', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 123,
              successRate: 87,
              averageProcessingTime: 1500,
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 45,
              successRate: 92,
              averageProcessingTime: 2100,
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 78,
              successRate: 95,
              averageProcessingTime: 750,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 56,
              successRate: 89,
              averageProcessingTime: 900,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check specific metrics are displayed
      expect(screen.getByText('123')).toBeInTheDocument(); // Content specialist jobs
      expect(screen.getByText('45')).toBeInTheDocument();  // Design specialist jobs
      expect(screen.getByText('78')).toBeInTheDocument();  // Quality specialist jobs
      expect(screen.getByText('56')).toBeInTheDocument();  // Delivery specialist jobs

      expect(screen.getByText('87%')).toBeInTheDocument(); // Content success rate
      expect(screen.getByText('92%')).toBeInTheDocument(); // Design success rate
      expect(screen.getByText('95%')).toBeInTheDocument(); // Quality success rate
      expect(screen.getByText('89%')).toBeInTheDocument(); // Delivery success rate

      expect(screen.getByText('1500ms')).toBeInTheDocument(); // Content avg time
      expect(screen.getByText('2100ms')).toBeInTheDocument(); // Design avg time
      expect(screen.getByText('750ms')).toBeInTheDocument();  // Quality avg time
      expect(screen.getByText('900ms')).toBeInTheDocument();  // Delivery avg time
    });

    it('should not display agent status when agentMetrics is not provided', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          // No agentMetrics field
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should not display agent status section
      expect(screen.queryByText('Agent Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Content Specialist')).not.toBeInTheDocument();
    });

    it('should display agent status in fallback data when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Network error.*using fallback data/)).toBeInTheDocument();
      });

      // Should show agent status from fallback data
      expect(screen.getByText('Agent Status')).toBeInTheDocument();
      expect(screen.getByText('Content Specialist')).toBeInTheDocument();
      expect(screen.getByText('Design Specialist')).toBeInTheDocument();
      expect(screen.getByText('Quality Specialist')).toBeInTheDocument();
      expect(screen.getByText('Delivery Specialist')).toBeInTheDocument();

      // Should show fallback metrics
      expect(screen.getByText('42')).toBeInTheDocument(); // Content jobs
      expect(screen.getByText('94%')).toBeInTheDocument(); // Content success rate
    });
  });

  describe('Real-time Updates', () => {
    it('should update agent status in real-time', async () => {
      jest.useFakeTimers();

      const initialMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 50,
              successRate: 90,
              averageProcessingTime: 1000,
            },
            designSpecialist: {
              status: 'idle' as const,
              processedJobs: 30,
              successRate: 85,
              averageProcessingTime: 1500,
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 60,
              successRate: 95,
              averageProcessingTime: 800,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 40,
              successRate: 88,
              averageProcessingTime: 600,
            },
          },
        },
      };

      const updatedMetrics = {
        ...initialMetrics,
        metrics: {
          ...initialMetrics.metrics,
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 55, // Updated
              successRate: 92, // Updated
              averageProcessingTime: 950,
            },
            designSpecialist: {
              status: 'active' as const, // Changed from idle to active
              processedJobs: 35, // Updated
              successRate: 87, // Updated
              averageProcessingTime: 1400,
            },
            qualitySpecialist: {
              status: 'error' as const, // Changed from active to error
              processedJobs: 65, // Updated
              successRate: 93, // Updated
              averageProcessingTime: 850,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 45, // Updated
              successRate: 90, // Updated
              averageProcessingTime: 580,
            },
          },
        },
      };

      // First call returns initial metrics
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => initialMetrics,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedMetrics,
        });

      render(<Dashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument(); // Initial content jobs
        expect(screen.getByText('IDLE')).toBeInTheDocument(); // Initial design status
      });

      // Fast-forward 30 seconds to trigger refresh
      jest.advanceTimersByTime(30000);

      // Wait for updated data
      await waitFor(() => {
        expect(screen.getByText('55')).toBeInTheDocument(); // Updated content jobs
        expect(screen.getAllByText('ACTIVE')).toHaveLength(3); // Design changed to active
        expect(screen.getByText('ERROR')).toBeInTheDocument(); // Quality changed to error
      });

      jest.useRealTimers();
    });
  });

  describe('Status Color Coding', () => {
    it('should apply correct CSS classes for different agent statuses', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'idle' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'error' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 650,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check status indicators have correct color classes
      const activeStatuses = screen.getAllByText('ACTIVE');
      activeStatuses.forEach(status => {
        expect(status).toHaveClass('text-green-400');
      });

      const idleStatus = screen.getByText('IDLE');
      expect(idleStatus).toHaveClass('text-yellow-400');

      const errorStatus = screen.getByText('ERROR');
      expect(errorStatus).toHaveClass('text-red-400');
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display processing time in readable format', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1234, // Should display as 1234ms
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 567, // Should display as 567ms
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 89, // Should display as 89ms
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 2100, // Should display as 2100ms
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check processing times are displayed with ms suffix
      expect(screen.getByText('1234ms')).toBeInTheDocument();
      expect(screen.getByText('567ms')).toBeInTheDocument();
      expect(screen.getByText('89ms')).toBeInTheDocument();
      expect(screen.getByText('2100ms')).toBeInTheDocument();
    });

    it('should display success rates as percentages', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 98,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 38,
              successRate: 76,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 56,
              successRate: 100,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 85,
              averageProcessingTime: 650,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check success rates are displayed with % suffix
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('76%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure for agent status', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 2,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 650,
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Agent Status')).toBeInTheDocument();
      });

      // Check heading structure
      const agentStatusHeading = screen.getByRole('heading', { name: 'Agent Status' });
      expect(agentStatusHeading).toBeInTheDocument();
      expect(agentStatusHeading.tagName).toBe('H3');

      // Check that agent names are properly labeled
      expect(screen.getByText('Content Specialist')).toBeInTheDocument();
      expect(screen.getByText('Design Specialist')).toBeInTheDocument();
      expect(screen.getByText('Quality Specialist')).toBeInTheDocument();
      expect(screen.getByText('Delivery Specialist')).toBeInTheDocument();

      // Check that metrics have descriptive labels
      expect(screen.getAllByText('Jobs Processed')).toHaveLength(4);
      expect(screen.getAllByText('Success Rate')).toHaveLength(4);
      expect(screen.getAllByText('Avg Time')).toHaveLength(4);
    });
  });
});