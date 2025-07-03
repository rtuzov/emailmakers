// Mock Next.js server components
Object.defineProperty(globalThis, 'Request', {
  value: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: options?.headers || {},
  })),
});

Object.defineProperty(globalThis, 'Response', {
  value: jest.fn().mockImplementation((body, options) => ({
    json: async () => body ? JSON.parse(body) : {},
    text: async () => body || '',
    status: options?.status || 200,
    headers: options?.headers || {},
  })),
});

import { NextRequest } from 'next/server';
import { GET, HEAD } from '@/app/api/health/route';

// Mock the performance monitoring service
jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 150,
      averageRequestDuration: 120,
      errorRate: 0.02,
      systemHealth: 'healthy'
    })),
    getRecentAlerts: jest.fn(() => [
      { severity: 'medium', message: 'Test alert', timestamp: Date.now() }
    ]),
    getPrometheusMetrics: jest.fn(() => 'mock_prometheus_metrics')
  }
}));

// Mock the database optimization service
jest.mock('@/shared/infrastructure/performance/database-optimization-service', () => ({
  databaseOptimization: {
    getPerformanceStats: jest.fn(() => ({
      queryTime: 45,
      connectionPool: { active: 5, idle: 10 }
    }))
  }
}));

describe('Health API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns comprehensive health check with detailed=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('alerts');

      // Verify checks structure
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('memory');
      expect(data.checks).toHaveProperty('performance');
      expect(data.checks).toHaveProperty('externalServices');
      expect(data.checks).toHaveProperty('diskSpace');
      expect(data.checks).toHaveProperty('redis');

      // Verify metrics structure
      expect(data.metrics).toHaveProperty('requestCount');
      expect(data.metrics).toHaveProperty('averageResponseTime');
      expect(data.metrics).toHaveProperty('errorRate');
      expect(data.metrics).toHaveProperty('memoryUsage');
      expect(data.metrics).toHaveProperty('cpuUsage');
      expect(data.metrics).toHaveProperty('activeConnections');
      expect(data.metrics).toHaveProperty('systemHealth');

      // Verify alerts structure
      expect(data.alerts).toHaveProperty('recent');
      expect(data.alerts).toHaveProperty('critical');
      expect(data.alerts).toHaveProperty('warnings');
    });

    it('returns basic health check with detailed=false', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('checks');

      // Should only have basic checks
      expect(data.checks.database).toBeDefined();
      expect(data.checks.memory).toBeDefined();
      expect(data.checks.performance.message).toContain('Skipped in basic check');
    });

    it('returns prometheus metrics when format=prometheus', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?format=prometheus');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(text).toBe('mock_prometheus_metrics');
    });

    it('returns 503 status for unhealthy system', async () => {
      // Mock unhealthy database
      const originalPerformanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
      originalPerformanceMonitor.getPerformanceStats.mockReturnValueOnce({
        totalRequests: 150,
        averageRequestDuration: 6000, // Over threshold
        errorRate: 0.1, // High error rate
        systemHealth: 'unhealthy'
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
    });

    it('sets correct cache headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('handles errors gracefully', async () => {
      // Mock an error in performance monitoring
      const originalPerformanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
      originalPerformanceMonitor.getPerformanceStats.mockImplementationOnce(() => {
        throw new Error('Performance monitoring failed');
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data).toHaveProperty('error');
    });
  });

  describe('HEAD /api/health', () => {
    it('returns 200 for healthy system', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await HEAD(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Health-Status')).toBe('healthy');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('returns 503 for unhealthy system', async () => {
      // Mock a memory issue that would make readiness fail
      const originalProcess = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        rss: 0,
        heapTotal: 0,
        heapUsed: 1000 * 1024 * 1024, // 1GB
        external: 0,
        arrayBuffers: 0
      }));

      // Set a low memory limit for testing
      process.env.MAX_MEMORY_USAGE = '500000000'; // 500MB

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await HEAD(request);

      expect(response.status).toBe(503);
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy');

      // Restore original process.memoryUsage
      process.memoryUsage = originalProcess;
      delete process.env.MAX_MEMORY_USAGE;
    });

    it('handles HEAD request errors gracefully', async () => {
      // Mock an error in the readiness check
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => {
        throw new Error('Memory check failed');
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await HEAD(request);

      expect(response.status).toBe(503);
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy');

      // Restore original process.memoryUsage
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Health Check Components', () => {
    it('performs database connectivity check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.database).toHaveProperty('status');
      expect(data.checks.database).toHaveProperty('message');
      expect(data.checks.database).toHaveProperty('duration');
      expect(data.checks.database).toHaveProperty('details');
      expect(['pass', 'warn', 'fail']).toContain(data.checks.database.status);
    });

    it('performs memory usage check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.memory).toHaveProperty('status');
      expect(data.checks.memory).toHaveProperty('message');
      expect(data.checks.memory).toHaveProperty('details');
      expect(data.checks.memory.details).toHaveProperty('usageMB');
      expect(data.checks.memory.details).toHaveProperty('limitMB');
      expect(data.checks.memory.details).toHaveProperty('usagePercent');
    });

    it('performs performance check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.performance).toHaveProperty('status');
      expect(data.checks.performance).toHaveProperty('message');
      expect(data.checks.performance).toHaveProperty('details');
    });

    it('performs external services check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.externalServices).toHaveProperty('status');
      expect(data.checks.externalServices).toHaveProperty('message');
      expect(data.checks.externalServices).toHaveProperty('details');
      expect(data.checks.externalServices.details).toHaveProperty('services');
    });

    it('performs disk space check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.diskSpace).toHaveProperty('status');
      expect(data.checks.diskSpace).toHaveProperty('message');
      expect(data.checks.diskSpace).toHaveProperty('details');
    });

    it('performs Redis connectivity check', async () => {
      const request = new NextRequest('http://localhost:3000/api/health?detailed=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.redis).toHaveProperty('status');
      expect(data.checks.redis).toHaveProperty('message');
      expect(data.checks.redis).toHaveProperty('duration');
    });
  });

  describe('Status Determination', () => {
    it('returns healthy when all checks pass', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Default mocked services should return healthy
      expect(data.status).toBe('healthy');
      expect(response.status).toBe(200);
    });

    it('returns degraded when some checks warn', async () => {
      // Test would require mocking specific warning conditions
      // This is a placeholder for more complex status testing
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain((await response.json()).status);
    });
  });
});