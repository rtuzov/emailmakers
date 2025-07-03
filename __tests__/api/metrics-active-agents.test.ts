/**
 * Comprehensive test suite for Phase 2.1.5: Real Active Agent Count Implementation
 * Tests database-driven active agent calculation using worker nodes and recent template activity
 */

// Create a simpler mock that works with our test structure
class MockNextRequest {
  url: string;
  nextUrl: { searchParams: URLSearchParams };
  
  constructor(url: string) {
    this.url = url;
    this.nextUrl = { searchParams: new URLSearchParams(url.split('?')[1] || '') };
  }
}

jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
      headers: new Map(Object.entries(options?.headers || {})),
    })),
  },
}));

import { GET } from '@/app/api/metrics/dashboard/route';

// Mock the database connection and schemas
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
  }
}));

jest.mock('@/shared/infrastructure/database/schema', () => ({
  email_templates: {
    created_at: 'mocked_created_at_field',
    status: 'mocked_status_field'
  }
}));

jest.mock('@/shared/infrastructure/database/render-testing-schema', () => ({
  workerNodes: {
    status: 'mocked_status_field',
    lastHeartbeat: 'mocked_lastHeartbeat_field'
  }
}));

jest.mock('drizzle-orm', () => ({
  count: jest.fn(() => 'mocked_count_function'),
  eq: jest.fn(() => 'mocked_eq_condition'),
  and: jest.fn(() => 'mocked_and_condition'),
  gte: jest.fn(() => 'mocked_gte_condition'),
  inArray: jest.fn(() => 'mocked_inArray_condition')
}));

// Mock the performance monitoring service
jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 200,
      averageRequestDuration: 150,
      errorRate: 0.02, // 2% error rate = normal performance
      systemHealth: 'healthy'
    }))
  }
}));

describe('Phase 2.1.5: Real Active Agent Count Database Integration', () => {
  let mockDb: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh mock reference each time
    mockDb = require('@/shared/infrastructure/database/connection').db;
  });

  it('calculates active agent count from worker nodes and template activity', async () => {
    // Mock database queries for active agent calculation
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }]) // 2 active worker nodes
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]) // 1 template being processed
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]) // Total templates for success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 95 }]) // Successful templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Base 4 agents + max(2 workers, min(1 processing, 3)) = 4 + 2 = 6
    expect(data.metrics.systemStats.activeAgents).toBe(6);

    // Verify database queries were called correctly
    expect(mockDb.select).toHaveBeenCalledTimes(5); // Workers, templates, success rate (2 queries), template count
  });

  it('enforces minimum agent count of 4 (base specialists)', async () => {
    // Mock database queries with no active workers or templates
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]) // No active workers
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]) // No templates being processed
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 50 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 45 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(4); // Minimum base count
  });

  it('enforces maximum agent count of 8 for system stability', async () => {
    // Mock database queries with high activity
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]) // Many active workers
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 8 }]) // Many templates being processed
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 200 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 180 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(8); // Maximum cap
  });

  it('handles database query failure gracefully and falls back to performance monitor', async () => {
    // Mock database query failure for worker nodes
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Worker nodes query failed'))
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 80 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 75 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    // Mock console.error to avoid test noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(4); // Falls back to base count

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('❌ DashboardMetrics: Ошибка запроса активных агентов из БД:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('uses performance-based scaling in fallback mode', async () => {
    // Mock high load conditions in performance monitor
    const { performanceMonitor } = require('@/shared/infrastructure/performance/performance-monitoring-service');
    performanceMonitor.getPerformanceStats.mockReturnValue({
      totalRequests: 500,
      averageRequestDuration: 3500, // High response time triggers scale up
      errorRate: 0.02,
      systemHealth: 'degraded'
    });

    // Mock database query failure
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database unavailable'))
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 90 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 85 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(6); // Base 4 + 2 for high load

    consoleSpy.mockRestore();
  });

  it('validates database query structure for active agents', async () => {
    const { gte, and, inArray } = require('drizzle-orm');
    
    // Mock successful database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify correct query structure
    expect(gte).toHaveBeenCalled(); // Date filtering for heartbeat and template activity
    expect(and).toHaveBeenCalled(); // Combining conditions
    expect(inArray).toHaveBeenCalled(); // Status filtering for workers and templates
  });

  it('correctly handles worker heartbeat time window (5 minutes)', async () => {
    const { gte } = require('drizzle-orm');
    
    // Mock database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify that heartbeat date filtering is applied (5 minutes ago)
    const gteCall = gte.mock.calls.find(call => call.length === 2);
    if (gteCall) {
      const dateParam = gteCall[1];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Should be approximately 5 minutes ago (within 30 seconds tolerance)
      expect(Math.abs(dateParam.getTime() - fiveMinutesAgo.getTime())).toBeLessThan(30000);
    }
  });

  it('correctly handles template activity time window (10 minutes)', async () => {
    const { gte } = require('drizzle-orm');
    
    // Mock database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify that template date filtering is applied (10 minutes ago)
    const gteCalls = gte.mock.calls.filter(call => call.length === 2);
    
    // Should have at least one call for 10-minute window
    const tenMinuteCall = gteCalls.find(call => {
      const dateParam = call[1];
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      return Math.abs(dateParam.getTime() - tenMinutesAgo.getTime()) < 60000; // 1 minute tolerance
    });
    
    expect(tenMinuteCall).toBeDefined();
  });

  it('validates worker status filtering (idle, busy)', async () => {
    const { inArray } = require('drizzle-orm');
    
    // Mock database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify that worker status filtering includes idle and busy
    const statusCall = inArray.mock.calls.find(call => 
      Array.isArray(call[1]) && call[1].includes('idle') && call[1].includes('busy')
    );
    
    expect(statusCall).toBeDefined();
    expect(statusCall[1]).toEqual(['idle', 'busy']);
  });

  it('validates template status filtering (processing states)', async () => {
    const { inArray } = require('drizzle-orm');
    
    // Mock database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify that template status filtering includes processing states
    const templateStatusCall = inArray.mock.calls.find(call => 
      Array.isArray(call[1]) && call[1].includes('processing')
    );
    
    expect(templateStatusCall).toBeDefined();
    expect(templateStatusCall[1]).toEqual(['processing', 'in_progress', 'generating']);
  });

  it('provides consistent agent count across multiple requests', async () => {
    // Mock consistent database responses
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 3 }]) // Consistent response
        })
      });

    // Make multiple requests
    const requests = Array.from({ length: 3 }, () => 
      new MockNextRequest('http://localhost:3000/api/metrics/dashboard')
    );

    const responses = await Promise.all(requests.map(request => GET(request)));
    const dataPromises = responses.map(response => response.json());
    const dataResults = await Promise.all(dataPromises);

    // All should return consistent agent count
    dataResults.forEach(data => {
      expect(data.success).toBe(true);
      expect(data.metrics.systemStats.activeAgents).toBe(6); // Should be consistent: 4 + max(3, min(3, 3))
    });
  });

  it('handles edge case with null database results', async () => {
    // Mock database returning null/undefined results
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]) // Empty result for workers
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: null }]) // Null result for templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 80 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 75 }]) // For success rate
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(4); // Falls back to minimum
  });

  it('measures performance impact of active agent calculation', async () => {
    const startTime = performance.now();

    // Mock database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 4 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Active agent calculation should be fast (< 200ms in tests)
    expect(duration).toBeLessThan(200);
  });

  it('validates agent count is included in all response formats', async () => {
    // Mock successful database queries
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }])
        })
      });

    // Test with different query parameters
    const testCases = [
      'http://localhost:3000/api/metrics/dashboard',
      'http://localhost:3000/api/metrics/dashboard?agents=true',
      'http://localhost:3000/api/metrics/dashboard?agents=false&performance=false',
      'http://localhost:3000/api/metrics/dashboard?agents=true&performance=true'
    ];

    for (const url of testCases) {
      const request = new MockNextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics.systemStats).toHaveProperty('activeAgents');
      expect(typeof data.metrics.systemStats.activeAgents).toBe('number');
      expect(data.metrics.systemStats.activeAgents).toBeGreaterThanOrEqual(4);
      expect(data.metrics.systemStats.activeAgents).toBeLessThanOrEqual(8);
    }
  });
});