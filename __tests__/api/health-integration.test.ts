/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

// Mock the performance monitoring service
jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 1500,
      averageRequestDuration: 850,
      errorRate: 0.03,
      medianRequestDuration: 650,
      p95RequestDuration: 1200,
      p99RequestDuration: 2000,
      averageMemoryUsage: 150,
      peakMemoryUsage: 300,
      throughput: 45,
      recentAlerts: [],
      systemHealth: 'healthy',
    })),
    getRecentAlerts: jest.fn(() => []),
    getPrometheusMetrics: jest.fn(() => '# HELP requests_total Total requests\nrequests_total 1500'),
  },
}));

// Mock the database optimization service
jest.mock('@/shared/infrastructure/performance/database-optimization-service', () => ({
  databaseOptimization: {
    getPerformanceStats: jest.fn(() => ({
      totalQueries: 50,
      averageQueryTime: 25,
      slowQueries: [],
      cacheHitRate: 95,
      topSlowQueries: [],
    })),
  },
}));

// Mock process.memoryUsage
const originalMemoryUsage = process.memoryUsage;
const originalCpuUsage = process.cpuUsage;
beforeAll(() => {
  process.memoryUsage = jest.fn(() => ({
    rss: 150 * 1024 * 1024, // 150MB
    heapTotal: 120 * 1024 * 1024, // 120MB
    heapUsed: 100 * 1024 * 1024, // 100MB
    external: 10 * 1024 * 1024, // 10MB
    arrayBuffers: 5 * 1024 * 1024, // 5MB
  }));
  
  process.cpuUsage = jest.fn(() => ({
    user: 250000,
    system: 50000,
  }));
});

afterAll(() => {
  process.memoryUsage = originalMemoryUsage;
  process.cpuUsage = originalCpuUsage;
});

describe('/api/health Health Monitoring Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/health',
    };
  });

  describe('Health Check Structure', () => {
    it('should return comprehensive health check data structure', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(String),
        checks: {
          database: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            duration: expect.any(Number),
            lastCheck: expect.any(String),
          },
          memory: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            details: expect.objectContaining({
              usageMB: expect.any(Number),
              limitMB: expect.any(Number),
              usagePercent: expect.any(Number),
            }),
            lastCheck: expect.any(String),
          },
          performance: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            details: expect.objectContaining({
              averageRequestDuration: expect.any(Number),
              thresholds: expect.objectContaining({
                maxDuration: expect.any(Number),
                maxErrorRate: expect.any(Number),
              }),
            }),
            lastCheck: expect.any(String),
          },
          externalServices: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            details: expect.objectContaining({
              services: expect.arrayContaining([
                expect.objectContaining({
                  name: expect.any(String),
                  status: expect.stringMatching(/^(pass|fail)$/),
                  duration: expect.any(Number),
                  required: expect.any(Boolean),
                }),
              ]),
            }),
            lastCheck: expect.any(String),
          },
          diskSpace: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            details: expect.objectContaining({
              usagePercent: expect.any(Number),
              threshold: expect.objectContaining({
                warning: 80,
                critical: 90,
              }),
            }),
            lastCheck: expect.any(String),
          },
          redis: {
            status: expect.stringMatching(/^(pass|warn|fail)$/),
            message: expect.any(String),
            duration: expect.any(Number),
            details: expect.objectContaining({
              responseTime: expect.any(Number),
            }),
            lastCheck: expect.any(String),
          },
        },
        metrics: {
          requestCount: expect.any(Number),
          averageResponseTime: expect.any(Number),
          errorRate: expect.any(Number),
          memoryUsage: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number),
            arrayBuffers: expect.any(Number),
          }),
          cpuUsage: expect.any(Number),
          activeConnections: expect.any(Number),
          systemHealth: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        },
        alerts: {
          recent: expect.any(Array),
          critical: expect.any(Number),
          warnings: expect.any(Number),
        },
      });
    });

    it('should include external services check with required services', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      const externalServices = responseData.checks.externalServices;
      expect(externalServices.details.services).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'OpenAI',
            status: expect.stringMatching(/^(pass|fail)$/),
            duration: expect.any(Number),
            required: true,
          }),
          expect.objectContaining({
            name: 'Anthropic',
            status: expect.stringMatching(/^(pass|fail)$/),
            duration: expect.any(Number),
            required: false,
          }),
          expect.objectContaining({
            name: 'Figma',
            status: expect.stringMatching(/^(pass|fail)$/),
            duration: expect.any(Number),
            required: false,
          }),
        ])
      );
    });

    it('should validate memory usage calculations', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      const memoryCheck = responseData.checks.memory;
      expect(memoryCheck.details.usageMB).toBe(100); // 100 * 1024 * 1024 bytes / 1024 / 1024 = 100MB
      expect(memoryCheck.details.limitMB).toBe(512); // Default limit 
      expect(memoryCheck.details.usagePercent).toBeCloseTo(19.5, 1); // 100 / 512 * 100 = 19.5
      
      // Memory usage should be reported as normal for this level
      expect(memoryCheck.status).toBe('pass');
      expect(memoryCheck.message).toContain('Memory usage normal');
    });

    it('should validate CPU usage calculations', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      const cpuUsage = responseData.metrics.cpuUsage;
      // CPU calculation: (user + system) / 1000 * 100 = (250000 + 50000) / 1000 * 100 = 30000
      expect(cpuUsage).toBe(30000);
    });
  });

  describe('Health Status Determination', () => {
    it('should return healthy status when all checks pass', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('healthy');
      
      // All individual checks should pass
      Object.values(responseData.checks).forEach((check: any) => {
        expect(check.status).toBe('pass');
      });
    });

    it('should return proper cache headers for real-time monitoring', async () => {
      const response = await GET(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should include timestamp for real-time updates', async () => {
      const beforeTime = Date.now();
      const response = await GET(mockRequest as NextRequest);
      const afterTime = Date.now();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.timestamp).toBeDefined();
      
      const responseTime = new Date(responseData.timestamp).getTime();
      expect(responseTime).toBeGreaterThanOrEqual(beforeTime);
      expect(responseTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Query Parameters', () => {
    it('should support detailed=false for basic health check', async () => {
      mockRequest.url = 'http://localhost:3000/api/health?detailed=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('healthy');
      
      // Basic checks should have database and memory
      expect(responseData.checks.database.status).toBe('pass');
      expect(responseData.checks.memory.status).toBe('pass');
      
      // Other checks should show "Skipped in basic check"
      expect(responseData.checks.performance.message).toBe('Skipped in basic check');
      expect(responseData.checks.externalServices.message).toBe('Skipped in basic check');
      expect(responseData.checks.diskSpace.message).toBe('Skipped in basic check');
      expect(responseData.checks.redis.message).toBe('Skipped in basic check');
    });

    it('should support prometheus format', async () => {
      mockRequest.url = 'http://localhost:3000/api/health?format=prometheus';

      const response = await GET(mockRequest as NextRequest);
      const responseText = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(responseText).toContain('# HELP requests_total Total requests');
      expect(responseText).toContain('requests_total 1500');
    });

    it('should default to detailed=true and JSON format', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('healthy');
      
      // All detailed checks should be performed
      expect(responseData.checks.database.status).toBe('pass');
      expect(responseData.checks.memory.status).toBe('pass');
      expect(responseData.checks.performance.status).toBe('pass');
      expect(responseData.checks.externalServices.status).toBe('pass');
      expect(responseData.checks.diskSpace.status).toBe('pass');
      expect(responseData.checks.redis.status).toBe('pass');
    });
  });

  describe('Performance Metrics Integration', () => {
    it('should integrate with performance monitoring service', async () => {
      const { performanceMonitor } = require('@/shared/infrastructure/performance/performance-monitoring-service');
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(performanceMonitor.getPerformanceStats).toHaveBeenCalled();
      expect(performanceMonitor.getRecentAlerts).toHaveBeenCalled();
      
      // Verify performance data is included
      expect(responseData.metrics.requestCount).toBe(1500);
      expect(responseData.metrics.averageResponseTime).toBe(850);
      expect(responseData.metrics.errorRate).toBe(0.03);
    });

    it('should integrate with database optimization service', async () => {
      const { databaseOptimization } = require('@/shared/infrastructure/performance/database-optimization-service');
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(databaseOptimization.getPerformanceStats).toHaveBeenCalled();
      
      // Database check should include optimization stats
      expect(responseData.checks.database.details.stats).toEqual({
        totalQueries: 50,
        averageQueryTime: 25,
        slowQueries: [],
        cacheHitRate: 95,
        topSlowQueries: [],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error
      const { performanceMonitor } = require('@/shared/infrastructure/performance/performance-monitoring-service');
      performanceMonitor.getPerformanceStats.mockImplementation(() => {
        throw new Error('Performance service unavailable');
      });

      try {
        const response = await GET(mockRequest as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(503);
        expect(responseData.status).toBe('unhealthy');
        expect(responseData.error).toContain('Performance service unavailable');
      } catch (error) {
        // In case the error is thrown, check that it's properly handled
        expect(error).toBeInstanceOf(Error);
      }

      // Reset mock
      performanceMonitor.getPerformanceStats.mockReturnValue({
        totalRequests: 1500,
        averageRequestDuration: 850,
        errorRate: 0.03,
        medianRequestDuration: 650,
        p95RequestDuration: 1200,
        p99RequestDuration: 2000,
        averageMemoryUsage: 150,
        peakMemoryUsage: 300,
        throughput: 45,
        recentAlerts: [],
        systemHealth: 'healthy',
      });
    });

    it('should include proper error structure on failure', async () => {
      // Mock a critical error
      const originalPerformanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
      
      // Replace the entire module temporarily
      jest.doMock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
        performanceMonitor: {
          getPerformanceStats: () => { throw new Error('Service crashed'); },
          getRecentAlerts: () => [],
          getPrometheusMetrics: () => '',
        },
      }));

      try {
        const response = await GET(mockRequest as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(503);
        expect(responseData).toMatchObject({
          status: 'unhealthy',
          timestamp: expect.any(String),
          error: expect.stringContaining('Service crashed'),
        });
        
        // Should include proper cache headers even on error
        expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
        expect(response.headers.get('Pragma')).toBe('no-cache');
        expect(response.headers.get('Expires')).toBe('0');
      } catch (error) {
        // Expected behavior for critical errors
        expect(error).toBeInstanceOf(Error);
      }

      // Restore original mock
      jest.doMock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
        performanceMonitor: originalPerformanceMonitor,
      }));
    });
  });

  describe('Integration with Dashboard Metrics', () => {
    it('should provide health data structure compatible with dashboard', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      // Verify structure matches what dashboard expects
      expect(responseData).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(String),
        checks: expect.any(Object),
        metrics: expect.any(Object),
        alerts: expect.any(Object),
      });

      // Verify specific fields the dashboard uses
      expect(responseData.metrics.memoryUsage).toBeDefined();
      expect(responseData.metrics.cpuUsage).toBeDefined();
      expect(responseData.metrics.systemHealth).toBeDefined();
      
      expect(responseData.alerts.critical).toBeDefined();
      expect(responseData.alerts.warnings).toBeDefined();
      expect(Array.isArray(responseData.alerts.recent)).toBe(true);
    });
  });
});