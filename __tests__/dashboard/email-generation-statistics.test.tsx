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

describe('Dashboard Email Generation Statistics Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Generation Statistics Display', () => {
    it('should display email generation statistics when available', async () => {
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
          emailGeneration: {
            daily: {
              total: 25,
              successful: 23,
              failed: 2,
              averageTime: 1200,
            },
            weekly: {
              total: 180,
              successful: 165,
              failed: 15,
              averageTime: 1350,
            },
            monthly: {
              total: 750,
              successful: 695,
              failed: 55,
              averageTime: 1420,
            },
            topCategories: [
              { category: 'Marketing', count: 45, successRate: 89 },
              { category: 'Newsletter', count: 32, successRate: 94 },
              { category: 'Transactional', count: 28, successRate: 97 },
            ],
            timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              count: Math.floor(Math.random() * 10) + 2,
            })),
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      });

      // Check period statistics headings
      expect(screen.getByText('📅 Daily')).toBeInTheDocument();
      expect(screen.getByText('📊 Weekly')).toBeInTheDocument();
      expect(screen.getByText('📈 Monthly')).toBeInTheDocument();

      // Check daily statistics
      expect(screen.getByText('25')).toBeInTheDocument(); // Daily total
      expect(screen.getByText('✅ 23 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 2 failed')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 1200ms avg')).toBeInTheDocument();

      // Check weekly statistics
      expect(screen.getByText('180')).toBeInTheDocument(); // Weekly total
      expect(screen.getByText('✅ 165 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 15 failed')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 1350ms avg')).toBeInTheDocument();

      // Check monthly statistics
      expect(screen.getByText('750')).toBeInTheDocument(); // Monthly total
      expect(screen.getByText('✅ 695 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 55 failed')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 1420ms avg')).toBeInTheDocument();
    });

    it('should display top categories correctly', async () => {
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
          emailGeneration: {
            daily: { total: 25, successful: 23, failed: 2, averageTime: 1200 },
            weekly: { total: 180, successful: 165, failed: 15, averageTime: 1350 },
            monthly: { total: 750, successful: 695, failed: 55, averageTime: 1420 },
            topCategories: [
              { category: 'Marketing', count: 45, successRate: 89 },
              { category: 'Newsletter', count: 32, successRate: 94 },
              { category: 'Transactional', count: 28, successRate: 97 },
              { category: 'Promotional', count: 15, successRate: 85 },
              { category: 'Notification', count: 8, successRate: 92 },
            ],
            timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              count: 5,
            })),
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('🏷️ Top Categories')).toBeInTheDocument();
      });

      // Check category rankings
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();

      // Check category names
      expect(screen.getByText('Marketing')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
      expect(screen.getByText('Transactional')).toBeInTheDocument();
      expect(screen.getByText('Promotional')).toBeInTheDocument();
      expect(screen.getByText('Notification')).toBeInTheDocument();

      // Check category metrics
      expect(screen.getByText('45 emails')).toBeInTheDocument();
      expect(screen.getByText('89% success')).toBeInTheDocument();
      expect(screen.getByText('32 emails')).toBeInTheDocument();
      expect(screen.getByText('94% success')).toBeInTheDocument();
    });

    it('should display 24-hour distribution chart', async () => {
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
          emailGeneration: {
            daily: { total: 25, successful: 23, failed: 2, averageTime: 1200 },
            weekly: { total: 180, successful: 165, failed: 15, averageTime: 1350 },
            monthly: { total: 750, successful: 695, failed: 55, averageTime: 1420 },
            topCategories: [
              { category: 'Marketing', count: 45, successRate: 89 },
            ],
            timeDistribution: Array.from({ length: 24 }, (_, hour) => {
              // Set specific values for key hours, defaults for others
              if (hour === 0) return { hour, count: 5 };
              if (hour === 1) return { hour, count: 3 };
              if (hour === 8) return { hour, count: 15 }; // Peak hour
              if (hour === 12) return { hour, count: 12 };
              if (hour === 18) return { hour, count: 8 };
              return { hour, count: 4 };
            }),
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('🕒 24-Hour Distribution')).toBeInTheDocument();
      });

      // Check time labels are displayed (should show hours in 24-hour format)
      expect(screen.getByText('00')).toBeInTheDocument();
      expect(screen.getByText('08')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('should not display email generation statistics when not available', async () => {
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
          // No emailGeneration field
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

      // Should not display email generation statistics section
      expect(screen.queryByText('Email Generation Statistics')).not.toBeInTheDocument();
      expect(screen.queryByText('📅 Daily')).not.toBeInTheDocument();
      expect(screen.queryByText('🏷️ Top Categories')).not.toBeInTheDocument();
    });

    it('should display email generation statistics in fallback data when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Network error.*using fallback data/)).toBeInTheDocument();
      });

      // Should show email generation statistics from fallback data
      expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      expect(screen.getByText('📅 Daily')).toBeInTheDocument();
      expect(screen.getByText('📊 Weekly')).toBeInTheDocument();
      expect(screen.getByText('📈 Monthly')).toBeInTheDocument();
      expect(screen.getByText('🏷️ Top Categories')).toBeInTheDocument();

      // Check fallback data values - look for specific structures to avoid conflicts
      const dailySection = screen.getByText('📅 Daily').closest('div');
      expect(dailySection).toContainHTML('12'); // Daily total within daily section
      
      const weeklySection = screen.getByText('📊 Weekly').closest('div');
      expect(weeklySection).toContainHTML('85'); // Weekly total within weekly section
      
      const monthlySection = screen.getByText('📈 Monthly').closest('div');
      expect(monthlySection).toContainHTML('342'); // Monthly total within monthly section
    });
  });

  describe('Period Statistics Validation', () => {
    it('should display correct success/failure ratios', async () => {
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
          emailGeneration: {
            daily: {
              total: 50,
              successful: 47,
              failed: 3,
              averageTime: 1100,
            },
            weekly: {
              total: 320,
              successful: 304,
              failed: 16,
              averageTime: 1250,
            },
            monthly: {
              total: 1400,
              successful: 1330,
              failed: 70,
              averageTime: 1380,
            },
            topCategories: [],
            timeDistribution: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      });

      // Verify totals add up correctly
      expect(screen.getByText('50')).toBeInTheDocument(); // Daily total
      expect(screen.getByText('✅ 47 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 3 failed')).toBeInTheDocument();

      expect(screen.getByText('320')).toBeInTheDocument(); // Weekly total
      expect(screen.getByText('✅ 304 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 16 failed')).toBeInTheDocument();

      expect(screen.getByText('1400')).toBeInTheDocument(); // Monthly total
      expect(screen.getByText('✅ 1330 successful')).toBeInTheDocument();
      expect(screen.getByText('❌ 70 failed')).toBeInTheDocument();
    });

    it('should format processing times correctly', async () => {
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
          emailGeneration: {
            daily: { total: 20, successful: 19, failed: 1, averageTime: 987 },
            weekly: { total: 140, successful: 133, failed: 7, averageTime: 1543 },
            monthly: { total: 600, successful: 570, failed: 30, averageTime: 2100 },
            topCategories: [],
            timeDistribution: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      });

      // Check processing times are displayed with ms suffix
      expect(screen.getByText('⏱️ 987ms avg')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 1543ms avg')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 2100ms avg')).toBeInTheDocument();
    });
  });

  describe('Visual Components', () => {
    it('should apply correct CSS classes for period statistics', async () => {
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
          emailGeneration: {
            daily: { total: 25, successful: 23, failed: 2, averageTime: 1200 },
            weekly: { total: 180, successful: 165, failed: 15, averageTime: 1350 },
            monthly: { total: 750, successful: 695, failed: 55, averageTime: 1420 },
            topCategories: [],
            timeDistribution: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      });

      // Check color classes for different periods
      const dailyTotal = screen.getByText('25');
      expect(dailyTotal).toHaveClass('text-green-400');

      const weeklyTotal = screen.getByText('180');
      expect(weeklyTotal).toHaveClass('text-blue-400');

      const monthlyTotal = screen.getByText('750');
      expect(monthlyTotal).toHaveClass('text-purple-400');
    });

    it('should render chart bars with correct styling', async () => {
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
          emailGeneration: {
            daily: { total: 25, successful: 23, failed: 2, averageTime: 1200 },
            weekly: { total: 180, successful: 165, failed: 15, averageTime: 1350 },
            monthly: { total: 750, successful: 695, failed: 55, averageTime: 1420 },
            topCategories: [],
            timeDistribution: [
              { hour: 0, count: 5 },
              { hour: 1, count: 10 },
              { hour: 2, count: 3 },
            ],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('🕒 24-Hour Distribution')).toBeInTheDocument();
      });

      // Check that chart bars are rendered with gradient styling
      const chartBars = document.querySelectorAll('.bg-gradient-to-t');
      expect(chartBars.length).toBeGreaterThan(0);

      // Check gradient classes are applied
      chartBars.forEach(bar => {
        expect(bar).toHaveClass('bg-gradient-to-t', 'from-blue-400', 'to-green-400');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure for email generation statistics', async () => {
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
          emailGeneration: {
            daily: { total: 25, successful: 23, failed: 2, averageTime: 1200 },
            weekly: { total: 180, successful: 165, failed: 15, averageTime: 1350 },
            monthly: { total: 750, successful: 695, failed: 55, averageTime: 1420 },
            topCategories: [
              { category: 'Marketing', count: 45, successRate: 89 },
            ],
            timeDistribution: [
              { hour: 0, count: 5 },
              { hour: 8, count: 15 },
            ],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetrics,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Email Generation Statistics')).toBeInTheDocument();
      });

      // Check heading structure
      const emailStatsHeading = screen.getByRole('heading', { name: 'Email Generation Statistics' });
      expect(emailStatsHeading).toBeInTheDocument();
      expect(emailStatsHeading.tagName).toBe('H3');

      // Check period headings
      expect(screen.getByText('📅 Daily')).toBeInTheDocument();
      expect(screen.getByText('📊 Weekly')).toBeInTheDocument();
      expect(screen.getByText('📈 Monthly')).toBeInTheDocument();

      // Check section headings
      expect(screen.getByText('🏷️ Top Categories')).toBeInTheDocument();
      expect(screen.getByText('🕒 24-Hour Distribution')).toBeInTheDocument();

      // Check that chart bars have title attributes for tooltips
      const hourDistribution = screen.getByText('🕒 24-Hour Distribution').closest('div');
      if (hourDistribution) {
        const chartBars = hourDistribution.querySelectorAll('[title*="emails"]');
        expect(chartBars.length).toBeGreaterThan(0);
      }
    });
  });
});