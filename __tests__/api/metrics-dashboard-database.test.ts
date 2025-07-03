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
  }
}));

jest.mock('@/shared/infrastructure/database/schema', () => ({
  email_templates: 'mocked_email_templates_table'
}));

jest.mock('drizzle-orm', () => ({
  count: jest.fn(() => 'mocked_count_function')
}));

// Mock the performance monitoring service
jest.mock('@/shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: jest.fn(() => ({
      totalRequests: 200,
      averageRequestDuration: 150,
      errorRate: 0.03,
      systemHealth: 'healthy'
    }))
  }
}));

describe('Dashboard Metrics API Database Integration', () => {
  let mockDb: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get fresh mock reference each time
    mockDb = require('@/shared/infrastructure/database/connection').db;
  });

  it('queries actual template count from database', async () => {
    // Mock successful database query with actual count
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 45 }])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBe(45);

    // Verify database query was called correctly
    expect(mockDb.select).toHaveBeenCalledWith({ count: 'mocked_count_function' });
    expect(mockDb.select().from).toHaveBeenCalledWith('mocked_email_templates_table');
  });

  it('uses minimum base count when database returns zero', async () => {
    
    // Mock database query returning zero templates
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 0 }])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBe(127); // Should use minimum base count

    expect(mockDb.select).toHaveBeenCalled();
  });

  it('uses minimum base count when database returns null', async () => {
    
    // Mock database query returning null/undefined
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBe(127); // Should use minimum base count
  });

  it('falls back to simulation when database query fails', async () => {
    
    // Mock database query throwing an error
    mockDb.select.mockReturnValue({
      from: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    });

    // Mock console.error to avoid test noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBeGreaterThanOrEqual(127); // Should fall back to simulation

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Failed to query template count from database:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('returns actual count when higher than base minimum', async () => {
    
    // Mock database query returning count higher than base
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 250 }])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBe(250); // Should return actual count

    expect(mockDb.select).toHaveBeenCalled();
  });

  it('handles database connection timeout gracefully', async () => {
    
    // Mock database query timing out
    mockDb.select.mockReturnValue({
      from: jest.fn().mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 100);
      }))
    });

    // Mock console.error to avoid test noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBeGreaterThanOrEqual(127); // Should fall back

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Failed to query template count from database:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('validates database query structure', async () => {
    const { count } = require('drizzle-orm');
    
    // Mock successful database query
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 88 }])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    await GET(request);

    // Verify correct query structure
    expect(mockDb.select).toHaveBeenCalledWith({ count: 'mocked_count_function' });
    expect(count).toHaveBeenCalled();
  });

  it('includes database template count in all response formats', async () => {
    
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 156 }])
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
      expect(data.metrics.systemStats.templateCount).toBe(156);
    }
  });

  it('handles malformed database response', async () => {
    
    // Mock database returning malformed response
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ invalidField: 'not a count' }])
    });

    const request = new MockNextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.templateCount).toBe(127); // Should use fallback minimum
  });

  it('performs consistently across multiple requests', async () => {
    
    // Mock database query returning consistent count
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue([{ count: 73 }])
    });

    // Make multiple requests
    const requests = Array.from({ length: 5 }, () => 
      new MockNextRequest('http://localhost:3000/api/metrics/dashboard')
    );

    const responses = await Promise.all(requests.map(request => GET(request)));
    const dataPromises = responses.map(response => response.json());
    const dataResults = await Promise.all(dataPromises);

    // All should return the same template count
    dataResults.forEach(data => {
      expect(data.success).toBe(true);
      expect(data.metrics.systemStats.templateCount).toBe(73);
    });

    // Database should have been queried for each request
    expect(mockDb.select).toHaveBeenCalledTimes(5);
  });
});