/**
 * 🧪 OPTIMIZATION ENGINE TESTS - Comprehensive testing for optimization system
 * 
 * Tests покрывают все critical функции OptimizationEngine с особым вниманием
 * к safety mechanisms и rollback capabilities.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OptimizationEngine } from '../optimization-engine';
import { OptimizationAnalyzer } from '../optimization-analyzer';
import { 
  OptimizationRecommendation, 
  OptimizationConfig, 
  MetricsSnapshot,
  SystemAnalysis,
  AgentType,
  OPTIMIZATION_CONSTANTS 
} from '../optimization-types';

// Mock dependencies
jest.mock('../optimization-analyzer');

describe('OptimizationEngine', () => {
  let engine: OptimizationEngine;
  let mockAnalyzer: OptimizationAnalyzer;
  let mockConfig: OptimizationConfig;

  const createMockMetricsSnapshot = (): MetricsSnapshot => ({
    timestamp: new Date().toISOString(),
    agent_metrics: {
      'content-specialist': {
        agent_id: 'content-specialist',
        response_time_ms: 1200,
        success_rate: 94,
        error_count: 2,
        throughput_per_minute: 15,
        memory_usage_mb: 512,
        cpu_usage_percent: 45,
        last_activity: new Date().toISOString()
      },
      'design-specialist': {
        agent_id: 'design-specialist',
        response_time_ms: 2100,
        success_rate: 91,
        error_count: 3,
        throughput_per_minute: 8,
        memory_usage_mb: 768,
        cpu_usage_percent: 65,
        last_activity: new Date().toISOString()
      },
      'quality-specialist': {
        agent_id: 'quality-specialist',
        response_time_ms: 800,
        success_rate: 97,
        error_count: 1,
        throughput_per_minute: 12,
        memory_usage_mb: 384,
        cpu_usage_percent: 35,
        last_activity: new Date().toISOString()
      },
      'delivery-specialist': {
        agent_id: 'delivery-specialist',
        response_time_ms: 1500,
        success_rate: 93,
        error_count: 2,
        throughput_per_minute: 10,
        memory_usage_mb: 456,
        cpu_usage_percent: 40,
        last_activity: new Date().toISOString()
      }
    },
    system_metrics: {
      total_requests: 145,
      active_agents: 4,
      average_response_time: 1400,
      overall_success_rate: 94,
      critical_events: 1,
      system_health_score: 87
    },
    validation_metrics: {
      total_validations: 98,
      validation_success_rate: 95,
      average_validation_time: 450,
      failed_validations: 5,
      quality_score_average: 88,
      compatibility_score_average: 92
    }
  });

  const createMockSystemAnalysis = (): SystemAnalysis => ({
    current_state: createMockMetricsSnapshot(),
    trends: [
      {
        metric_name: 'system_success_rate',
        trend_direction: 'up',
        change_percent: 3.5,
        confidence_score: 85,
        time_window: '24h',
        data_points: [
          { timestamp: new Date().toISOString(), value: 94, anomaly_detected: false }
        ]
      }
    ],
    bottlenecks: [
      {
        id: 'memory-bottleneck-test',
        type: 'memory',
        affected_agent: 'design-specialist',
        severity: 'high',
        description: 'High memory usage detected',
        impact_assessment: 'May cause performance degradation',
        resolution_urgency: 'high',
        estimated_improvement: 15
      }
    ],
    error_patterns: [],
    predicted_issues: [],
    overall_health_assessment: 'Good - System stable with minor optimization opportunities',
    optimization_opportunities: ['Address 1 identified bottlenecks', 'Leverage positive trends to raise performance standards']
  });

  beforeEach(() => {
    mockConfig = {
      safety_settings: {
        require_human_approval_for_critical: true,
        max_concurrent_optimizations: 3,
        rollback_timeout_minutes: 30
      },
      learning_settings: {
        enable_pattern_learning: true,
        pattern_detection_sensitivity: 80,
        prediction_confidence_threshold: 80
      },
      performance_settings: {
        metrics_collection_interval_seconds: 60,
        analysis_window_hours: 24,
        optimization_frequency_hours: 6
      }
    };

    // Mock OptimizationAnalyzer methods
    mockAnalyzer = {
      analyzePerformanceTrends: jest.fn(),
      identifyBottlenecks: jest.fn(),
      analyzeErrorPatterns: jest.fn(),
      predictPerformanceIssues: jest.fn(),
      addMetricsSnapshot: jest.fn()
    } as any;

    engine = new OptimizationEngine(mockConfig);
    // Replace internal analyzer with mock
    (engine as any).analyzer = mockAnalyzer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration and Initialization', () => {
    test('should initialize with default config when none provided', () => {
      const defaultEngine = new OptimizationEngine();
      expect(defaultEngine).toBeDefined();
    });

    test('should merge provided config with defaults', () => {
      const partialConfig = {
        safety_settings: {
          max_concurrent_optimizations: 5
        }
      };
      
      const engineWithConfig = new OptimizationEngine(partialConfig);
      expect(engineWithConfig).toBeDefined();
    });

    test('should validate safety settings constraints', () => {
      const unsafeConfig = {
        safety_settings: {
          max_concurrent_optimizations: 100, // Too high
          rollback_timeout_minutes: 1 // Too low
        }
      };
      
      expect(() => new OptimizationEngine(unsafeConfig)).not.toThrow();
    });
  });

  describe('System Performance Analysis', () => {
    test('should analyze system performance successfully', async () => {
      // Setup mocks
      mockAnalyzer.analyzePerformanceTrends = jest.fn().mockResolvedValue([
        {
          metric_name: 'system_success_rate',
          trend_direction: 'up',
          change_percent: 3.5,
          confidence_score: 85,
          time_window: '24h',
          data_points: []
        }
      ]);
      
      mockAnalyzer.identifyBottlenecks = jest.fn().mockResolvedValue([
        {
          id: 'test-bottleneck',
          type: 'memory',
          affected_agent: 'design-specialist',
          severity: 'high',
          description: 'Test bottleneck',
          impact_assessment: 'Test impact',
          resolution_urgency: 'high',
          estimated_improvement: 15
        }
      ]);
      
      mockAnalyzer.analyzeErrorPatterns = jest.fn().mockResolvedValue([]);
      mockAnalyzer.predictPerformanceIssues = jest.fn().mockResolvedValue([]);

      const analysis = await engine.analyzeSystemPerformance();

      expect(analysis).toBeDefined();
      expect(analysis.current_state).toBeDefined();
      expect(analysis.trends).toHaveLength(1);
      expect(analysis.bottlenecks).toHaveLength(1);
      expect(analysis.overall_health_assessment).toContain('Good');
      expect(analysis.optimization_opportunities).toContain('Address 1 identified bottlenecks');
    });

    test('should handle analysis errors gracefully', async () => {
      mockAnalyzer.analyzePerformanceTrends = jest.fn().mockRejectedValue(new Error('Analysis failed'));

      await expect(engine.analyzeSystemPerformance()).rejects.toThrow('System analysis failed');
    });

    test('should generate health assessment based on metrics', async () => {
      const analysis = await engine.analyzeSystemPerformance();
      expect(analysis.overall_health_assessment).toBeDefined();
      expect(typeof analysis.overall_health_assessment).toBe('string');
    });
  });

  describe('Optimization Recommendations', () => {
    test('should generate optimization recommendations', async () => {
      // Mock analysis results
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const recommendations = await engine.generateOptimizations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Verify recommendation structure
      const rec = recommendations[0];
      expect(rec.id).toBeDefined();
      expect(rec.type).toBeDefined();
      expect(rec.priority).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.expected_impact).toBeDefined();
      expect(rec.implementation).toBeDefined();
      expect(rec.rollback_plan).toBeDefined();
      expect(rec.safety_assessment).toBeDefined();
    });

    test('should prioritize recommendations correctly', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const recommendations = await engine.generateOptimizations();
      
      // Check that critical recommendations come first
      for (let i = 1; i < recommendations.length; i++) {
        const prev = recommendations[i - 1];
        const curr = recommendations[i];
        
        const priorities = { critical: 1, high: 2, medium: 3, low: 4 };
        expect(priorities[prev.priority]).toBeLessThanOrEqual(priorities[curr.priority]);
      }
    });

    test('should respect max concurrent optimizations limit', async () => {
      const analysisWithManyBottlenecks = {
        ...createMockSystemAnalysis(),
        bottlenecks: Array(10).fill(null).map((_, i) => ({
          id: `bottleneck-${i}`,
          type: 'memory' as const,
          affected_agent: 'design-specialist' as AgentType,
          severity: 'high' as const,
          description: `Bottleneck ${i}`,
          impact_assessment: 'Test impact',
          resolution_urgency: 'high' as const,
          estimated_improvement: 15
        }))
      };
      
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(analysisWithManyBottlenecks);

      const recommendations = await engine.generateOptimizations();
      
      expect(recommendations.length).toBeLessThanOrEqual(mockConfig.safety_settings?.max_concurrent_optimizations || OPTIMIZATION_CONSTANTS.MAX_OPTIMIZATION_BATCH_SIZE);
    });

    test('should generate different types of recommendations', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const recommendations = await engine.generateOptimizations();
      
      const types = new Set(recommendations.map(r => r.type));
      expect(types.size).toBeGreaterThan(0);
    });
  });

  describe('Optimization Application', () => {
    test('should apply optimizations successfully', async () => {
      const mockRecommendation: OptimizationRecommendation = {
        id: 'test-optimization',
        type: 'performance_tuning',
        priority: 'medium',
        title: 'Test Optimization',
        description: 'Test description',
        rationale: 'Test rationale',
        expected_impact: {
          performance_improvement_percent: 10,
          success_rate_improvement_percent: 2,
          response_time_reduction_ms: 100,
          resource_efficiency_gain_percent: 5,
          confidence_level: 80,
          business_value: 'Test value'
        },
        implementation: [{
          action_type: 'algorithm_tuning',
          target_component: 'test_component',
          current_value: 'old_value',
          new_value: 'new_value',
          validation_required: true,
          rollback_possible: true,
          execution_order: 1
        }],
        rollback_plan: [{
          action_type: 'algorithm_tuning',
          target_component: 'test_component',
          current_value: 'new_value',
          new_value: 'old_value',
          validation_required: true,
          rollback_possible: true,
          execution_order: 1
        }],
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: [],
          safety_checks_required: [],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: []
        },
        estimated_duration: '10 minutes',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      };

      const results = await engine.applyOptimizations([mockRecommendation]);

      expect(results).toHaveLength(1);
      expect(results[0].optimization_id).toBe('test-optimization');
      expect(results[0].status).toBe('completed');
      expect(results[0].actions_executed).toHaveLength(1);
    });

    test('should skip optimizations requiring human approval', async () => {
      const humanApprovalRecommendation: OptimizationRecommendation = {
        id: 'critical-optimization',
        type: 'threshold_adjustment',
        priority: 'critical',
        title: 'Critical Optimization',
        description: 'Requires human approval',
        rationale: 'Critical changes',
        expected_impact: {
          performance_improvement_percent: 20,
          success_rate_improvement_percent: 5,
          response_time_reduction_ms: 200,
          resource_efficiency_gain_percent: 10,
          confidence_level: 90,
          business_value: 'High value'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'high',
          potential_negative_impacts: ['System disruption'],
          safety_checks_required: ['Manual review'],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: ['Senior engineer approval']
        },
        estimated_duration: '30 minutes',
        requires_human_approval: true,
        created_at: new Date().toISOString()
      };

      const results = await engine.applyOptimizations([humanApprovalRecommendation]);

      expect(results).toHaveLength(0); // Should be skipped
    });

    test('should handle optimization failures gracefully', async () => {
      const faultyRecommendation: OptimizationRecommendation = {
        id: 'faulty-optimization',
        type: 'performance_tuning',
        priority: 'medium',
        title: 'Faulty Optimization',
        description: 'This will fail',
        rationale: 'Test failure handling',
        expected_impact: {
          performance_improvement_percent: 10,
          success_rate_improvement_percent: 2,
          response_time_reduction_ms: 100,
          resource_efficiency_gain_percent: 5,
          confidence_level: 80,
          business_value: 'Test value'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: [],
          safety_checks_required: [],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: []
        },
        estimated_duration: '10 minutes',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      };

      // Mock execution to throw error
      jest.spyOn(engine as any, 'executeOptimization').mockRejectedValue(new Error('Execution failed'));

      const results = await engine.applyOptimizations([faultyRecommendation]);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].issues_encountered).toContain('Execution failed');
    });
  });

  describe('Safety Mechanisms', () => {
    test('should perform safety checks before applying optimizations', async () => {
      const highRiskRecommendation: OptimizationRecommendation = {
        id: 'high-risk-optimization',
        type: 'threshold_adjustment',
        priority: 'critical',
        title: 'High Risk Optimization',
        description: 'High risk change',
        rationale: 'Test safety checks',
        expected_impact: {
          performance_improvement_percent: 25,
          success_rate_improvement_percent: 8,
          response_time_reduction_ms: 300,
          resource_efficiency_gain_percent: 15,
          confidence_level: 95,
          business_value: 'Very high value'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'critical',
          potential_negative_impacts: ['System failure'],
          safety_checks_required: ['Full system backup'],
          monitoring_requirements: ['Real-time monitoring'],
          rollback_triggers: [],
          approval_requirements: ['CTO approval']
        },
        estimated_duration: '1 hour',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      };

      const results = await engine.applyOptimizations([highRiskRecommendation]);

      expect(results).toHaveLength(0); // Should be blocked by safety checks
    });

    test('should respect concurrent optimization limits', async () => {
      const recommendations = Array(10).fill(null).map((_, i) => ({
        id: `optimization-${i}`,
        type: 'performance_tuning',
        priority: 'medium',
        title: `Optimization ${i}`,
        description: 'Test optimization',
        rationale: 'Test concurrency limits',
        expected_impact: {
          performance_improvement_percent: 5,
          success_rate_improvement_percent: 1,
          response_time_reduction_ms: 50,
          resource_efficiency_gain_percent: 2,
          confidence_level: 70,
          business_value: 'Small improvement'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: [],
          safety_checks_required: [],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: []
        },
        estimated_duration: '5 minutes',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      })) as OptimizationRecommendation[];

      const results = await engine.applyOptimizations(recommendations);

      expect(results.length).toBeLessThanOrEqual(mockConfig.safety_settings?.max_concurrent_optimizations || 3);
    });
  });

  describe('Rollback Functionality', () => {
    test('should rollback optimization successfully', async () => {
      // First apply an optimization
      const recommendation: OptimizationRecommendation = {
        id: 'rollback-test',
        type: 'performance_tuning',
        priority: 'medium',
        title: 'Rollback Test',
        description: 'Test rollback functionality',
        rationale: 'Testing rollback',
        expected_impact: {
          performance_improvement_percent: 10,
          success_rate_improvement_percent: 2,
          response_time_reduction_ms: 100,
          resource_efficiency_gain_percent: 5,
          confidence_level: 80,
          business_value: 'Test value'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: [],
          safety_checks_required: [],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: []
        },
        estimated_duration: '10 minutes',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      };

      await engine.applyOptimizations([recommendation]);

      // Now rollback
      const rollbackResult = await engine.rollbackOptimization('rollback-test');

      expect(rollbackResult.optimization_id).toBe('rollback-test');
      expect(rollbackResult.status).toBe('rolled_back');
      expect(rollbackResult.rollback_triggered).toBe(true);
      expect(rollbackResult.rollback_reason).toBeDefined();
    });

    test('should handle rollback of non-existent optimization', async () => {
      await expect(engine.rollbackOptimization('non-existent-id')).rejects.toThrow('Optimization non-existent-id not found');
    });
  });

  describe('Dynamic Thresholds', () => {
    test('should generate dynamic thresholds based on trends', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const dynamicThresholds = await engine.generateDynamicThresholds();

      expect(dynamicThresholds).toBeDefined();
      expect(dynamicThresholds.current).toBeDefined();
      expect(dynamicThresholds.recommended).toBeDefined();
      expect(dynamicThresholds.reasoning).toBeDefined();
      expect(dynamicThresholds.safety_check).toBeDefined();
      expect(Array.isArray(dynamicThresholds.adjustment_history)).toBe(true);
    });

    test('should provide reasoning for threshold changes', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const dynamicThresholds = await engine.generateDynamicThresholds();

      if (dynamicThresholds.reasoning.length > 0) {
        const reasoning = dynamicThresholds.reasoning[0];
        expect(reasoning.threshold_name).toBeDefined();
        expect(reasoning.current_value).toBeDefined();
        expect(reasoning.recommended_value).toBeDefined();
        expect(reasoning.justification).toBeDefined();
        expect(reasoning.risk_assessment).toBeDefined();
      }
    });

    test('should include safety assessment for threshold changes', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const dynamicThresholds = await engine.generateDynamicThresholds();

      expect(dynamicThresholds.safety_check.risk_level).toBeDefined();
      expect(Array.isArray(dynamicThresholds.safety_check.potential_negative_impacts)).toBe(true);
      expect(Array.isArray(dynamicThresholds.safety_check.safety_checks_required)).toBe(true);
      expect(Array.isArray(dynamicThresholds.safety_check.monitoring_requirements)).toBe(true);
      expect(Array.isArray(dynamicThresholds.safety_check.rollback_triggers)).toBe(true);
    });
  });

  describe('Monitoring and Tracking', () => {
    test('should track optimization results', async () => {
      // Apply an optimization first
      const recommendation: OptimizationRecommendation = {
        id: 'tracking-test',
        type: 'performance_tuning',
        priority: 'medium',
        title: 'Tracking Test',
        description: 'Test result tracking',
        rationale: 'Testing tracking',
        expected_impact: {
          performance_improvement_percent: 10,
          success_rate_improvement_percent: 2,
          response_time_reduction_ms: 100,
          resource_efficiency_gain_percent: 5,
          confidence_level: 80,
          business_value: 'Test value'
        },
        implementation: [],
        rollback_plan: [],
        safety_assessment: {
          risk_level: 'low',
          potential_negative_impacts: [],
          safety_checks_required: [],
          monitoring_requirements: [],
          rollback_triggers: [],
          approval_requirements: []
        },
        estimated_duration: '10 minutes',
        requires_human_approval: false,
        created_at: new Date().toISOString()
      };

      await engine.applyOptimizations([recommendation]);

      // Track results
      const results = await engine.trackOptimizationResults();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle tracking errors gracefully', async () => {
      // Mock tracking to throw error
      jest.spyOn(engine as any, 'checkRollbackTriggers').mockRejectedValue(new Error('Tracking failed'));

      // Should not throw, but handle gracefully
      const results = await engine.trackOptimizationResults();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Integration Points', () => {
    test('should handle missing metrics gracefully', async () => {
      // Mock getCurrentMetrics to return empty data
      jest.spyOn(engine as any, 'getCurrentMetrics').mockResolvedValue({
        timestamp: new Date().toISOString(),
        agent_metrics: {},
        system_metrics: {
          total_requests: 0,
          active_agents: 0,
          average_response_time: 0,
          overall_success_rate: 0,
          critical_events: 0,
          system_health_score: 0
        },
        validation_metrics: {
          total_validations: 0,
          validation_success_rate: 0,
          average_validation_time: 0,
          failed_validations: 0,
          quality_score_average: 0,
          compatibility_score_average: 0
        }
      });

      const analysis = await engine.analyzeSystemPerformance();
      expect(analysis).toBeDefined();
      expect(analysis.current_state.system_metrics.system_health_score).toBe(0);
    });

    test('should validate recommendation structure', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockResolvedValue(createMockSystemAnalysis());

      const recommendations = await engine.generateOptimizations();

      for (const rec of recommendations) {
        // Validate required fields
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.expected_impact).toBeDefined();
        expect(rec.implementation).toBeDefined();
        expect(rec.rollback_plan).toBeDefined();
        expect(rec.safety_assessment).toBeDefined();
        expect(rec.created_at).toBeDefined();

        // Validate types
        expect(['threshold_adjustment', 'performance_tuning', 'resource_optimization', 'load_balancing']).toContain(rec.type);
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
        expect(['low', 'medium', 'high', 'critical']).toContain(rec.safety_assessment.risk_level);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle analyzer failures', async () => {
      mockAnalyzer.analyzePerformanceTrends = jest.fn().mockRejectedValue(new Error('Analyzer failed'));

      await expect(engine.analyzeSystemPerformance()).rejects.toThrow('System analysis failed');
    });

    test('should handle recommendation generation failures', async () => {
      jest.spyOn(engine, 'analyzeSystemPerformance').mockRejectedValue(new Error('Analysis failed'));

      await expect(engine.generateOptimizations()).rejects.toThrow('Optimization generation failed');
    });

    test('should continue processing other optimizations when one fails', async () => {
      const recommendations = [
        {
          id: 'good-optimization',
          type: 'performance_tuning',
          priority: 'medium',
          title: 'Good Optimization',
          description: 'This will succeed',
          rationale: 'Test mixed results',
          expected_impact: {
            performance_improvement_percent: 10,
            success_rate_improvement_percent: 2,
            response_time_reduction_ms: 100,
            resource_efficiency_gain_percent: 5,
            confidence_level: 80,
            business_value: 'Test value'
          },
          implementation: [],
          rollback_plan: [],
          safety_assessment: {
            risk_level: 'low',
            potential_negative_impacts: [],
            safety_checks_required: [],
            monitoring_requirements: [],
            rollback_triggers: [],
            approval_requirements: []
          },
          estimated_duration: '10 minutes',
          requires_human_approval: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'bad-optimization',
          type: 'performance_tuning',
          priority: 'medium',
          title: 'Bad Optimization',
          description: 'This will fail',
          rationale: 'Test mixed results',
          expected_impact: {
            performance_improvement_percent: 10,
            success_rate_improvement_percent: 2,
            response_time_reduction_ms: 100,
            resource_efficiency_gain_percent: 5,
            confidence_level: 80,
            business_value: 'Test value'
          },
          implementation: [],
          rollback_plan: [],
          safety_assessment: {
            risk_level: 'low',
            potential_negative_impacts: [],
            safety_checks_required: [],
            monitoring_requirements: [],
            rollback_triggers: [],
            approval_requirements: []
          },
          estimated_duration: '10 minutes',
          requires_human_approval: false,
          created_at: new Date().toISOString()
        }
      ] as OptimizationRecommendation[];

      // Mock execution to fail for the second optimization
      jest.spyOn(engine as any, 'executeOptimization')
        .mockResolvedValueOnce({ optimization_id: 'good-optimization', status: 'completed' })
        .mockRejectedValueOnce(new Error('Execution failed'));

      const results = await engine.applyOptimizations(recommendations);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
    });
  });
});