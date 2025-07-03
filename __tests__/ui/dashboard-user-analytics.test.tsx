/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardContent from '@/app/dashboard/dashboard-content';

// Mock fetch function for API calls
global.fetch = jest.fn();

const mockUserAnalytics = {
  overview: {
    totalUsers: 156,
    activeUsers: 89,
    newUsersToday: 3,
    newUsersThisWeek: 12,
    newUsersThisMonth: 28,
    userGrowthRate: 15,
  },
  activity: {
    dailyActiveUsers: 42,
    weeklyActiveUsers: 89,
    monthlyActiveUsers: 134,
    averageSessionDuration: 32,
    totalSessions: 1247,
    averageSessionsPerUser: 8.2,
  },
  engagement: {
    templatesPerUser: 2.4,
    activeCreators: 67,
    topUsersBy: {
      templates: [
        {
          userId: 'user1',
          email: 'john.doe@example.com',
          templateCount: 15,
          lastActive: '2024-01-15T10:30:00Z',
        },
        {
          userId: 'user2',
          email: 'jane.smith@example.com',
          templateCount: 12,
          lastActive: '2024-01-14T16:45:00Z',
        },
      ],
      activity: [
        {
          userId: 'user3',
          email: 'active.user@example.com',
          sessionCount: 45,
          lastSession: '2024-01-15T12:00:00Z',
        },
      ],
    },
    userRetention: {
      day1: 78,
      day7: 52,
      day30: 31,
    },
  },
  demographics: {
    roleDistribution: [
      { role: 'user', count: 142, percentage: 91 },
      { role: 'admin', count: 8, percentage: 5 },
      { role: 'moderator', count: 6, percentage: 4 },
    ],
    registrationTrends: [
      { period: '2024-01', count: 23 },
      { period: '2024-02', count: 18 },
      { period: '2024-03', count: 25 },
      { period: '2024-04', count: 31 },
      { period: '2024-05', count: 28 },
      { period: '2024-06', count: 22 },
    ],
    verificationStatus: {
      verified: 134,
      unverified: 22,
      verificationRate: 86,
    },
  },
  usage: {
    apiKeysConfigured: 89,
    servicesUsed: [
      { service: 'openai', userCount: 76 },
      { service: 'figma', userCount: 42 },
      { service: 'litmus', userCount: 23 },
    ],
    contentBriefsCreated: 324,
    averageContentBriefsPerUser: 2.1,
  },
  timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    activeUsers: Math.floor(Math.random() * 25) + 5,
    templatesCreated: Math.floor(Math.random() * 12) + 1,
  })),
};

const mockDashboardMetrics = {
  systemStats: {
    templateCount: 127,
    successRate: 95,
    activeAgents: 8,
    totalRequests: 1500,
    averageResponseTime: 850,
    errorRate: 3,
    uptime: 86400000,
  },
  recent: {
    generatedTemplates: 12,
    failedRequests: 2,
    averageQualityScore: 89,
    totalUsers: 156,
  },
  userAnalytics: mockUserAnalytics,
};

describe('Dashboard User Analytics UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/metrics/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            metrics: mockDashboardMetrics,
            timestamp: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: 86400,
            version: '1.0.0',
            environment: 'test',
            checks: {
              database: { status: 'pass', message: 'OK' },
              memory: { status: 'pass', message: 'OK' },
              performance: { status: 'pass', message: 'OK' },
              externalServices: { status: 'pass', message: 'OK' },
              diskSpace: { status: 'pass', message: 'OK' },
              redis: { status: 'pass', message: 'OK' },
            },
            metrics: {
              requestCount: 1500,
              averageResponseTime: 850,
              errorRate: 0.03,
              memoryUsage: {
                heapUsed: 157286400,
                heapTotal: 268435456,
                external: 1024000,
                arrayBuffers: 512000,
              },
              cpuUsage: 25,
              activeConnections: 45,
              systemHealth: 'healthy',
            },
            alerts: { recent: [], critical: 0, warnings: 0 },
          }),
        });
      }
      if (url.includes('/api/analytics/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            analytics: mockUserAnalytics,
            timestamp: new Date().toISOString(),
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('User Analytics Section Rendering', () => {
    it('should render user analytics section when data is available', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('👥 User Analytics')).toBeInTheDocument();
      });
    });

    it('should display user overview statistics correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        // Check Total Users section
        expect(screen.getByText('📊 Total Users')).toBeInTheDocument();
        expect(screen.getByText('156')).toBeInTheDocument();
        expect(screen.getByText('89 active users')).toBeInTheDocument();

        // Check Growth Rate section
        expect(screen.getByText('📈 Growth Rate')).toBeInTheDocument();
        expect(screen.getByText('+15%')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toBeInTheDocument();

        // Check Active Today section
        expect(screen.getByText('🎯 Active Today')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('3 new today')).toBeInTheDocument();

        // Check Average Session section
        expect(screen.getByText('⏱️ Avg Session')).toBeInTheDocument();
        expect(screen.getByText('32m')).toBeInTheDocument();
        expect(screen.getByText('8.2 sessions/user')).toBeInTheDocument();
      });
    });

    it('should display user activity metrics correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('📱 User Activity')).toBeInTheDocument();
        expect(screen.getByText('Daily Active Users')).toBeInTheDocument();
        expect(screen.getByText('Weekly Active Users')).toBeInTheDocument();
        expect(screen.getByText('Monthly Active Users')).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('1,247')).toBeInTheDocument(); // Formatted number
      });
    });

    it('should display user engagement metrics correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('💡 User Engagement')).toBeInTheDocument();
        expect(screen.getByText('Templates per User')).toBeInTheDocument();
        expect(screen.getByText('2.4')).toBeInTheDocument();
        expect(screen.getByText('Active Creators')).toBeInTheDocument();
        expect(screen.getByText('67')).toBeInTheDocument();
        expect(screen.getByText('7-day Retention')).toBeInTheDocument();
        expect(screen.getByText('52%')).toBeInTheDocument();
        expect(screen.getByText('30-day Retention')).toBeInTheDocument();
        expect(screen.getByText('31%')).toBeInTheDocument();
      });
    });

    it('should display top template creators when data is available', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('🏆 Top Template Creators')).toBeInTheDocument();
        expect(screen.getByText('john.doe')).toBeInTheDocument(); // Username part of email
        expect(screen.getByText('jane.smith')).toBeInTheDocument();
        expect(screen.getByText('15 templates')).toBeInTheDocument();
        expect(screen.getByText('12 templates')).toBeInTheDocument();
      });
    });

    it('should display role distribution correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('👤 Role Distribution')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument(); // Capitalized
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Moderator')).toBeInTheDocument();
        expect(screen.getByText('142')).toBeInTheDocument();
        expect(screen.getByText('(91%)')).toBeInTheDocument();
        expect(screen.getByText('Email Verification Rate')).toBeInTheDocument();
        expect(screen.getByText('86%')).toBeInTheDocument();
      });
    });

    it('should display service usage statistics correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('🔧 Service Usage')).toBeInTheDocument();
        expect(screen.getByText('API Keys Configured')).toBeInTheDocument();
        expect(screen.getByText('89')).toBeInTheDocument();
        expect(screen.getByText('Openai')).toBeInTheDocument(); // Capitalized
        expect(screen.getByText('76 users')).toBeInTheDocument();
        expect(screen.getByText('Figma')).toBeInTheDocument();
        expect(screen.getByText('42 users')).toBeInTheDocument();
        expect(screen.getByText('Content Briefs')).toBeInTheDocument();
        expect(screen.getByText('324')).toBeInTheDocument();
      });
    });

    it('should display registration trends with visual progress bars', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('📅 Registration Trends')).toBeInTheDocument();
        expect(screen.getByText('2024-01')).toBeInTheDocument();
        expect(screen.getByText('2024-06')).toBeInTheDocument();
        expect(screen.getByText('23')).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
        
        // Check that progress bars are rendered
        const progressBars = document.querySelectorAll('.bg-blue-400.h-2.rounded-full');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should handle negative growth rate correctly', async () => {
      const mockNegativeGrowth = {
        ...mockDashboardMetrics,
        userAnalytics: {
          ...mockUserAnalytics,
          overview: {
            ...mockUserAnalytics.overview,
            userGrowthRate: -5,
          },
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: mockNegativeGrowth,
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.getByText('-5%')).toBeInTheDocument();
      });
    });
  });

  describe('User Analytics Data Loading States', () => {
    it('should not display user analytics section when data is not available', async () => {
      const mockMetricsWithoutAnalytics = {
        ...mockDashboardMetrics,
        userAnalytics: undefined,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: mockMetricsWithoutAnalytics,
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.queryByText('👥 User Analytics')).not.toBeInTheDocument();
      });
    });

    it('should handle empty top users list gracefully', async () => {
      const mockEmptyTopUsers = {
        ...mockDashboardMetrics,
        userAnalytics: {
          ...mockUserAnalytics,
          engagement: {
            ...mockUserAnalytics.engagement,
            topUsersBy: {
              templates: [],
              activity: [],
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: mockEmptyTopUsers,
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(screen.queryByText('🏆 Top Template Creators')).not.toBeInTheDocument();
      });
    });

    it('should handle API failure gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/analytics/users')) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: {
                systemStats: mockDashboardMetrics.systemStats,
                recent: mockDashboardMetrics.recent,
                // No userAnalytics due to API failure
              },
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        // Dashboard should still render without user analytics
        expect(screen.getByText('Templates Created')).toBeInTheDocument();
        expect(screen.queryByText('👥 User Analytics')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Analytics Visual Elements', () => {
    it('should render progress bars with correct styling', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        const progressBars = document.querySelectorAll('.bg-blue-400.h-2.rounded-full.transition-all.duration-300');
        expect(progressBars.length).toBeGreaterThan(0);
        
        // Check that progress bars have width styles
        progressBars.forEach((bar) => {
          const style = (bar as HTMLElement).style;
          expect(style.width).toMatch(/^\d+(\.\d+)?%$/);
        });
      });
    });

    it('should display formatted numbers correctly', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        // Should format large numbers (1,247 for total sessions)
        expect(screen.getByText('1,247')).toBeInTheDocument();
        // Should display regular numbers as-is
        expect(screen.getByText('156')).toBeInTheDocument();
      });
    });

    it('should truncate long email addresses correctly', async () => {
      const mockLongEmail = {
        ...mockDashboardMetrics,
        userAnalytics: {
          ...mockUserAnalytics,
          engagement: {
            ...mockUserAnalytics.engagement,
            topUsersBy: {
              templates: [
                {
                  userId: 'user1',
                  email: 'very.long.email.address.that.should.be.truncated@example.com',
                  templateCount: 15,
                  lastActive: '2024-01-15T10:30:00Z',
                },
              ],
              activity: [],
            },
          },
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: mockLongEmail,
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        // Should show truncated username
        expect(screen.getByText('very.long.email.address.that.should.be.truncated')).toBeInTheDocument();
        
        // Check that the element has the truncation class
        const truncatedElement = screen.getByText('very.long.email.address.that.should.be.truncated');
        expect(truncatedElement).toHaveClass('truncate');
        expect(truncatedElement).toHaveClass('max-w-[150px]');
      });
    });
  });

  describe('User Analytics API Integration', () => {
    it('should call the user analytics API endpoint', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
      });
    });

    it('should call all three APIs in parallel', async () => {
      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenCalledWith('/api/metrics/dashboard', expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/users', expect.any(Object));
      });
    });

    it('should handle partial API failures', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        callCount++;
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              metrics: {
                systemStats: mockDashboardMetrics.systemStats,
                recent: mockDashboardMetrics.recent,
              },
              timestamp: new Date().toISOString(),
            }),
          });
        }
        // Fail other APIs
        return Promise.resolve({ ok: false });
      });

      await act(async () => {
        render(<DashboardContent />);
      });

      await waitFor(() => {
        // Should still render main dashboard content
        expect(screen.getByText('Templates Created')).toBeInTheDocument();
        expect(screen.getByText('127')).toBeInTheDocument();
        
        // Should not render user analytics
        expect(screen.queryByText('👥 User Analytics')).not.toBeInTheDocument();
      });
    });
  });
});