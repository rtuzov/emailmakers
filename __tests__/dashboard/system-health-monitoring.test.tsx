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

describe('Dashboard System Health Monitoring Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Monitoring Display', () => {
    it('should display system health monitoring when data is available', async () => {
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000, // 1 hour
        version: '1.0.0',
        environment: 'development',
        checks: {
          database: {
            status: 'pass',
            message: 'Database connectivity OK',
            duration: 45,
            lastCheck: new Date().toISOString(),
          },
          memory: {
            status: 'pass',
            message: 'Memory usage normal: 128MB',
            details: {
              usageMB: 128,
              limitMB: 512,
              usagePercent: 25,
            },
            lastCheck: new Date().toISOString(),
          },
          performance: {
            status: 'pass',
            message: 'Performance OK: 500ms avg',
            duration: 500,
            lastCheck: new Date().toISOString(),
          },
          externalServices: {
            status: 'pass',
            message: 'All external services OK',
            details: {
              services: [
                { name: 'OpenAI', status: 'pass', duration: 200, required: true },
                { name: 'Anthropic', status: 'pass', duration: 150, required: false },
                { name: 'Figma', status: 'pass', duration: 250, required: false },
              ],
            },
            lastCheck: new Date().toISOString(),
          },
          diskSpace: {
            status: 'pass',
            message: 'Disk space OK: 45% used',
            details: { usagePercent: 45 },
            lastCheck: new Date().toISOString(),
          },
          redis: {
            status: 'pass',
            message: 'Redis connectivity OK',
            duration: 25,
            lastCheck: new Date().toISOString(),
          },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 500,
          errorRate: 0.02,
          memoryUsage: {
            rss: 150 * 1024 * 1024,
            heapTotal: 120 * 1024 * 1024,
            heapUsed: 100 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024,
          },
          cpuUsage: 250000,
          activeConnections: 50,
          systemHealth: 'healthy',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 0,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check overall health status
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();

      // Check system overview stats
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('development')).toBeInTheDocument();

      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();

      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('100MB')).toBeInTheDocument();

      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should display health checks with correct statuses', async () => {
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'production',
        checks: {
          database: {
            status: 'pass',
            message: 'Database connectivity OK',
            duration: 45,
            lastCheck: new Date().toISOString(),
          },
          memory: {
            status: 'warn',
            message: 'Elevated memory usage: 450MB',
            details: { usageMB: 450, limitMB: 512, usagePercent: 88 },
            lastCheck: new Date().toISOString(),
          },
          performance: {
            status: 'fail',
            message: 'Poor performance: 8000ms avg',
            duration: 8000,
            lastCheck: new Date().toISOString(),
          },
          externalServices: {
            status: 'pass',
            message: 'All external services OK',
            lastCheck: new Date().toISOString(),
          },
          diskSpace: {
            status: 'warn',
            message: 'High disk usage: 85% used',
            details: { usagePercent: 85 },
            lastCheck: new Date().toISOString(),
          },
          redis: {
            status: 'pass',
            message: 'Redis connectivity OK',
            duration: 25,
            lastCheck: new Date().toISOString(),
          },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 8000,
          errorRate: 0.15,
          memoryUsage: {
            rss: 500 * 1024 * 1024,
            heapTotal: 480 * 1024 * 1024,
            heapUsed: 450 * 1024 * 1024,
            external: 20 * 1024 * 1024,
            arrayBuffers: 10 * 1024 * 1024,
          },
          cpuUsage: 850000,
          activeConnections: 200,
          systemHealth: 'degraded',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 2,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check degraded health status
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();

      // Check individual health checks
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Database connectivity OK')).toBeInTheDocument();

      expect(screen.getByText('Memory')).toBeInTheDocument();
      expect(screen.getByText('Elevated memory usage: 450MB')).toBeInTheDocument();

      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Poor performance: 8000ms avg')).toBeInTheDocument();

      expect(screen.getByText('External Services')).toBeInTheDocument();
      expect(screen.getByText('Disk Space')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();

      // Check status badges
      const passElements = screen.getAllByText('PASS');
      const warnElements = screen.getAllByText('WARN');
      const failElements = screen.getAllByText('FAIL');

      expect(passElements.length).toBeGreaterThan(0);
      expect(warnElements.length).toBeGreaterThan(0);
      expect(failElements.length).toBeGreaterThan(0);

      // Check response times are displayed
      expect(screen.getByText('Response: 45ms')).toBeInTheDocument();
      expect(screen.getByText('Response: 8000ms')).toBeInTheDocument();
      expect(screen.getByText('Response: 25ms')).toBeInTheDocument();
    });

    it('should display alerts when present', async () => {
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'production',
        checks: {
          database: { status: 'fail', message: 'Database connection failed', lastCheck: new Date().toISOString() },
          memory: { status: 'pass', message: 'Memory OK', lastCheck: new Date().toISOString() },
          performance: { status: 'warn', message: 'Slow performance', lastCheck: new Date().toISOString() },
          externalServices: { status: 'pass', message: 'Services OK', lastCheck: new Date().toISOString() },
          diskSpace: { status: 'pass', message: 'Disk OK', lastCheck: new Date().toISOString() },
          redis: { status: 'pass', message: 'Redis OK', lastCheck: new Date().toISOString() },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 5000,
          errorRate: 0.25,
          memoryUsage: {
            rss: 200 * 1024 * 1024,
            heapTotal: 180 * 1024 * 1024,
            heapUsed: 160 * 1024 * 1024,
            external: 15 * 1024 * 1024,
            arrayBuffers: 8 * 1024 * 1024,
          },
          cpuUsage: 750000,
          activeConnections: 150,
          systemHealth: 'unhealthy',
        },
        alerts: {
          recent: [
            { message: 'Database connection timeout', severity: 'critical', timestamp: new Date().toISOString() },
            { message: 'High memory usage detected', severity: 'high', timestamp: new Date().toISOString() },
            { message: 'External service degraded', severity: 'medium', timestamp: new Date().toISOString() },
          ],
          critical: 2,
          warnings: 3,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check unhealthy status
      expect(screen.getByText('UNHEALTHY')).toBeInTheDocument();

      // Check alerts section
      expect(screen.getByText('🚨 System Alerts')).toBeInTheDocument();
      expect(screen.getByText('2 Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('3 Warnings')).toBeInTheDocument();

      // Check recent alerts
      expect(screen.getByText('Recent Alerts:')).toBeInTheDocument();
      expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
      expect(screen.getByText('External service degraded')).toBeInTheDocument();
    });

    it('should display "All Systems Operational" when no alerts', async () => {
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'production',
        checks: {
          database: { status: 'pass', message: 'Database OK', lastCheck: new Date().toISOString() },
          memory: { status: 'pass', message: 'Memory OK', lastCheck: new Date().toISOString() },
          performance: { status: 'pass', message: 'Performance OK', lastCheck: new Date().toISOString() },
          externalServices: { status: 'pass', message: 'Services OK', lastCheck: new Date().toISOString() },
          diskSpace: { status: 'pass', message: 'Disk OK', lastCheck: new Date().toISOString() },
          redis: { status: 'pass', message: 'Redis OK', lastCheck: new Date().toISOString() },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 500,
          errorRate: 0.01,
          memoryUsage: {
            rss: 150 * 1024 * 1024,
            heapTotal: 120 * 1024 * 1024,
            heapUsed: 100 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024,
          },
          cpuUsage: 200000,
          activeConnections: 30,
          systemHealth: 'healthy',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 0,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check healthy status
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();

      // Check "All Systems Operational" message
      expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
      expect(screen.getByText('No critical issues or warnings detected')).toBeInTheDocument();

      // Should not show alerts section
      expect(screen.queryByText('🚨 System Alerts')).not.toBeInTheDocument();
    });

    it('should not display health monitoring when health data is unavailable', async () => {
      const mockMetricsResponse = {
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
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: false,
            status: 503,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should not display health monitoring section
      expect(screen.queryByText('System Health Monitoring')).not.toBeInTheDocument();
      expect(screen.queryByText('HEALTHY')).not.toBeInTheDocument();
      expect(screen.queryByText('Database')).not.toBeInTheDocument();
    });
  });

  describe('Health Check Icons and Formatting', () => {
    it('should display correct icons for each health check category', async () => {
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'development',
        checks: {
          database: { status: 'pass', message: 'Database OK', lastCheck: new Date().toISOString() },
          memory: { status: 'pass', message: 'Memory OK', lastCheck: new Date().toISOString() },
          performance: { status: 'pass', message: 'Performance OK', lastCheck: new Date().toISOString() },
          externalServices: { status: 'pass', message: 'Services OK', lastCheck: new Date().toISOString() },
          diskSpace: { status: 'pass', message: 'Disk OK', lastCheck: new Date().toISOString() },
          redis: { status: 'pass', message: 'Redis OK', lastCheck: new Date().toISOString() },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 500,
          errorRate: 0.01,
          memoryUsage: {
            rss: 150 * 1024 * 1024,
            heapTotal: 120 * 1024 * 1024,
            heapUsed: 100 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024,
          },
          cpuUsage: 200000,
          activeConnections: 30,
          systemHealth: 'healthy',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 0,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check health check categories are displayed
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('External Services')).toBeInTheDocument();
      expect(screen.getByText('Disk Space')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();

      // Check all health checks show PASS status
      const passElements = screen.getAllByText('PASS');
      expect(passElements.length).toBe(6);
    });

    it('should format last check timestamps correctly', async () => {
      const lastCheckTime = new Date('2023-12-25T12:00:00Z');
      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'development',
        checks: {
          database: { 
            status: 'pass', 
            message: 'Database OK', 
            duration: 50,
            lastCheck: lastCheckTime.toISOString(),
          },
          memory: { status: 'pass', message: 'Memory OK', lastCheck: lastCheckTime.toISOString() },
          performance: { status: 'pass', message: 'Performance OK', lastCheck: lastCheckTime.toISOString() },
          externalServices: { status: 'pass', message: 'Services OK', lastCheck: lastCheckTime.toISOString() },
          diskSpace: { status: 'pass', message: 'Disk OK', lastCheck: lastCheckTime.toISOString() },
          redis: { status: 'pass', message: 'Redis OK', lastCheck: lastCheckTime.toISOString() },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 500,
          errorRate: 0.01,
          memoryUsage: {
            rss: 150 * 1024 * 1024,
            heapTotal: 120 * 1024 * 1024,
            heapUsed: 100 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024,
          },
          cpuUsage: 200000,
          activeConnections: 30,
          systemHealth: 'healthy',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 0,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Check response time is displayed
      expect(screen.getByText('Response: 50ms')).toBeInTheDocument();

      // Check that timestamps are formatted as locale time
      const lastElements = screen.getAllByText(/Last:/);
      expect(lastElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics success but health API failure gracefully', async () => {
      const mockMetricsResponse = {
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
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.reject(new Error('Health API unavailable'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should display main dashboard content
      expect(screen.getByText('Templates Created')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();

      // Should not display health monitoring section
      expect(screen.queryByText('System Health Monitoring')).not.toBeInTheDocument();
    });

    it('should handle both metrics and health API failures with fallback', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Network error.*using fallback data/)).toBeInTheDocument();
      });

      // Should display main dashboard content with fallback data
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Templates Created')).toBeInTheDocument();

      // Should not display health monitoring section
      expect(screen.queryByText('System Health Monitoring')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh health data every 30 seconds', async () => {
      jest.useFakeTimers();

      const mockMetricsResponse = {
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
        },
      };

      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600000,
        version: '1.0.0',
        environment: 'development',
        checks: {
          database: { status: 'pass', message: 'Database OK', lastCheck: new Date().toISOString() },
          memory: { status: 'pass', message: 'Memory OK', lastCheck: new Date().toISOString() },
          performance: { status: 'pass', message: 'Performance OK', lastCheck: new Date().toISOString() },
          externalServices: { status: 'pass', message: 'Services OK', lastCheck: new Date().toISOString() },
          diskSpace: { status: 'pass', message: 'Disk OK', lastCheck: new Date().toISOString() },
          redis: { status: 'pass', message: 'Redis OK', lastCheck: new Date().toISOString() },
        },
        metrics: {
          requestCount: 1500,
          averageResponseTime: 500,
          errorRate: 0.01,
          memoryUsage: {
            rss: 150 * 1024 * 1024,
            heapTotal: 120 * 1024 * 1024,
            heapUsed: 100 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024,
          },
          cpuUsage: 200000,
          activeConnections: 30,
          systemHealth: 'healthy',
        },
        alerts: {
          recent: [],
          critical: 0,
          warnings: 0,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/metrics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetricsResponse,
          });
        }
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHealthResponse,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health Monitoring')).toBeInTheDocument();
      });

      // Initial fetch should have been called
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Advance timer by 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        // Should have been called again (2 initial + 2 refresh = 4 total)
        expect(global.fetch).toHaveBeenCalledTimes(4);
      });

      jest.useRealTimers();
    });
  });
});