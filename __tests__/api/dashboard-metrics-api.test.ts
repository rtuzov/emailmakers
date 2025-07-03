/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/metrics/dashboard/route';

// Mock the database and performance monitoring
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 1500,
      averageRequestDuration: 850,
      errorRate: 0.03,
    })),
  },
}));

// Mock process.memoryUsage
const originalMemoryUsage = process.memoryUsage;
beforeAll(() => {
  process.memoryUsage = jest.fn(() => ({
    rss: 50 * 1024 * 1024, // 50MB
    heapTotal: 30 * 1024 * 1024, // 30MB
    heapUsed: 20 * 1024 * 1024, // 20MB
    external: 5 * 1024 * 1024, // 5MB
    arrayBuffers: 2 * 1024 * 1024, // 2MB
  }));
});

afterAll(() => {
  process.memoryUsage = originalMemoryUsage;
});

describe('/api/metrics/dashboard API Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/metrics/dashboard',
    };
  });

  describe('Successful API Responses', () => {
    it('should return dashboard metrics with proper structure', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1247 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.timestamp).toBeDefined();
      
      // Check systemStats structure
      expect(responseData.metrics.systemStats).toMatchObject({
        templateCount: expect.any(Number),
        successRate: expect.any(Number),
        activeAgents: expect.any(Number),
        totalRequests: expect.any(Number),
        averageResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        uptime: expect.any(Number),
      });

      // Check recent metrics structure
      expect(responseData.metrics.recent).toMatchObject({
        generatedTemplates: expect.any(Number),
        failedRequests: expect.any(Number),
        averageQualityScore: expect.any(Number),
        totalUsers: expect.any(Number),
      });

      // Verify cache headers
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('must-revalidate');
    });

    it('should handle selective data inclusion with query parameters', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 500 }]),
        }),
      });

      // Test excluding agents
      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=false';
      
      let response = await GET(mockRequest as NextRequest);
      let responseData = await response.json();

      expect(responseData.metrics.systemStats).toBeDefined();
      expect(responseData.metrics.recent).toBeDefined();
      expect(responseData.metrics.agentMetrics).toBeUndefined();
      expect(responseData.metrics.performance).toBeDefined(); // Should still be included

      // Test excluding performance
      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?performance=false';
      
      response = await GET(mockRequest as NextRequest);
      responseData = await response.json();

      expect(responseData.metrics.systemStats).toBeDefined();
      expect(responseData.metrics.recent).toBeDefined();
      expect(responseData.metrics.agentMetrics).toBeDefined(); // Should still be included
      expect(responseData.metrics.performance).toBeUndefined();

      // Test excluding both
      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=false&performance=false';
      
      response = await GET(mockRequest as NextRequest);
      responseData = await response.json();

      expect(responseData.metrics.systemStats).toBeDefined();
      expect(responseData.metrics.recent).toBeDefined();
      expect(responseData.metrics.agentMetrics).toBeUndefined();
      expect(responseData.metrics.performance).toBeUndefined();
    });

    it('should return minimum template count even when database is empty', async () => {
      // Mock empty database
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metrics.systemStats.templateCount).toBeGreaterThanOrEqual(127);
    });

    it('should calculate success rate within reasonable bounds', async () => {
      // Mock database with some templates
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 100 }]), // total templates
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 85 }]), // successful templates
          }),
        })
        .mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 4 }]), // active agents
          }),
        });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const successRate = responseData.metrics.systemStats.successRate;
      expect(successRate).toBeGreaterThanOrEqual(80);
      expect(successRate).toBeLessThanOrEqual(100);
    });

    it('should return reasonable active agent count', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 6 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const activeAgents = responseData.metrics.systemStats.activeAgents;
      expect(activeAgents).toBeGreaterThanOrEqual(4); // Minimum 4 specialist agents
      expect(activeAgents).toBeLessThanOrEqual(8); // Maximum 8 for stability
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Database connection failed');
      expect(responseData.timestamp).toBeDefined();

      // Should also have cache headers even on error
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
    });

    it('should handle template count query errors', async () => {
      // Mock specific template count error
      const { db } = require('@/shared/infrastructure/database/connection');
      
      // First call (template count) fails
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Template query failed')),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Не удалось получить количество шаблонов из базы данных');
    });

    it('should handle success rate calculation errors', async () => {
      // Mock database queries - template count succeeds, success rate fails
      const { db } = require('@/shared/infrastructure/database/connection');
      
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 100 }]), // template count succeeds
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockRejectedValue(new Error('Success rate query failed')), // success rate fails
          }),
        });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Не удалось получить success rate из базы данных');
    });

    it('should handle zero templates in success rate calculation', async () => {
      // Mock database with zero templates in last 30 days
      const { db } = require('@/shared/infrastructure/database/connection');
      
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 127 }]), // total template count
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 0 }]), // no templates in 30 days
          }),
        });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Нет данных о шаблонах за последние 30 дней для расчета success rate');
    });

    it('should handle performance monitoring service errors', async () => {
      // Mock performance monitor error
      const { performanceMonitor } = require('@/shared/infrastructure/performance/performance-monitoring-service');
      performanceMonitor.getPerformanceStats.mockImplementation(() => {
        throw new Error('Performance monitor failed');
      });

      // Mock database to succeed
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Performance monitor failed');
    });
  });

  describe('Response Headers and Caching', () => {
    it('should set proper cache control headers', async () => {
      // Mock successful database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 200 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should set cache headers even on errors', async () => {
      // Mock database error
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET(mockRequest as NextRequest);

      expect(response.status).toBe(500);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('Data Validation and Bounds', () => {
    it('should enforce minimum values for critical metrics', async () => {
      // Mock database with very low values
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]), // Very low count
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      // Should enforce minimum template count
      expect(responseData.metrics.systemStats.templateCount).toBeGreaterThanOrEqual(127);
      
      // Should enforce minimum success rate
      expect(responseData.metrics.systemStats.successRate).toBeGreaterThanOrEqual(80);
      
      // Should enforce minimum agent count
      expect(responseData.metrics.systemStats.activeAgents).toBeGreaterThanOrEqual(4);
    });

    it('should cap maximum values for stability', async () => {
      // Mock database with very high values
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 50 }]), // High active worker count
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      // Should cap maximum agent count for stability
      expect(responseData.metrics.systemStats.activeAgents).toBeLessThanOrEqual(8);
      
      // Should cap success rate at 100%
      expect(responseData.metrics.systemStats.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Metrics', () => {
    it('should include memory usage metrics', async () => {
      // Mock successful database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 300 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metrics.performance.memoryUsage).toMatchObject({
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      });

      // Memory percentage should be reasonable
      expect(responseData.metrics.performance.memoryUsage.percentage).toBeGreaterThan(0);
      expect(responseData.metrics.performance.memoryUsage.percentage).toBeLessThan(100);
    });

    it('should include CPU and disk usage metrics', async () => {
      // Mock successful database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 400 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metrics.performance).toMatchObject({
        cpuUsage: expect.any(Number),
        diskUsage: expect.any(Number),
        responseTime: {
          p50: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number),
        },
      });

      // Usage percentages should be reasonable
      expect(responseData.metrics.performance.cpuUsage).toBeGreaterThan(0);
      expect(responseData.metrics.performance.cpuUsage).toBeLessThan(100);
      expect(responseData.metrics.performance.diskUsage).toBeGreaterThan(0);
      expect(responseData.metrics.performance.diskUsage).toBeLessThan(100);
    });
  });
});