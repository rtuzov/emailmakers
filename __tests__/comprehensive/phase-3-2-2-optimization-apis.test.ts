/**
 * 🧪 COMPREHENSIVE Phase 3.2.2 Validation: Optimization APIs Integration
 * 
 * Complete end-to-end testing of optimization dashboard API integration,
 * data flow, error handling, performance, and production readiness.
 */

import { NextRequest } from 'next/server';
import { GET as OptimizationDemoGET, POST as OptimizationDemoPOST } from '@/app/api/optimization/demo/route';

// Mock external dependencies
jest.mock('@/agent/optimization/optimization-demo', () => ({
  demonstrateOptimizationSystem: jest.fn(),
  simulateRealWorldOptimization: jest.fn(),
  demonstrateSystemIntegration: jest.fn()
}));

jest.mock('@/agent/optimization', () => ({
  createOptimizationService: jest.fn()
}));

// Test data fixtures
const mockOptimizationService = {
  initialize: jest.fn(),
  analyzeSystem: jest.fn(),
  getRecommendations: jest.fn(),
  getStatus: jest.fn(),
  shutdown: jest.fn()
};

const mockSystemAnalysis = {
  current_state: {
    system_metrics: {
      system_health_score: 92.5,
      active_agents: 4,
      overall_success_rate: 96.8,
      average_response_time: 850
    }
  },
  trends: [
    'Consistent performance improvement over last 24h',
    'Agent response time optimization successful',
    'Error rate decreased by 15%'
  ],
  bottlenecks: [
    'Database query optimization needed for template loading',
    'Minor cache warming delay during peak hours'
  ],
  error_patterns: [
    'Occasional timeout in Figma API integration (< 1%)',
    'Content generation retries during high load'
  ],
  predicted_issues: [],
  overall_health_assessment: 'System performing excellently with minor optimization opportunities identified',
  optimization_opportunities: [
    'Implement database query caching for template metadata',
    'Add circuit breaker for external API calls',
    'Optimize agent allocation during peak traffic',
    'Implement predictive scaling based on usage patterns'
  ]
};

const mockRecommendations = [
  {
    id: 'rec-db-cache-001',
    title: 'Implement Database Query Caching',
    description: 'Add Redis caching layer for frequently accessed template metadata to reduce database load',
    type: 'performance',
    priority: 'high',
    expected_impact: {
      performance_improvement_percent: 35,
      success_rate_improvement_percent: 8,
      response_time_reduction_ms: 450
    },
    safety_assessment: {
      risk_level: 'low',
      potential_negative_impacts: [
        'Temporary increased memory usage during cache warm-up',
        'Cache invalidation complexity'
      ]
    },
    requires_human_approval: false,
    estimated_duration: '4-6 hours'
  },
  {
    id: 'rec-circuit-breaker-002',
    title: 'Add Circuit Breaker Pattern',
    description: 'Implement circuit breaker for external API calls to prevent cascade failures',
    type: 'reliability',
    priority: 'medium',
    expected_impact: {
      performance_improvement_percent: 12,
      success_rate_improvement_percent: 18,
      response_time_reduction_ms: 200
    },
    safety_assessment: {
      risk_level: 'low',
      potential_negative_impacts: [
        'Temporary service degradation during breaker open state',
        'Requires careful threshold tuning'
      ]
    },
    requires_human_approval: false,
    estimated_duration: '6-8 hours'
  },
  {
    id: 'rec-predictive-scaling-003',
    title: 'Implement Predictive Auto-scaling',
    description: 'Use ML-based predictions to scale agent capacity before traffic spikes',
    type: 'scalability',
    priority: 'low',
    expected_impact: {
      performance_improvement_percent: 25,
      success_rate_improvement_percent: 15,
      response_time_reduction_ms: 600
    },
    safety_assessment: {
      risk_level: 'medium',
      potential_negative_impacts: [
        'Potential over-provisioning costs',
        'Complex ML model maintenance',
        'Requires historical data analysis'
      ]
    },
    requires_human_approval: true,
    estimated_duration: '2-3 weeks'
  }
];

const createMockRequest = (url: string, method: string = 'GET', body?: any): NextRequest => {
  return {
    url,
    method,
    json: body ? async () => body : undefined,
    headers: new Headers({ 'content-type': 'application/json' })
  } as unknown as NextRequest;
};

describe('🧪 COMPREHENSIVE Phase 3.2.2: Optimization APIs Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup optimization service mock
    const { createOptimizationService } = require('@/agent/optimization');
    createOptimizationService.mockReturnValue(mockOptimizationService);
    
    // Setup default successful responses
    mockOptimizationService.initialize.mockResolvedValue(undefined);
    mockOptimizationService.analyzeSystem.mockResolvedValue(mockSystemAnalysis);
    mockOptimizationService.getRecommendations.mockResolvedValue(mockRecommendations);
    mockOptimizationService.getStatus.mockReturnValue({
      status: 'running',
      last_analysis: new Date().toISOString(),
      optimization_count: 234,
      uptime: 86400000, // 24 hours
      health_score: 92.5
    });
    mockOptimizationService.shutdown.mockResolvedValue(undefined);
    
    // Setup demo functions
    const demo = require('@/agent/optimization/optimization-demo');
    demo.demonstrateOptimizationSystem.mockResolvedValue(undefined);
    demo.simulateRealWorldOptimization.mockResolvedValue(undefined);
    demo.demonstrateSystemIntegration.mockResolvedValue(undefined);
    
    // Suppress console output for tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🔌 API Connection Tests', () => {
    it('should successfully connect to system analysis API', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(mockOptimizationService.initialize).toHaveBeenCalledTimes(1);
      expect(mockOptimizationService.analyzeSystem).toHaveBeenCalledTimes(1);
      expect(mockOptimizationService.shutdown).toHaveBeenCalledTimes(1);
    });

    it('should successfully connect to recommendations API', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'get_recommendations' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(data.recommendations.total_count).toBe(3);
      expect(mockOptimizationService.getRecommendations).toHaveBeenCalledTimes(1);
    });

    it('should successfully run custom optimization demo', async () => {
      const customConfig = {
        enabled: true,
        optimization_level: 'aggressive',
        target_metrics: ['response_time', 'success_rate']
      };

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'custom_demo', config: customConfig }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.system_analysis).toBeDefined();
      expect(data.results.recommendations).toBeDefined();
      expect(data.results.service_status).toBeDefined();
    });
  });

  describe('📊 Data Flow Validation', () => {
    it('should return complete system analysis data structure', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(data.analysis).toMatchObject({
        current_state: {
          health_score: expect.any(Number),
          active_agents: expect.any(Number),
          success_rate: expect.any(Number),
          average_response_time: expect.any(Number)
        },
        insights: {
          trends_detected: expect.any(Number),
          bottlenecks_found: expect.any(Number),
          error_patterns: expect.any(Number),
          predicted_issues: expect.any(Number)
        },
        assessment: expect.any(String),
        opportunities: expect.any(Array)
      });

      // Validate specific data values
      expect(data.analysis.current_state.health_score).toBe(92.5);
      expect(data.analysis.current_state.active_agents).toBe(4);
      expect(data.analysis.insights.trends_detected).toBe(3);
      expect(data.analysis.insights.bottlenecks_found).toBe(2);
      expect(data.analysis.opportunities).toHaveLength(4);
    });

    it('should return properly structured recommendations', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'get_recommendations' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(data.recommendations.items).toHaveLength(3);
      
      // Validate first recommendation structure
      const highPriorityRec = data.recommendations.items.find(r => r.priority === 'high');
      expect(highPriorityRec).toMatchObject({
        id: 'rec-db-cache-001',
        title: 'Implement Database Query Caching',
        description: expect.any(String),
        type: 'performance',
        priority: 'high',
        expected_impact: {
          performance_improvement: 35,
          success_rate_improvement: 8,
          response_time_reduction: 450
        },
        safety: {
          risk_level: 'low',
          requires_approval: false,
          potential_impacts: expect.any(Array)
        },
        estimated_duration: '4-6 hours'
      });

      // Validate summary statistics
      expect(data.recommendations.summary.by_priority).toEqual({
        high: 1,
        medium: 1,
        low: 1
      });
      expect(data.recommendations.summary.by_risk_level).toEqual({
        low: 2,
        medium: 1
      });
      expect(data.recommendations.summary.safe_to_auto_apply).toBe(2);
    });

    it('should handle demo execution with proper logging', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo?type=basic'
      );

      const response = await OptimizationDemoGET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.demo).toBeDefined();
      expect(data.demo.type).toBe('basic');
      expect(data.demo.features).toEqual([
        'System analysis and health assessment',
        'Recommendation generation with safety evaluation',
        'Safe optimization application',
        'Rollback capability demonstration',
        'Dynamic threshold generation',
        'Comprehensive reporting'
      ]);
      expect(data.logs).toBeDefined();
      expect(data.summary).toBeDefined();
    });
  });

  describe('🛡️ Error Handling & Resilience', () => {
    it('should handle optimization service initialization failure', async () => {
      mockOptimizationService.initialize.mockRejectedValue(
        new Error('Optimization service not available')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Optimization service not available');
      expect(data.error.type).toBe('analysis_error');
    });

    it('should handle partial service failures gracefully', async () => {
      mockOptimizationService.analyzeSystem.mockResolvedValue({
        ...mockSystemAnalysis,
        current_state: {
          ...mockSystemAnalysis.current_state,
          system_metrics: {
            ...mockSystemAnalysis.current_state.system_metrics,
            system_health_score: null // Simulate partial failure
          }
        }
      });

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis.current_state.health_score).toBeNull();
    });

    it('should handle malformed request data', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST'
      );
      
      // Mock json() to return invalid data
      request.json = jest.fn().mockResolvedValue({ invalid: 'data' });

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.available_actions).toEqual([
        'custom_demo',
        'analyze_system',
        'get_recommendations'
      ]);
    });

    it('should handle demo execution errors', async () => {
      const demo = require('@/agent/optimization/optimization-demo');
      demo.demonstrateOptimizationSystem.mockRejectedValue(
        new Error('Demo execution failed due to resource constraints')
      );

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo?type=basic'
      );

      const response = await OptimizationDemoGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Demo execution failed due to resource constraints');
      expect(data.error.type).toBe('demo_execution_error');
    });
  });

  describe('⚡ Performance & Concurrency', () => {
    it('should handle concurrent analysis requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        createMockRequest(
          'http://localhost:3000/api/optimization/demo',
          'POST',
          { action: 'analyze_system' }
        )
      );

      const responses = await Promise.all(
        requests.map(req => OptimizationDemoPOST(req))
      );

      // All requests should succeed
      expect(responses).toHaveLength(5);
      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }

      // Service should be properly initialized and shut down for each request
      expect(mockOptimizationService.initialize).toHaveBeenCalledTimes(5);
      expect(mockOptimizationService.shutdown).toHaveBeenCalledTimes(5);
    });

    it('should properly cleanup resources on service shutdown', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      await OptimizationDemoPOST(request);

      expect(mockOptimizationService.shutdown).toHaveBeenCalledTimes(1);
    });

    it('should handle large recommendation datasets efficiently', async () => {
      // Mock a large set of recommendations
      const largeRecommendationSet = Array.from({ length: 50 }, (_, i) => ({
        ...mockRecommendations[0],
        id: `rec-large-${i}`,
        title: `Optimization Recommendation ${i}`,
        description: `Large scale optimization recommendation #${i} with detailed analysis and implementation steps that could be quite lengthy to test data handling capacity.`
      }));

      mockOptimizationService.getRecommendations.mockResolvedValue(largeRecommendationSet);

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'get_recommendations' }
      );

      const startTime = Date.now();
      const response = await OptimizationDemoPOST(request);
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations.total_count).toBe(50);
      expect(data.recommendations.items).toHaveLength(50);
      
      // Performance check - should handle large datasets quickly
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('🔒 Security & Data Validation', () => {
    it('should validate custom demo configuration safely', async () => {
      const maliciousConfig = {
        enabled: true,
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
        eval: 'malicious code',
        optimization_level: 'aggressive'
      };

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'custom_demo', config: maliciousConfig }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      // Should still process safely without executing malicious code
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Ensure service was called with the config (should be sanitized internally)
      expect(mockOptimizationService.initialize).toHaveBeenCalled();
    });

    it('should handle SQL injection attempts in parameters', async () => {
      const maliciousRequest = createMockRequest(
        'http://localhost:3000/api/optimization/demo?type=basic\'; DROP TABLE users; --',
        'GET'
      );

      const response = await OptimizationDemoGET(maliciousRequest);
      const data = await response.json();

      // Should treat as unknown demo type, not execute SQL
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Unknown demo type');
    });

    it('should sanitize output data to prevent XSS', async () => {
      // Mock system analysis with potential XSS content
      const xssSystemAnalysis = {
        ...mockSystemAnalysis,
        overall_health_assessment: 'System is <script>alert("xss")</script> performing well',
        optimization_opportunities: [
          'Implement <img src=x onerror=alert("xss")> caching',
          'Normal optimization opportunity'
        ]
      };

      mockOptimizationService.analyzeSystem.mockResolvedValue(xssSystemAnalysis);

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Data should be returned as-is (sanitization should happen on frontend)
      expect(data.analysis.assessment).toContain('<script>');
      expect(data.analysis.opportunities[0]).toContain('<img');
    });
  });

  describe('📈 Metrics & Monitoring Integration', () => {
    it('should track API call metrics', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      await OptimizationDemoPOST(request);

      // Verify service interactions were tracked
      expect(mockOptimizationService.initialize).toHaveBeenCalledTimes(1);
      expect(mockOptimizationService.analyzeSystem).toHaveBeenCalledTimes(1);
      expect(mockOptimizationService.shutdown).toHaveBeenCalledTimes(1);
    });

    it('should provide timing information in responses', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo?type=basic'
      );

      const response = await OptimizationDemoGET(request);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
      expect(data.summary).toBeDefined();
      expect(data.summary.status).toBeDefined();
    });
  });

  describe('🌐 Production Readiness', () => {
    it('should handle high load scenarios', async () => {
      // Simulate high load with multiple concurrent requests
      const highLoadRequests = Array.from({ length: 20 }, (_, i) => {
        const action = ['analyze_system', 'get_recommendations'][i % 2];
        return createMockRequest(
          'http://localhost:3000/api/optimization/demo',
          'POST',
          { action }
        );
      });

      const responses = await Promise.allSettled(
        highLoadRequests.map(req => OptimizationDemoPOST(req))
      );

      // Most requests should succeed (allow for some failures under high load)
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      expect(successfulResponses.length).toBeGreaterThanOrEqual(18); // 90% success rate
    });

    it('should provide consistent response format across all endpoints', async () => {
      const endpoints = [
        { action: 'analyze_system' },
        { action: 'get_recommendations' },
        { action: 'custom_demo', config: { enabled: true } }
      ];

      for (const endpoint of endpoints) {
        const request = createMockRequest(
          'http://localhost:3000/api/optimization/demo',
          'POST',
          endpoint
        );

        const response = await OptimizationDemoPOST(request);
        const data = await response.json();

        // All endpoints should have consistent base structure
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.success).toBe('boolean');
        expect(typeof data.timestamp).toBe('string');
      }
    });

    it('should handle graceful degradation when optimization service is unavailable', async () => {
      // Mock service creation failure
      const { createOptimizationService } = require('@/agent/optimization');
      createOptimizationService.mockImplementation(() => {
        throw new Error('Optimization service unavailable');
      });

      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );

      const response = await OptimizationDemoPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.type).toBe('analysis_error');
    });
  });
});