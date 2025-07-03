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

describe('Dashboard Metrics Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration', () => {
    it('should fetch and display metrics from /api/metrics/dashboard', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1247,
            successRate: 92,
            activeAgents: 5,
            totalRequests: 2543,
            averageResponseTime: 850,
            errorRate: 3,
            uptime: 86400000, // 1 day in ms
          },
          recent: {
            generatedTemplates: 15,
            failedRequests: 2,
            averageQualityScore: 89,
            totalUsers: 234,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      // Wait for API call and data to load
      await waitFor(() => {
        expect(screen.getByText('1.2k')).toBeInTheDocument(); // formatted template count
      });

      // Check all stat cards are populated with real data
      expect(screen.getByText('92%')).toBeInTheDocument(); // success rate
      expect(screen.getByText('5')).toBeInTheDocument(); // active agents
      expect(screen.getByText('1d 0h')).toBeInTheDocument(); // uptime

      // Check recent metrics
      expect(screen.getByText('15')).toBeInTheDocument(); // recent templates
      expect(screen.getByText('89%')).toBeInTheDocument(); // quality score
      expect(screen.getByText('234')).toBeInTheDocument(); // total users

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith('/api/metrics/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
    });

    it('should handle API errors gracefully with fallback data', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Dashboard />);

      // Wait for error handling and fallback data
      await waitFor(() => {
        expect(screen.getByText(/Network error.*using fallback data/)).toBeInTheDocument();
      });

      // Should still show fallback data
      expect(screen.getByText('127')).toBeInTheDocument(); // fallback template count
      expect(screen.getByText('92%')).toBeInTheDocument(); // fallback success rate
      expect(screen.getByText('4')).toBeInTheDocument(); // fallback active agents
    });

    it('should handle API response errors', async () => {
      const errorResponse = {
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => errorResponse,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Database connection failed.*using fallback data/)).toBeInTheDocument();
      });

      // Should show fallback data when API returns error
      expect(screen.getByText('127')).toBeInTheDocument();
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch metrics: 500.*using fallback data/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh metrics every 30 seconds', async () => {
      jest.useFakeTimers();

      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1247,
            successRate: 92,
            activeAgents: 5,
            totalRequests: 2543,
            averageResponseTime: 850,
            errorRate: 3,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 15,
            failedRequests: 2,
            averageQualityScore: 89,
            totalUsers: 234,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      // Initial call
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      // Should have made second call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('should show updating indicator during refresh', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1247,
            successRate: 92,
            activeAgents: 5,
            totalRequests: 2543,
            averageResponseTime: 850,
            errorRate: 3,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 15,
            failedRequests: 2,
            averageQualityScore: 89,
            totalUsers: 234,
          },
        },
      };

      // First call resolves, second call is pending
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetrics,
        })
        .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<Dashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('1.2k')).toBeInTheDocument();
      });

      // Manually trigger refresh by calling the useEffect again
      // In a real scenario, this would be triggered by the interval
      jest.useFakeTimers();
      jest.advanceTimersByTime(30000);

      // Should show updating indicator
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers correctly', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 5432,
            successRate: 94,
            activeAgents: 7,
            totalRequests: 15432,
            averageResponseTime: 1250,
            errorRate: 2,
            uptime: 172800000, // 2 days
          },
          recent: {
            generatedTemplates: 23,
            failedRequests: 1,
            averageQualityScore: 91,
            totalUsers: 1543,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        // Should format large numbers with 'k' suffix
        expect(screen.getByText('5.4k')).toBeInTheDocument(); // template count
        expect(screen.getByText('2d 0h')).toBeInTheDocument(); // uptime
        expect(screen.getByText('1.5k')).toBeInTheDocument(); // total users
        expect(screen.getByText('15.4k')).toBeInTheDocument(); // total requests
      });
    });

    it('should format uptime correctly for different durations', async () => {
      const testCases = [
        { uptime: 3600000, expected: '1h' }, // 1 hour
        { uptime: 7200000, expected: '2h' }, // 2 hours
        { uptime: 90000000, expected: '1d 1h' }, // 1 day 1 hour
        { uptime: 604800000, expected: '7d 0h' }, // 7 days
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockMetrics = {
          success: true,
          timestamp: new Date().toISOString(),
          metrics: {
            systemStats: {
              templateCount: 100,
              successRate: 95,
              activeAgents: 4,
              totalRequests: 1000,
              averageResponseTime: 800,
              errorRate: 1,
              uptime: testCase.uptime,
            },
            recent: {
              generatedTemplates: 5,
              failedRequests: 0,
              averageQualityScore: 88,
              totalUsers: 50,
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockMetrics,
        });

        const { unmount } = render(<Dashboard />);

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('System Status Indicators', () => {
    it('should show operational status when no errors', async () => {
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
            errorRate: 1,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0,
            averageQualityScore: 90,
            totalUsers: 100,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Operational')).toBeInTheDocument();
        expect(screen.getByText('800ms')).toBeInTheDocument(); // response time
      });
    });

    it('should show degraded status when there are errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Degraded')).toBeInTheDocument();
      });
    });

    it('should conditionally show failed requests warning', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 1000,
            successRate: 88,
            activeAgents: 4,
            totalRequests: 2000,
            averageResponseTime: 800,
            errorRate: 5,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 3, // Has failed requests
            averageQualityScore: 85,
            totalUsers: 100,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed Requests')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Requires attention')).toBeInTheDocument();
      });
    });

    it('should not show failed requests section when no failures', async () => {
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
            errorRate: 1,
            uptime: 86400000,
          },
          recent: {
            generatedTemplates: 10,
            failedRequests: 0, // No failed requests
            averageQualityScore: 90,
            totalUsers: 100,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // recent templates
      });

      // Should not show failed requests section
      expect(screen.queryByText('Failed Requests')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton on initial load', () => {
      // Never resolve the promise to keep in loading state
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<Dashboard />);

      // Should show animated loading skeletons
      expect(screen.getAllByText('Dashboard')).toHaveLength(1);
      
      // Should show loading placeholders instead of metrics
      const loadingPlaceholders = document.querySelectorAll('.animate-pulse');
      expect(loadingPlaceholders.length).toBeGreaterThan(0);
    });

    it('should replace loading state with actual data', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 500,
            successRate: 90,
            activeAgents: 3,
            totalRequests: 1000,
            averageResponseTime: 900,
            errorRate: 2,
            uptime: 43200000,
          },
          recent: {
            generatedTemplates: 8,
            failedRequests: 1,
            averageQualityScore: 87,
            totalUsers: 75,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      // Initially should show loading
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      // After loading, should show actual data
      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Loading skeletons should be gone
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0);
    });
  });

  describe('Quick Actions Navigation', () => {
    it('should have proper navigation links', async () => {
      const mockMetrics = {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          systemStats: {
            templateCount: 100,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 500,
            averageResponseTime: 700,
            errorRate: 1,
            uptime: 21600000,
          },
          recent: {
            generatedTemplates: 5,
            failedRequests: 0,
            averageQualityScore: 92,
            totalUsers: 25,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });

      // Check all quick action links
      const createLink = screen.getByRole('link', { name: /Create New Template/i });
      const browseLink = screen.getByRole('link', { name: /Browse Templates/i });
      const analyticsLink = screen.getByRole('link', { name: /View Analytics/i });
      const debugLink = screen.getByRole('link', { name: /Debug Tools/i });

      expect(createLink).toHaveAttribute('href', '/create');
      expect(browseLink).toHaveAttribute('href', '/templates');
      expect(analyticsLink).toHaveAttribute('href', '/optimization-dashboard');
      expect(debugLink).toHaveAttribute('href', '/agent-debug');
    });
  });
});