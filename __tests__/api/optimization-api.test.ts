/**
 * 🧪 Optimization API Integration Tests
 * 
 * Tests the optimization API endpoints to ensure they work correctly
 * with the optimization dashboard.
 */

import { NextRequest } from 'next/server';
import { GET as OptimizationDemoGET, POST as OptimizationDemoPOST } from '@/app/api/optimization/demo/route';

// Mock the optimization modules
jest.mock('@/agent/optimization/optimization-demo', () => ({
  demonstrateOptimizationSystem: jest.fn().mockResolvedValue(undefined),
  simulateRealWorldOptimization: jest.fn().mockResolvedValue(undefined),
  demonstrateSystemIntegration: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/agent/optimization', () => ({
  createOptimizationService: jest.fn().mockReturnValue({
    initialize: jest.fn().mockResolvedValue(undefined),
    analyzeSystem: jest.fn().mockResolvedValue({
      current_state: {
        system_metrics: {
          system_health_score: 87,
          active_agents: 4,
          overall_success_rate: 94.2,
          average_response_time: 1200
        }
      },
      trends: ['Performance improvement trend'],
      bottlenecks: ['Minor queue bottleneck'],
      error_patterns: ['Occasional timeout pattern'],
      predicted_issues: [],
      overall_health_assessment: 'System operating normally with minor optimization opportunities',
      optimization_opportunities: [
        'Improve cache hit ratio',
        'Optimize database query patterns'
      ]
    }),
    getRecommendations: jest.fn().mockResolvedValue([
      {
        id: 'rec1',
        title: 'Optimize Database Queries',
        description: 'Improve query performance by adding indexes',
        type: 'performance',
        priority: 'high',
        expected_impact: {
          performance_improvement_percent: 20,
          success_rate_improvement_percent: 5,
          response_time_reduction_ms: 300
        },
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: ['Temporary increased memory usage']
        },
        requires_human_approval: false,
        estimated_duration: '2-4 hours'
      }
    ]),
    getStatus: jest.fn().mockReturnValue({
      status: 'running',
      last_analysis: new Date().toISOString(),
      optimization_count: 156
    }),
    shutdown: jest.fn().mockResolvedValue(undefined)
  })
}));

const createMockRequest = (url: string, method: string = 'GET', body?: any): NextRequest => {
  const request = {
    url,
    method,
    json: body ? async () => body : undefined,
    headers: new Headers({
      'content-type': 'application/json'
    })
  } as unknown as NextRequest;
  
  return request;
};

describe('🧪 Optimization API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/optimization/demo', () => {
    it('should run basic demo successfully', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo?type=basic');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
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

    it('should run simulation demo successfully', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo?type=simulation');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.demo.type).toBe('simulation');
      expect(data.demo.features).toContain('Continuous monitoring and optimization');
    });

    it('should run integration demo successfully', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo?type=integration');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.demo.type).toBe('integration');
      expect(data.demo.features).toContain('ValidationMonitor integration');
    });

    it('should handle unknown demo type', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo?type=unknown');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Unknown demo type: unknown');
    });

    it('should default to basic demo when no type specified', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.demo.type).toBe('basic');
    });
  });

  describe('POST /api/optimization/demo', () => {
    it('should analyze system successfully', async () => {
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
      expect(data.analysis.current_state.health_score).toBe(87);
      expect(data.analysis.current_state.active_agents).toBe(4);
      expect(data.analysis.current_state.success_rate).toBe(94.2);
      expect(data.analysis.current_state.average_response_time).toBe(1200);
      expect(data.analysis.insights.trends_detected).toBe(1);
      expect(data.analysis.insights.bottlenecks_found).toBe(1);
    });

    it('should get recommendations successfully', async () => {
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
      expect(data.recommendations.total_count).toBe(1);
      expect(data.recommendations.items).toHaveLength(1);
      
      const rec = data.recommendations.items[0];
      expect(rec.id).toBe('rec1');
      expect(rec.title).toBe('Optimize Database Queries');
      expect(rec.priority).toBe('high');
      expect(rec.safety.risk_level).toBe('low');
      expect(rec.expected_impact.performance_improvement).toBe(20);
    });

    it('should run custom demo successfully', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { 
          action: 'custom_demo',
          config: { enabled: true, optimization_level: 'aggressive' }
        }
      );
      
      const response = await OptimizationDemoPOST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.system_analysis.health_score).toBe(87);
      expect(data.results.recommendations.total_count).toBe(1);
      expect(data.results.service_status.status).toBe('running');
    });

    it('should handle unknown action', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'unknown_action' }
      );
      
      const response = await OptimizationDemoPOST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Unknown action: unknown_action');
      expect(data.error.available_actions).toEqual([
        'custom_demo',
        'analyze_system', 
        'get_recommendations'
      ]);
    });

    it('should handle malformed request body', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST'
      );
      
      // Mock json() to throw an error
      request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      
      const response = await OptimizationDemoPOST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('request_error');
    });
  });

  describe('Error Handling', () => {
    it('should handle optimization service errors gracefully', async () => {
      // Mock the optimization service to throw an error
      const { createOptimizationService } = require('@/agent/optimization');
      createOptimizationService.mockReturnValue({
        initialize: jest.fn().mockRejectedValue(new Error('Service initialization failed')),
        shutdown: jest.fn().mockResolvedValue(undefined)
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
      expect(data.error.message).toContain('Service initialization failed');
    });

    it('should handle demo execution errors gracefully', async () => {
      // Mock the demo function to throw an error
      const { demonstrateOptimizationSystem } = require('@/agent/optimization/optimization-demo');
      demonstrateOptimizationSystem.mockRejectedValue(new Error('Demo execution failed'));

      const request = createMockRequest('http://localhost:3000/api/optimization/demo?type=basic');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Demo execution failed');
      expect(data.error.type).toBe('demo_execution_error');
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted timestamps', async () => {
      const request = createMockRequest('http://localhost:3000/api/optimization/demo');
      
      const response = await OptimizationDemoGET(request);
      const data = await response.json();
      
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should return consistent data structure for system analysis', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'analyze_system' }
      );
      
      const response = await OptimizationDemoPOST(request);
      const data = await response.json();
      
      expect(data).toMatchObject({
        success: expect.any(Boolean),
        timestamp: expect.any(String),
        analysis: {
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
        }
      });
    });

    it('should return consistent data structure for recommendations', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/optimization/demo',
        'POST',
        { action: 'get_recommendations' }
      );
      
      const response = await OptimizationDemoPOST(request);
      const data = await response.json();
      
      expect(data).toMatchObject({
        success: expect.any(Boolean),
        timestamp: expect.any(String),
        recommendations: {
          total_count: expect.any(Number),
          items: expect.any(Array),
          summary: {
            by_priority: expect.any(Object),
            by_risk_level: expect.any(Object),
            safe_to_auto_apply: expect.any(Number)
          }
        }
      });
      
      if (data.recommendations.items.length > 0) {
        const item = data.recommendations.items[0];
        expect(item).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          type: expect.any(String),
          priority: expect.any(String),
          expected_impact: expect.any(Object),
          safety: expect.any(Object),
          estimated_duration: expect.any(String)
        });
      }
    });
  });
});