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
import { GET } from '@/app/api/metrics/dashboard/route';

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

describe('Dashboard Metrics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns comprehensive dashboard metrics', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('metrics');

    const metrics = data.metrics;

    // Check system stats
    expect(metrics.systemStats).toHaveProperty('templateCount');
    expect(metrics.systemStats).toHaveProperty('successRate');
    expect(metrics.systemStats).toHaveProperty('activeAgents');
    expect(metrics.systemStats).toHaveProperty('totalRequests');
    expect(metrics.systemStats).toHaveProperty('averageResponseTime');
    expect(metrics.systemStats).toHaveProperty('errorRate');
    expect(metrics.systemStats).toHaveProperty('uptime');

    // Check recent metrics
    expect(metrics.recent).toHaveProperty('generatedTemplates');
    expect(metrics.recent).toHaveProperty('failedRequests');
    expect(metrics.recent).toHaveProperty('averageQualityScore');
    expect(metrics.recent).toHaveProperty('totalUsers');

    // Validate data types and ranges
    expect(typeof metrics.systemStats.templateCount).toBe('number');
    expect(metrics.systemStats.templateCount).toBeGreaterThan(0);
    expect(metrics.systemStats.successRate).toBeGreaterThanOrEqual(0);
    expect(metrics.systemStats.successRate).toBeLessThanOrEqual(100);
    expect(metrics.systemStats.activeAgents).toBeGreaterThan(0);
  });

  it('includes agent metrics by default', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const metrics = data.metrics;

    expect(metrics).toHaveProperty('agentMetrics');
    expect(metrics.agentMetrics).toHaveProperty('contentSpecialist');
    expect(metrics.agentMetrics).toHaveProperty('designSpecialist');
    expect(metrics.agentMetrics).toHaveProperty('qualitySpecialist');
    expect(metrics.agentMetrics).toHaveProperty('deliverySpecialist');

    // Check agent metric structure
    const contentAgent = metrics.agentMetrics.contentSpecialist;
    expect(contentAgent).toHaveProperty('status');
    expect(contentAgent).toHaveProperty('processedJobs');
    expect(contentAgent).toHaveProperty('successRate');
    expect(contentAgent).toHaveProperty('averageProcessingTime');

    expect(['active', 'idle', 'error']).toContain(contentAgent.status);
    expect(typeof contentAgent.processedJobs).toBe('number');
    expect(contentAgent.successRate).toBeGreaterThanOrEqual(0);
    expect(contentAgent.successRate).toBeLessThanOrEqual(100);
  });

  it('excludes agent metrics when agents=false', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard?agents=false');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const metrics = data.metrics;

    expect(metrics).toHaveProperty('systemStats');
    expect(metrics).toHaveProperty('recent');
    expect(metrics).not.toHaveProperty('agentMetrics');
  });

  it('includes performance metrics by default', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const metrics = data.metrics;

    expect(metrics).toHaveProperty('performance');
    expect(metrics.performance).toHaveProperty('memoryUsage');
    expect(metrics.performance).toHaveProperty('cpuUsage');
    expect(metrics.performance).toHaveProperty('diskUsage');
    expect(metrics.performance).toHaveProperty('responseTime');

    // Check memory usage structure
    expect(metrics.performance.memoryUsage).toHaveProperty('used');
    expect(metrics.performance.memoryUsage).toHaveProperty('total');
    expect(metrics.performance.memoryUsage).toHaveProperty('percentage');

    // Check response time structure
    expect(metrics.performance.responseTime).toHaveProperty('p50');
    expect(metrics.performance.responseTime).toHaveProperty('p95');
    expect(metrics.performance.responseTime).toHaveProperty('p99');
  });

  it('excludes performance metrics when performance=false', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard?performance=false');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const metrics = data.metrics;

    expect(metrics).toHaveProperty('systemStats');
    expect(metrics).toHaveProperty('recent');
    expect(metrics).not.toHaveProperty('performance');
  });

  it('handles both query parameters correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard?agents=false&performance=false');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const metrics = data.metrics;

    expect(metrics).toHaveProperty('systemStats');
    expect(metrics).toHaveProperty('recent');
    expect(metrics).not.toHaveProperty('agentMetrics');
    expect(metrics).not.toHaveProperty('performance');
  });

  it('calculates success rate correctly', async () => {
    // Mock different error rates
    const performanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
    
    performanceMonitor.getPerformanceStats.mockReturnValueOnce({
      totalRequests: 100,
      averageRequestDuration: 120,
      errorRate: 0.05, // 5% error rate = 95% success rate
      systemHealth: 'healthy'
    });

    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.successRate).toBe(95);
    expect(data.metrics.systemStats.errorRate).toBe(5);
  });

  it('adjusts agent count based on performance', async () => {
    const performanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
    
    // Test high response time scenario
    performanceMonitor.getPerformanceStats.mockReturnValueOnce({
      totalRequests: 100,
      averageRequestDuration: 3500, // High response time should scale up agents
      errorRate: 0.02,
      systemHealth: 'degraded'
    });

    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(6); // Base 4 + 2 for high load
  });

  it('scales down agents on high error rate', async () => {
    const performanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
    
    performanceMonitor.getPerformanceStats.mockReturnValueOnce({
      totalRequests: 100,
      averageRequestDuration: 120,
      errorRate: 0.08, // High error rate should scale down agents
      systemHealth: 'unhealthy'
    });

    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metrics.systemStats.activeAgents).toBe(3); // Base 4 - 1 for errors
  });

  it('simulates template count growth', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    // Template count should be at least the base 127
    expect(data.metrics.systemStats.templateCount).toBeGreaterThanOrEqual(127);
  });

  it('sets correct cache headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });

  it('handles errors gracefully', async () => {
    // Mock an error in performance monitoring
    const performanceMonitor = require('@/shared/infrastructure/performance/performance-monitoring-service').performanceMonitor;
    performanceMonitor.getPerformanceStats.mockImplementationOnce(() => {
      throw new Error('Performance monitoring failed');
    });

    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
  });

  it('validates recent metrics structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const recent = data.metrics.recent;

    // Check data types and reasonable ranges
    expect(typeof recent.generatedTemplates).toBe('number');
    expect(recent.generatedTemplates).toBeGreaterThanOrEqual(0);
    expect(recent.generatedTemplates).toBeLessThanOrEqual(20); // Reasonable upper bound

    expect(typeof recent.failedRequests).toBe('number');
    expect(recent.failedRequests).toBeGreaterThanOrEqual(0);
    expect(recent.failedRequests).toBeLessThanOrEqual(10); // Should be relatively low

    expect(typeof recent.averageQualityScore).toBe('number');
    expect(recent.averageQualityScore).toBeGreaterThanOrEqual(80); // Should be high quality
    expect(recent.averageQualityScore).toBeLessThanOrEqual(100);

    expect(typeof recent.totalUsers).toBe('number');
    expect(recent.totalUsers).toBeGreaterThan(100); // Reasonable user base
  });

  it('provides consistent agent metrics', async () => {
    const request = new NextRequest('http://localhost:3000/api/metrics/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    const agents = data.metrics.agentMetrics;

    // Check that all agents have consistent metric structures
    Object.values(agents).forEach(agent => {
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('processedJobs');
      expect(agent).toHaveProperty('successRate');
      expect(agent).toHaveProperty('averageProcessingTime');

      expect(['active', 'idle', 'error']).toContain(agent.status);
      expect(typeof agent.processedJobs).toBe('number');
      expect(agent.processedJobs).toBeGreaterThanOrEqual(0);
      expect(agent.successRate).toBeGreaterThanOrEqual(0);
      expect(agent.successRate).toBeLessThanOrEqual(100);
      expect(agent.averageProcessingTime).toBeGreaterThan(0);
    });
  });
});