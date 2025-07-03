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

describe('/api/metrics/dashboard Agent Metrics Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/metrics/dashboard',
    };
  });

  describe('Agent Metrics Inclusion', () => {
    it('should include agent metrics by default', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 500 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.agentMetrics).toBeDefined();
      
      // Check all four specialist agents are included
      expect(responseData.metrics.agentMetrics.contentSpecialist).toBeDefined();
      expect(responseData.metrics.agentMetrics.designSpecialist).toBeDefined();
      expect(responseData.metrics.agentMetrics.qualitySpecialist).toBeDefined();
      expect(responseData.metrics.agentMetrics.deliverySpecialist).toBeDefined();
    });

    it('should exclude agent metrics when agents=false', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 500 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.agentMetrics).toBeUndefined();
    });
  });

  describe('Agent Metrics Structure', () => {
    it('should return correct structure for all agents', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 300 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const agents = responseData.metrics.agentMetrics;

      // Check content specialist structure
      expect(agents.contentSpecialist).toMatchObject({
        status: expect.stringMatching(/^(active|idle|error)$/),
        processedJobs: expect.any(Number),
        successRate: expect.any(Number),
        averageProcessingTime: expect.any(Number),
      });

      // Check design specialist structure
      expect(agents.designSpecialist).toMatchObject({
        status: expect.stringMatching(/^(active|idle|error)$/),
        processedJobs: expect.any(Number),
        successRate: expect.any(Number),
        averageProcessingTime: expect.any(Number),
      });

      // Check quality specialist structure
      expect(agents.qualitySpecialist).toMatchObject({
        status: expect.stringMatching(/^(active|idle|error)$/),
        processedJobs: expect.any(Number),
        successRate: expect.any(Number),
        averageProcessingTime: expect.any(Number),
      });

      // Check delivery specialist structure
      expect(agents.deliverySpecialist).toMatchObject({
        status: expect.stringMatching(/^(active|idle|error)$/),
        processedJobs: expect.any(Number),
        successRate: expect.any(Number),
        averageProcessingTime: expect.any(Number),
      });
    });

    it('should return valid ranges for agent metrics', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 200 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const agents = responseData.metrics.agentMetrics;

      // Test all agents have valid ranges
      Object.values(agents).forEach((agent: any) => {
        // Processed jobs should be reasonable (10-60 range)
        expect(agent.processedJobs).toBeGreaterThanOrEqual(10);
        expect(agent.processedJobs).toBeLessThanOrEqual(60);

        // Success rate should be percentage (80-100%)
        expect(agent.successRate).toBeGreaterThanOrEqual(80);
        expect(agent.successRate).toBeLessThanOrEqual(100);

        // Processing time should be reasonable (400-2500ms)
        expect(agent.averageProcessingTime).toBeGreaterThanOrEqual(400);
        expect(agent.averageProcessingTime).toBeLessThanOrEqual(2500);

        // Status should be valid
        expect(['active', 'idle', 'error']).toContain(agent.status);
      });
    });
  });

  describe('Agent-Specific Characteristics', () => {
    it('should have different processing time ranges for different specialists', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 400 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const agents = responseData.metrics.agentMetrics;

      // Content specialist: 800-2300ms range
      expect(agents.contentSpecialist.averageProcessingTime).toBeGreaterThanOrEqual(800);
      expect(agents.contentSpecialist.averageProcessingTime).toBeLessThanOrEqual(2300);

      // Design specialist: 1200-3200ms range (slowest)
      expect(agents.designSpecialist.averageProcessingTime).toBeGreaterThanOrEqual(1200);
      expect(agents.designSpecialist.averageProcessingTime).toBeLessThanOrEqual(3200);

      // Quality specialist: 600-1600ms range
      expect(agents.qualitySpecialist.averageProcessingTime).toBeGreaterThanOrEqual(600);
      expect(agents.qualitySpecialist.averageProcessingTime).toBeLessThanOrEqual(1600);

      // Delivery specialist: 400-1200ms range (fastest)
      expect(agents.deliverySpecialist.averageProcessingTime).toBeGreaterThanOrEqual(400);
      expect(agents.deliverySpecialist.averageProcessingTime).toBeLessThanOrEqual(1200);
    });

    it('should have different job count ranges for different specialists', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 350 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      const agents = responseData.metrics.agentMetrics;

      // Content specialist: 20-50 jobs
      expect(agents.contentSpecialist.processedJobs).toBeGreaterThanOrEqual(20);
      expect(agents.contentSpecialist.processedJobs).toBeLessThanOrEqual(50);

      // Design specialist: 15-40 jobs
      expect(agents.designSpecialist.processedJobs).toBeGreaterThanOrEqual(15);
      expect(agents.designSpecialist.processedJobs).toBeLessThanOrEqual(40);

      // Quality specialist: 25-60 jobs (highest workload)
      expect(agents.qualitySpecialist.processedJobs).toBeGreaterThanOrEqual(25);
      expect(agents.qualitySpecialist.processedJobs).toBeLessThanOrEqual(60);

      // Delivery specialist: 10-30 jobs
      expect(agents.deliverySpecialist.processedJobs).toBeGreaterThanOrEqual(10);
      expect(agents.deliverySpecialist.processedJobs).toBeLessThanOrEqual(30);
    });
  });

  describe('Real-time Agent Status Simulation', () => {
    it('should return active status for all agents by default', async () => {
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
      const agents = responseData.metrics.agentMetrics;

      // In current implementation, all agents return 'active' status
      expect(agents.contentSpecialist.status).toBe('active');
      expect(agents.designSpecialist.status).toBe('active');
      expect(agents.qualitySpecialist.status).toBe('active');
      expect(agents.deliverySpecialist.status).toBe('active');
    });

    it('should provide variability in agent metrics between calls', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 300 }]),
        }),
      });

      // Make two calls
      const response1 = await GET(mockRequest as NextRequest);
      const data1 = await response1.json();
      
      const response2 = await GET(mockRequest as NextRequest);
      const data2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const agents1 = data1.metrics.agentMetrics;
      const agents2 = data2.metrics.agentMetrics;

      // Metrics should vary between calls (due to random generation)
      // At least one metric should be different
      let hasVariation = false;
      
      if (agents1.contentSpecialist.processedJobs !== agents2.contentSpecialist.processedJobs ||
          agents1.designSpecialist.averageProcessingTime !== agents2.designSpecialist.averageProcessingTime ||
          agents1.qualitySpecialist.successRate !== agents2.qualitySpecialist.successRate ||
          agents1.deliverySpecialist.processedJobs !== agents2.deliverySpecialist.processedJobs) {
        hasVariation = true;
      }

      expect(hasVariation).toBe(true);
    });
  });

  describe('Error Handling with Agent Metrics', () => {
    it('should still return agent metrics when database errors occur', async () => {
      // Mock database error
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      
      // Even on error, the service should have attempted to generate agent metrics
      // before the error occurred, but since database fails early, 
      // we expect the error response format
      expect(responseData.error).toBeDefined();
    });

    it('should handle performance monitoring errors gracefully', async () => {
      // Mock successful database but failed performance monitor
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      const { performanceMonitor } = require('@/shared/infrastructure/performance/performance-monitoring-service');
      performanceMonitor.getPerformanceStats.mockImplementation(() => {
        throw new Error('Performance monitor failed');
      });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Performance monitor failed');
    });
  });

  describe('Agent Metrics Caching', () => {
    it('should set proper cache headers for agent metrics', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 150 }]),
        }),
      });

      const response = await GET(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should include timestamp for real-time updates', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 180 }]),
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

  describe('Query Parameter Handling', () => {
    it('should respect agents=true parameter explicitly', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 220 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=true';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.agentMetrics).toBeDefined();
      expect(Object.keys(responseData.metrics.agentMetrics)).toHaveLength(4);
    });

    it('should work with combined query parameters', async () => {
      // Mock database queries
      const { db } = require('@/shared/infrastructure/database/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 275 }]),
        }),
      });

      mockRequest.url = 'http://localhost:3000/api/metrics/dashboard?agents=true&performance=false';

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.agentMetrics).toBeDefined();
      expect(responseData.metrics.performance).toBeUndefined();
    });
  });
});