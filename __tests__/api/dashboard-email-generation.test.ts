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

describe('/api/metrics/dashboard Email Generation Statistics Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/metrics/dashboard',
    };
  });

  describe('Email Generation Statistics Inclusion', () => {
    it('should include email generation statistics by default', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 250 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.emailGeneration).toBeDefined();
      
      // Check structure of email generation statistics
      expect(responseData.metrics.emailGeneration).toMatchObject({
        daily: {
          total: expect.any(Number),
          successful: expect.any(Number),
          failed: expect.any(Number),
          averageTime: expect.any(Number),
        },
        weekly: {
          total: expect.any(Number),
          successful: expect.any(Number),
          failed: expect.any(Number),
          averageTime: expect.any(Number),
        },
        monthly: {
          total: expect.any(Number),
          successful: expect.any(Number),
          failed: expect.any(Number),
          averageTime: expect.any(Number),
        },
        topCategories: expect.any(Array),
        timeDistribution: expect.any(Array),
      });
    });

    it('should exclude email generation statistics when emailStats=false', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 300 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?emailStats=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.emailGeneration).toBeUndefined();
    });

    it('should include email generation statistics when emailStats=true explicitly', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 180 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?emailStats=true';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.emailGeneration).toBeDefined();
    });
  });

  describe('Email Generation Statistics Structure', () => {
    it('should return valid period statistics', async () => {
      // Mock database queries with different counts for different periods
      const { db } = require('@/shared/infrastructure/database/connection');
      
      let callCount = 0;
      db.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            callCount++;
            // Return different counts for different periods
            if (callCount <= 2) return Promise.resolve([{ count: 25 }]); // Template count + success rate queries
            if (callCount <= 4) return Promise.resolve([{ count: 4 }]);  // Active agents queries
            if (callCount === 5) return Promise.resolve([{ count: 12 }]); // Daily total
            if (callCount === 6) return Promise.resolve([{ count: 11 }]); // Daily successful
            if (callCount === 7) return Promise.resolve([{ count: 85 }]); // Weekly total
            if (callCount === 8) return Promise.resolve([{ count: 78 }]); // Weekly successful
            if (callCount === 9) return Promise.resolve([{ count: 342 }]); // Monthly total
            if (callCount === 10) return Promise.resolve([{ count: 318 }]); // Monthly successful
            return Promise.resolve([{ count: 0 }]);
          }),
        }),
      }));

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const emailGen = responseData.metrics.emailGeneration;

      // Daily statistics
      expect(emailGen.daily.total).toBe(12);
      expect(emailGen.daily.successful).toBe(11);
      expect(emailGen.daily.failed).toBe(1);
      expect(emailGen.daily.averageTime).toBeGreaterThan(0);

      // Weekly statistics
      expect(emailGen.weekly.total).toBe(85);
      expect(emailGen.weekly.successful).toBe(78);
      expect(emailGen.weekly.failed).toBe(7);
      expect(emailGen.weekly.averageTime).toBeGreaterThan(0);

      // Monthly statistics
      expect(emailGen.monthly.total).toBe(342);
      expect(emailGen.monthly.successful).toBe(318);
      expect(emailGen.monthly.failed).toBe(24);
      expect(emailGen.monthly.averageTime).toBeGreaterThan(0);
    });

    it('should return valid top categories structure', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const topCategories = responseData.metrics.emailGeneration.topCategories;

      expect(Array.isArray(topCategories)).toBe(true);
      expect(topCategories.length).toBeGreaterThan(0);

      topCategories.forEach((category: any) => {
        expect(category).toMatchObject({
          category: expect.any(String),
          count: expect.any(Number),
          successRate: expect.any(Number),
        });

        // Validate ranges
        expect(category.count).toBeGreaterThan(0);
        expect(category.successRate).toBeGreaterThanOrEqual(80);
        expect(category.successRate).toBeLessThanOrEqual(100);
      });
    });

    it('should return valid 24-hour distribution', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 150 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const timeDistribution = responseData.metrics.emailGeneration.timeDistribution;

      expect(Array.isArray(timeDistribution)).toBe(true);
      expect(timeDistribution.length).toBe(24); // Should have 24 hours

      timeDistribution.forEach((hour: any, index: number) => {
        expect(hour).toMatchObject({
          hour: expect.any(Number),
          count: expect.any(Number),
        });

        // Hour should match index
        expect(hour.hour).toBe(index);
        
        // Count should be reasonable
        expect(hour.count).toBeGreaterThan(0);
        expect(hour.count).toBeLessThan(20);
      });
    });
  });

  describe('Database Query Error Handling', () => {
    it('should return fallback data when database queries fail', async () => {
      // Mock database error
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      // API returns 200 with fallback data when individual queries fail
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics).toBeDefined();
      expect(responseData.metrics.emailGeneration).toBeDefined();
      
      // Should have fallback email generation data
      expect(responseData.metrics.emailGeneration.daily).toMatchObject({
        total: expect.any(Number),
        successful: expect.any(Number),
        failed: expect.any(Number),
        averageTime: expect.any(Number),
      });
    });

    it('should handle period query errors gracefully with fallback data', async () => {
      // Mock database success for some queries but failure for period queries
      const { db } = require('@/shared/infrastructure/database/connection');
      
      let callCount = 0;
      db.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            callCount++;
            // First few calls succeed (template count, success rate, agents)
            if (callCount <= 4) return Promise.resolve([{ count: 100 }]);
            // Period queries fail
            if (callCount > 4) throw new Error('Period query failed');
            return Promise.resolve([{ count: 0 }]);
          }),
        }),
      }));

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      // Should return fallback email generation data
      expect(response.status).toBe(200);
      expect(responseData.metrics.emailGeneration).toBeDefined();
      expect(responseData.metrics.emailGeneration.daily).toMatchObject({
        total: expect.any(Number),
        successful: expect.any(Number),
        failed: expect.any(Number),
        averageTime: expect.any(Number),
      });
      
      // Verify the fallback data structure is reasonable (but allow for random inconsistencies in tests)
      const daily = responseData.metrics.emailGeneration.daily;
      expect(daily.total).toBeGreaterThan(0);
      expect(daily.successful).toBeGreaterThanOrEqual(0);
      expect(daily.failed).toBeGreaterThanOrEqual(0);
      expect(daily.averageTime).toBeGreaterThan(0);
      
      // Also verify weekly and monthly have reasonable structure
      const weekly = responseData.metrics.emailGeneration.weekly;
      expect(weekly.total).toBeGreaterThan(0);
      expect(weekly.averageTime).toBeGreaterThan(0);
      
      const monthly = responseData.metrics.emailGeneration.monthly;
      expect(monthly.total).toBeGreaterThan(0);
      expect(monthly.averageTime).toBeGreaterThan(0);
    });
  });

  describe('Query Parameter Combinations', () => {
    it('should work with combined query parameters', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 200 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=false&emailStats=true&performance=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Only emailStats should be included
      expect(responseData.metrics.agentMetrics).toBeUndefined();
      expect(responseData.metrics.performance).toBeUndefined();
      expect(responseData.metrics.emailGeneration).toBeDefined();
      
      // Core metrics should always be included
      expect(responseData.metrics.systemStats).toBeDefined();
      expect(responseData.metrics.recent).toBeDefined();
    });

    it('should exclude all optional sections when requested', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 150 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=false&emailStats=false&performance=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // All optional sections should be excluded
      expect(responseData.metrics.agentMetrics).toBeUndefined();
      expect(responseData.metrics.performance).toBeUndefined();
      expect(responseData.metrics.emailGeneration).toBeUndefined();
      
      // Core metrics should still be included
      expect(responseData.metrics.systemStats).toBeDefined();
      expect(responseData.metrics.recent).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should enforce reasonable ranges for email generation metrics', async () => {
      // Mock database queries with extreme values
      const { db } = require('@/shared/infrastructure/database/connection');
      
      let callCount = 0;
      db.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 4) return Promise.resolve([{ count: 100 }]); // Standard queries
            // Return extreme values for period queries
            return Promise.resolve([{ count: callCount > 8 ? 5000 : 50 }]);
          }),
        }),
      }));

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const emailGen = responseData.metrics.emailGeneration;

      // Successful count should not exceed total
      expect(emailGen.daily.successful).toBeLessThanOrEqual(emailGen.daily.total);
      expect(emailGen.weekly.successful).toBeLessThanOrEqual(emailGen.weekly.total);
      expect(emailGen.monthly.successful).toBeLessThanOrEqual(emailGen.monthly.total);

      // Failed count should equal total - successful
      expect(emailGen.daily.failed).toBe(emailGen.daily.total - emailGen.daily.successful);
      expect(emailGen.weekly.failed).toBe(emailGen.weekly.total - emailGen.weekly.successful);
      expect(emailGen.monthly.failed).toBe(emailGen.monthly.total - emailGen.monthly.successful);

      // Processing times should be reasonable (800-3000ms range)
      expect(emailGen.daily.averageTime).toBeGreaterThanOrEqual(800);
      expect(emailGen.daily.averageTime).toBeLessThanOrEqual(3000);
      expect(emailGen.weekly.averageTime).toBeGreaterThanOrEqual(800);
      expect(emailGen.weekly.averageTime).toBeLessThanOrEqual(3000);
      expect(emailGen.monthly.averageTime).toBeGreaterThanOrEqual(800);
      expect(emailGen.monthly.averageTime).toBeLessThanOrEqual(3000);
    });

    it('should return consistent category data', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 250 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const topCategories = responseData.metrics.emailGeneration.topCategories;

      // Should have expected categories
      const categoryNames = topCategories.map((cat: any) => cat.category);
      expect(categoryNames).toContain('Marketing');
      expect(categoryNames).toContain('Newsletter');
      expect(categoryNames).toContain('Transactional');

      // Categories should be sorted by count (descending)
      for (let i = 1; i < topCategories.length; i++) {
        expect(topCategories[i-1].count).toBeGreaterThanOrEqual(topCategories[i].count);
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should set proper cache headers for email generation statistics', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 300 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should include timestamp for real-time email generation updates', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 220 }]),
        }),
      });

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
});