/**
 * Comprehensive test suite for Phase 2.1.4: Real Success Rate Implementation
 * Tests database-driven success rate calculation with various scenarios
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

// Mock the database connection and schema
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

jest.mock('drizzle-orm', () => ({
  count: jest.fn(() => 'mocked_count_function'),
  eq: jest.fn(() => 'mocked_eq_condition'),
  and: jest.fn(() => 'mocked_and_condition'),
  gte: jest.fn(() => 'mocked_gte_condition')
}));

// Mock the performance monitoring service
jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 200,
      averageRequestDuration: 150,
      errorRate: 0.05, // 5% error rate = 95% fallback success rate
      systemHealth: 'healthy'
    }))
  }
}));

describe('Phase 2.1.4: Real Success Rate Database Integration', () => {
  let mockDb: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh mock reference each time
    mockDb = require('@/shared/infrastructure/database/connection').db;
  });

  it('calculates success rate from database with completed templates', async () => {
    // Mock database queries for success rate calculation
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]) // Total templates
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
    expect(data.metrics.systemStats.successRate).toBe(95); // 95/100 = 95%

    // Verify database queries were called correctly
    expect(mockDb.select).toHaveBeenCalledTimes(3); // Total, successful, and template count
  });

  it('handles zero total templates and falls back to performance monitor', async () => {
    // Mock database queries returning zero templates
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]) // No total templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count fallback
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.successRate).toBe(95); // Falls back to performance monitor (1 - 0.05) * 100
  });

  it('enforces minimum success rate bound of 80%', async () => {
    // Mock database queries with very low success rate
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]) // Total templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]) // Very low successful templates
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
    expect(data.metrics.systemStats.successRate).toBe(80); // Enforced minimum bound
  });

  it('enforces maximum success rate bound of 100%', async () => {
    // Mock database queries with more successful than total (edge case)
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 90 }]) // Total templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]) // More successful than total (data inconsistency)
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
    expect(data.metrics.systemStats.successRate).toBe(100); // Capped at maximum
  });

  it('handles database query failure gracefully', async () => {
    // Mock database query failure
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count still works
      });

    // Mock console.error to avoid test noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.successRate).toBe(95); // Falls back to performance monitor

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Failed to query success rate from database:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('calculates success rate for different time periods correctly', async () => {
    // Test with recent data (should use database)
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 50 }]) // Total templates in last 30 days
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 48 }]) // Successful templates
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
    expect(data.metrics.systemStats.successRate).toBe(96); // 48/50 = 96%
  });

  it('validates database query structure for success rate', async () => {
    const { gte, eq, and } = require('drizzle-orm');
    
    // Mock successful database query
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 80 }]) // Total templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 76 }]) // Successful templates
        })
      })
      .mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 127 }]) // Template count
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify correct query structure
    expect(gte).toHaveBeenCalled(); // Date filtering
    expect(eq).toHaveBeenCalled(); // Status filtering  
    expect(and).toHaveBeenCalled(); // Combining conditions
  });

  it('provides consistent success rate across multiple requests', async () => {
    // Mock consistent database response
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 85 }]) // Consistent response
        })
      });

    // Make multiple requests
    const requests = Array.from({ length: 3 }, () => 
      new MockNextRequest('http://localhost:3000/api/metrics/dashboard')
    );

    const responses = await Promise.all(requests.map(request => GET(request)));
    const dataPromises = responses.map(response => response.json());
    const dataResults = await Promise.all(dataPromises);

    // All should return consistent success rate
    dataResults.forEach(data => {
      expect(data.success).toBe(true);
      expect(data.metrics.systemStats.successRate).toBe(85); // Should be consistent
    });
  });

  it('handles edge case with null database results', async () => {
    // Mock database returning null/undefined results
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]) // Empty result
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
    expect(data.metrics.systemStats.successRate).toBe(95); // Falls back to performance monitor
  });

  it('validates success rate is included in all response formats', async () => {
    // Mock successful database query
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 90 }])
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
      expect(data.metrics.systemStats).toHaveProperty('successRate');
      expect(typeof data.metrics.systemStats.successRate).toBe('number');
      expect(data.metrics.systemStats.successRate).toBeGreaterThanOrEqual(80);
      expect(data.metrics.systemStats.successRate).toBeLessThanOrEqual(100);
    }
  });

  it('measures performance impact of success rate calculation', async () => {
    const startTime = performance.now();

    // Mock database query
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 88 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Success rate calculation should be fast (< 100ms in tests)
    expect(duration).toBeLessThan(100);
  });

  it('validates 30-day window for success rate calculation', async () => {
    const { gte } = require('drizzle-orm');
    
    // Mock database query
    mockDb.select
      .mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 92 }])
        })
      });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify that date filtering is applied (30 days ago)
    expect(gte).toHaveBeenCalled();
    
    // Get the date that was passed to gte
    const gteCall = gte.mock.calls.find(call => call.length === 2);
    if (gteCall) {
      const dateParam = gteCall[1];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Should be approximately 30 days ago (within 1 minute tolerance)
      expect(Math.abs(dateParam.getTime() - thirtyDaysAgo.getTime())).toBeLessThan(60000);
    }
  });
});