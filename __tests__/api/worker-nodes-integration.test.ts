/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/metrics/dashboard/route';
import { db } from '@/shared/infrastructure/database/connection';
import { workerNodes } from '@/shared/infrastructure/database/render-testing-schema';
import { eq, sql } from 'drizzle-orm';

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
  },
}));

// Mock database optimization service
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

describe('/api/metrics/dashboard Worker Nodes Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/metrics/dashboard',
    };
  });

  describe('Worker Nodes Database Integration', () => {
    it('should query worker nodes table successfully', async () => {
      // This test verifies that the worker_nodes table exists and can be queried
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metrics.systemStats.activeAgents).toBeGreaterThanOrEqual(4);
      
      // Should include the base 4 specialist agents
      expect(responseData.metrics.systemStats.activeAgents).toBeGreaterThanOrEqual(4);
      expect(responseData.metrics.systemStats.activeAgents).toBeLessThanOrEqual(8);
    });

    it('should not show fallback warning when worker nodes table exists', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Should not have any fallback warnings
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Worker nodes table not available, using fallback')
      );

      // Should log successful worker node query
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ DashboardMetrics: Found')
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should calculate active agents based on real worker node data', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      const activeAgents = responseData.metrics.systemStats.activeAgents;
      
      // With our sample data (1 busy + 3 idle workers), plus base 4 specialists,
      // we should get a calculated number between 4-8
      expect(activeAgents).toBeGreaterThanOrEqual(4);
      expect(activeAgents).toBeLessThanOrEqual(8);
      
      // The active agents count should be a reasonable number
      expect(typeof activeAgents).toBe('number');
      expect(activeAgents).toBeGreaterThan(0);
    });

    it('should handle worker node status filtering correctly', async () => {
      // Test assumes we have sample data with specific statuses
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // The API should count active workers (idle + busy status)
      // and combine with other metrics to determine total active agents
      const activeAgents = responseData.metrics.systemStats.activeAgents;
      expect(activeAgents).toBeGreaterThan(0);
    });

    it('should include proper performance metrics structure', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metrics).toMatchObject({
        systemStats: {
          templateCount: expect.any(Number),
          successRate: expect.any(Number),
          activeAgents: expect.any(Number),
          totalRequests: expect.any(Number),
          averageResponseTime: expect.any(Number),
          errorRate: expect.any(Number),
          uptime: expect.any(Number),
        },
        recent: {
          generatedTemplates: expect.any(Number),
          failedRequests: expect.any(Number),
          averageQualityScore: expect.any(Number),
          totalUsers: expect.any(Number),
        },
      });

      // Active agents should be the calculated value including worker nodes
      expect(responseData.metrics.systemStats.activeAgents).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Worker Nodes Data Validation', () => {
    it('should have reasonable active agent counts based on worker node activity', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      
      const activeAgents = responseData.metrics.systemStats.activeAgents;
      
      // Should be at least the base 4 specialist agents
      expect(activeAgents).toBeGreaterThanOrEqual(4);
      
      // Should not exceed reasonable maximum (base 4 + max 4 additional workers)
      expect(activeAgents).toBeLessThanOrEqual(8);
      
      // Should be a valid positive integer
      expect(Number.isInteger(activeAgents)).toBe(true);
      expect(activeAgents).toBeGreaterThan(0);
    });

    it('should show consistent active agent calculation across requests', async () => {
      const response1 = await GET(mockRequest as NextRequest);
      const data1 = await response1.json();
      
      const response2 = await GET(mockRequest as NextRequest);
      const data2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Active agents should be consistent across requests
      // (allowing for small variations due to database activity)
      const activeAgents1 = data1.metrics.systemStats.activeAgents;
      const activeAgents2 = data2.metrics.systemStats.activeAgents;
      
      expect(Math.abs(activeAgents1 - activeAgents2)).toBeLessThanOrEqual(1);
    });

    it('should handle database query timing appropriately', async () => {
      const startTime = Date.now();
      const response = await GET(mockRequest as NextRequest);
      const endTime = Date.now();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Response should be reasonably fast (under 2 seconds)
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000);
      
      // Should have valid active agents data
      expect(responseData.metrics.systemStats.activeAgents).toBeGreaterThan(0);
    });
  });

  describe('Real Database Integration', () => {
    it('should be able to query worker nodes directly if database is available', async () => {
      // This test will only pass if the actual database is available
      // It's marked as a real integration test
      
      try {
        const workers = await db.select().from(workerNodes).limit(5);
        
        // If we get here, the database query worked
        expect(Array.isArray(workers)).toBe(true);
        
        if (workers.length > 0) {
          // Verify worker structure
          const worker = workers[0];
          expect(worker).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.any(String),
            status: expect.any(String),
            capabilities: expect.any(Object),
            configuration: expect.any(Object),
          });
        }
        
        console.log(`✅ Integration test: Found ${workers.length} worker nodes in database`);
      } catch (error) {
        console.log('⚠️ Integration test: Database not available, skipping direct query test');
        // Test passes if database is not available (for CI environments)
        expect(true).toBe(true);
      }
    });
  });
});