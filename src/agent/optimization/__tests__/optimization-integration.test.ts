/**
 * 🧪 OPTIMIZATION INTEGRATION TESTS - Comprehensive testing for monitoring integration
 * 
 * Tests покрывают интеграцию OptimizationEngine с ValidationMonitor, MetricsService,
 * и PerformanceMonitor для обеспечения seamless работы систем.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { OptimizationIntegration, OptimizationIntegrationConfig } from '../optimization-integration';
import { OptimizationEngine } from '../optimization-engine';
import { ValidationMonitor } from '../../monitoring/validation-monitor';
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';
import { 
  IntegratedMetricsSnapshot,
  OPTIMIZATION_CONSTANTS 
} from '../optimization-types';

// Mock dependencies
vi.mock('../optimization-engine');
vi.mock('../../monitoring/validation-monitor');
vi.mock('../../../shared/infrastructure/monitoring/metrics-service');
vi.mock('../../../shared/infrastructure/performance/performance-monitoring-service', () => ({
  performanceMonitor: {
    getPerformanceStats: vi.fn(() => ({
      memoryUsage: { heapUsed: 100 * 1024 * 1024 }, // 100MB
      cpuUsage: 45,
      timestamp: Date.now()
    }))
  }
}));

describe('OptimizationIntegration', () => {
  let integration: OptimizationIntegration;
  let mockValidationMonitor: ValidationMonitor;
  let mockMetricsService: MetricsService;
  let mockOptimizationEngine: OptimizationEngine;

  const createMockValidationMetrics = () => ({
    totalValidations: 150,
    successfulValidations: 142,
    failedValidations: 8,
    successRate: 94.7,
    totalCorrections: 15,
    successfulCorrections: 12,
    averageValidationTime: 850,
    agentMetrics: {
      'content-specialist': {
        validationsCount: 50,
        successRate: 96,
        averageValidationTime: 800,
        failedValidations: 2,
        validationsPerMinute: 12
      },
      'design-specialist': {
        validationsCount: 40,
        successRate: 92,
        averageValidationTime: 1200,
        failedValidations: 3,
        validationsPerMinute: 8
      },
      'quality-specialist': {
        validationsCount: 35,
        successRate: 97,
        averageValidationTime: 650,
        failedValidations: 1,
        validationsPerMinute: 15
      },
      'delivery-specialist': {
        validationsCount: 25,
        successRate: 92,
        averageValidationTime: 900,
        failedValidations: 2,
        validationsPerMinute: 10
      }
    },
    metricsWindow: [],
    criticalEvents: [
      {
        id: 'critical-1',
        severity: 'high',
        message: 'High validation failure rate',
        timestamp: new Date().toISOString(),
        agentId: 'design-specialist'
      }
    ],
    systemHealth: {
      status: 'degraded',
      score: 87,
      issues: ['High failure rate in design validation']
    }
  });

  const createMockInfrastructureMetrics = () => ({
    counters: [
      { name: 'http_requests_total', value: 245, labels: { method: 'POST' } },
      { name: 'template_generation_total', value: 89, labels: { status: 'success' } },
      { name: 'llm_calls_total', value: 156, labels: { model: 'gpt-4' } }
    ],
    histograms: [
      { 
        name: 'request_duration_seconds', 
        count: 245, 
        sum: 342.5, 
        buckets: new Map([['1', 200], ['5', 240], ['+Inf', 245]]) 
      },
      { 
        name: 'validation_duration_ms', 
        count: 150, 
        sum: 127500, 
        buckets: new Map([['500', 45], ['1000', 120], ['+Inf', 150]]) 
      }
    ],
    gauges: [
      { name: 'active_agents', value: 4, labels: {} },
      { name: 'memory_usage_bytes', value: 536870912, labels: { component: 'optimization' } }
    ],
    timestamp: Date.now()
  });

  beforeEach(() => {
    // Setup mock ValidationMonitor
    mockValidationMonitor = new EventEmitter() as any;
    mockValidationMonitor.getMetrics = vi.fn().mockReturnValue(createMockValidationMetrics());
    (ValidationMonitor.getInstance as any) = vi.fn().mockReturnValue(mockValidationMonitor);

    // Setup mock MetricsService
    mockMetricsService = {
      getSnapshot: vi.fn().mockReturnValue(createMockInfrastructureMetrics()),
      incrementCounter: vi.fn(),
      recordDuration: vi.fn(),
      setGauge: vi.fn()
    } as any;
    (MetricsService as any) = vi.fn().mockImplementation(() => mockMetricsService);

    // Setup mock OptimizationEngine
    mockOptimizationEngine = {
      analyzeSystemPerformance: vi.fn(),
      generateOptimizations: vi.fn(),
      applyOptimizations: vi.fn(),
      analyzer: {
        addMetricsSnapshot: vi.fn()
      }
    } as any;
    (OptimizationEngine as any) = vi.fn().mockImplementation(() => mockOptimizationEngine);

    // Create integration instance
    integration = new OptimizationIntegration({
      enabled: true,
      auto_optimization_enabled: false,
      metrics_collection_interval_ms: 30000,
      optimization_interval_ms: 120000,
      require_human_approval_for_critical: true,
      max_auto_optimizations_per_hour: 5
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (integration && typeof integration.stop === 'function') {
      integration.stop();
    }
  });

  describe('Initialization and Configuration', () => {
    test('should initialize with default config', () => {
      const defaultIntegration = new OptimizationIntegration();
      expect(defaultIntegration).toBeDefined();
    });

    test('should merge provided config with defaults', () => {
      const customConfig: Partial<OptimizationIntegrationConfig> = {
        auto_optimization_enabled: true,
        max_auto_optimizations_per_hour: 10
      };
      
      const customIntegration = new OptimizationIntegration(customConfig);
      expect(customIntegration).toBeDefined();
    });

    test('should setup event listeners on ValidationMonitor', () => {
      expect(mockValidationMonitor.listenerCount('critical_event')).toBeGreaterThan(0);
      expect(mockValidationMonitor.listenerCount('validation_recorded')).toBeGreaterThan(0);
    });
  });

  describe('Start and Stop Operations', () => {
    test('should start successfully when enabled', async () => {
      const startPromise = integration.start();
      
      await expect(startPromise).resolves.not.toThrow();
      
      // Should emit started event
      const startedPromise = new Promise(resolve => integration.once('started', resolve));
      await expect(startedPromise).resolves.not.toThrow();
    });

    test('should not start when disabled', async () => {
      const disabledIntegration = new OptimizationIntegration({
        enabled: false
      });
      
      await disabledIntegration.start();
      
      // Should not emit started event
      let startedEmitted = false;
      disabledIntegration.once('started', () => { startedEmitted = true; });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(startedEmitted).toBe(false);
    });

    test('should stop gracefully', async () => {
      await integration.start();
      
      const stopPromise = integration.stop();
      await expect(stopPromise).resolves.not.toThrow();
      
      // Should emit stopped event
      const stoppedPromise = new Promise(resolve => integration.once('stopped', resolve));
      await expect(stoppedPromise).resolves.not.toThrow();
    });

    test('should handle multiple start calls gracefully', async () => {
      await integration.start();
      
      // Second start should not throw
      await expect(integration.start()).resolves.not.toThrow();
    });
  });

  describe('Integrated Metrics Collection', () => {
    test('should collect integrated metrics snapshot successfully', async () => {
      const snapshot = await integration.getIntegratedMetricsSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.agent_metrics).toBeDefined();
      expect(snapshot.system_metrics).toBeDefined();
      expect(snapshot.validation_metrics).toBeDefined();
      expect(snapshot.data_sources).toBeDefined();
      expect(snapshot.optimization_metadata).toBeDefined();

      // Verify data sources are marked correctly
      expect(snapshot.data_sources.validation_monitor).toBe(true);
      expect(snapshot.data_sources.metrics_service).toBe(true);
      expect(snapshot.data_sources.performance_monitor).toBe(true);
    });

    test('should convert ValidationMonitor metrics to agent metrics format', async () => {
      const snapshot = await integration.getIntegratedMetricsSnapshot();

      expect(snapshot.agent_metrics).toBeDefined();
      expect(snapshot.agent_metrics['content-specialist']).toBeDefined();
      expect(snapshot.agent_metrics['design-specialist']).toBeDefined();
      expect(snapshot.agent_metrics['quality-specialist']).toBeDefined();
      expect(snapshot.agent_metrics['delivery-specialist']).toBeDefined();

      // Verify agent metrics structure
      const contentAgent = snapshot.agent_metrics['content-specialist'];
      expect(contentAgent.agent_id).toBe('content-specialist');
      expect(contentAgent.response_time_ms).toBeDefined();
      expect(contentAgent.success_rate).toBeDefined();
      expect(contentAgent.error_count).toBeDefined();
      expect(contentAgent.throughput_per_minute).toBeDefined();
      expect(contentAgent.memory_usage_mb).toBeDefined();
      expect(contentAgent.cpu_usage_percent).toBeDefined();
      expect(contentAgent.last_activity).toBeDefined();
    });

    test('should calculate system metrics from multiple sources', async () => {
      const snapshot = await integration.getIntegratedMetricsSnapshot();

      expect(snapshot.system_metrics).toBeDefined();
      expect(snapshot.system_metrics.total_requests).toBeGreaterThan(0);
      expect(snapshot.system_metrics.active_agents).toBe(4);
      expect(snapshot.system_metrics.average_response_time).toBeGreaterThan(0);
      expect(snapshot.system_metrics.overall_success_rate).toBe(94.7);
      expect(snapshot.system_metrics.critical_events).toBe(1);
      expect(snapshot.system_metrics.system_health_score).toBeGreaterThan(0);
      expect(snapshot.system_metrics.system_health_score).toBeLessThanOrEqual(100);
    });

    test('should include validation metrics from ValidationMonitor', async () => {
      const snapshot = await integration.getIntegratedMetricsSnapshot();

      expect(snapshot.validation_metrics).toBeDefined();
      expect(snapshot.validation_metrics.total_validations).toBe(150);
      expect(snapshot.validation_metrics.validation_success_rate).toBe(94.7);
      expect(snapshot.validation_metrics.average_validation_time).toBe(850);
      expect(snapshot.validation_metrics.failed_validations).toBe(8);
      expect(snapshot.validation_metrics.quality_score_average).toBeGreaterThan(0);
      expect(snapshot.validation_metrics.compatibility_score_average).toBeGreaterThan(0);
    });

    test('should handle metrics collection errors gracefully', async () => {
      // Mock ValidationMonitor to throw error
      mockValidationMonitor.getMetrics = vi.fn().mockImplementation(() => {
        throw new Error('ValidationMonitor failed');
      });

      await expect(integration.getIntegratedMetricsSnapshot()).rejects.toThrow();
    });
  });

  describe('Optimization Analysis', () => {
    test('should perform full optimization analysis', async () => {
      const mockAnalysis = {
        current_state: {} as any,
        trends: [],
        bottlenecks: [],
        error_patterns: [],
        predicted_issues: [],
        overall_health_assessment: 'Good',
        optimization_opportunities: ['Test opportunity']
      };

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue(mockAnalysis);

      const analysis = await integration.performFullOptimizationAnalysis();

      expect(analysis).toBeDefined();
      expect(analysis.overall_health_assessment).toBe('Good');
      // expect(mockOptimizationEngine.analyzer.addMetricsSnapshot).toHaveBeenCalled();
      expect(mockOptimizationEngine.analyzeSystemPerformance).toHaveBeenCalled();
    });

    test('should enhance analysis with existing data', async () => {
      const mockAnalysis = {
        current_state: {} as any,
        trends: [],
        bottlenecks: [],
        error_patterns: [],
        predicted_issues: [],
        overall_health_assessment: 'Good',
        optimization_opportunities: ['Original opportunity']
      };

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue(mockAnalysis);

      const analysis = await integration.performFullOptimizationAnalysis();

      expect(analysis.optimization_opportunities.length).toBeGreaterThan(1);
      expect(analysis.optimization_opportunities).toContain('Original opportunity');
    });

    test('should emit analysis_completed event', async () => {
      const mockAnalysis = {
        current_state: {} as any,
        trends: [],
        bottlenecks: [],
        error_patterns: [],
        predicted_issues: [],
        overall_health_assessment: 'Good',
        optimization_opportunities: []
      };

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue(mockAnalysis);

      const eventPromise = new Promise(resolve => integration.once('analysis_completed', resolve));
      
      await integration.performFullOptimizationAnalysis();
      
      await expect(eventPromise).resolves.toBeDefined();
    });
  });

  describe('Optimization Recommendations', () => {
    test('should get optimization recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          type: 'performance_tuning',
          priority: 'medium',
          title: 'Optimize response time',
          description: 'Improve system responsiveness',
          rationale: 'High response times detected',
          expected_impact: {} as any,
          implementation: [],
          rollback_plan: [],
          safety_assessment: {} as any,
          estimated_duration: '10 minutes',
          requires_human_approval: false,
          created_at: new Date().toISOString()
        }
      ];

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue(mockRecommendations);

      const recommendations = await integration.getOptimizationRecommendations();

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBe(1);
      expect(recommendations[0].id).toBe('rec-1');
      expect(recommendations[0].rationale).toContain('ValidationMonitor insights');
    });

    test('should enhance recommendations with context', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          type: 'performance_tuning',
          priority: 'medium',
          title: 'Test recommendation',
          description: 'Test description',
          rationale: 'Original rationale',
          expected_impact: {} as any,
          implementation: [],
          rollback_plan: [],
          safety_assessment: {} as any,
          estimated_duration: '10 minutes',
          requires_human_approval: false,
          created_at: new Date().toISOString()
        }
      ];

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue(mockRecommendations);

      const recommendations = await integration.getOptimizationRecommendations();

      expect(recommendations[0].rationale).toContain('Original rationale');
      expect(recommendations[0].rationale).toContain('ValidationMonitor insights');
      expect(recommendations[0].rationale).toContain('Success rate: 94.7%');
    });

    test('should emit recommendations_generated event', async () => {
      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue([]);

      const eventPromise = new Promise(resolve => integration.once('recommendations_generated', resolve));
      
      await integration.getOptimizationRecommendations();
      
      await expect(eventPromise).resolves.toBeDefined();
    });
  });

  describe('Optimization Application', () => {
    test('should generate and apply safe optimizations', async () => {
      const mockRecommendations = [
        {
          id: 'safe-rec-1',
          type: 'performance_tuning',
          priority: 'low',
          title: 'Safe optimization',
          description: 'Low risk optimization',
          rationale: 'Safe improvement',
          expected_impact: {} as any,
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
        }
      ];

      const mockResults = [
        {
          optimization_id: 'safe-rec-1',
          status: 'completed',
          applied_at: new Date().toISOString(),
          actions_executed: [],
          rollback_triggered: false,
          rollback_reason: '',
          performance_impact: {},
          issues_encountered: []
        }
      ];

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue(mockRecommendations);
      mockOptimizationEngine.applyOptimizations = vi.fn().mockResolvedValue(mockResults);

      const results = await integration.generateAndApplyOptimizations();

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].status).toBe('completed');
      expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith('optimization_applied', {
        type: 'safe-rec-1',
        status: 'completed'
      });
    });

    test('should filter out unsafe recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'unsafe-rec-1',
          type: 'threshold_adjustment',
          priority: 'critical',
          title: 'Critical optimization',
          description: 'High risk optimization',
          rationale: 'Critical improvement',
          expected_impact: {} as any,
          implementation: [],
          rollback_plan: [],
          safety_assessment: {
            risk_level: 'critical',
            potential_negative_impacts: ['System failure'],
            safety_checks_required: ['Manual review'],
            monitoring_requirements: [],
            rollback_triggers: [],
            approval_requirements: []
          },
          estimated_duration: '30 minutes',
          requires_human_approval: true,
          created_at: new Date().toISOString()
        }
      ];

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue(mockRecommendations);

      const results = await integration.generateAndApplyOptimizations();

      expect(results).toEqual([]);
      expect(mockOptimizationEngine.applyOptimizations).not.toHaveBeenCalled();
    });

    test('should respect daily optimization limits', async () => {
      // Create integration with low limit
      const limitedIntegration = new OptimizationIntegration({
        max_auto_optimizations_per_hour: 1
      });

      // Simulate many optimizations already applied
      (limitedIntegration as any).appliedOptimizationsToday = 25; // Over 24 hour limit

      const results = await limitedIntegration.generateAndApplyOptimizations();

      expect(results).toEqual([]);
    });

    test('should emit optimizations_applied event', async () => {
      const mockResults = [
        {
          optimization_id: 'test-opt',
          status: 'completed',
          applied_at: new Date().toISOString(),
          actions_executed: [],
          rollback_triggered: false,
          rollback_reason: '',
          performance_impact: {},
          issues_encountered: []
        }
      ];

      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockResolvedValue({} as any);
      mockOptimizationEngine.generateOptimizations = vi.fn().mockResolvedValue([]);
      mockOptimizationEngine.applyOptimizations = vi.fn().mockResolvedValue(mockResults);

      const eventPromise = new Promise(resolve => integration.once('optimizations_applied', resolve));
      
      // Force apply with mock results
      (integration as any).canApplyMoreOptimizations = vi.fn().mockReturnValue(true);
      (integration as any).filterRecommendationsBySafetyPolicy = vi.fn().mockReturnValue([{}]);
      
      await integration.generateAndApplyOptimizations();
      
      await expect(eventPromise).resolves.toBeDefined();
    });
  });

  describe('Event Handling', () => {
    test('should trigger analysis on critical events', async () => {
      const performFullOptimizationAnalysisSpy = vi.spyOn(integration, 'performFullOptimizationAnalysis').mockResolvedValue({} as any);

      // Emit critical event
      mockValidationMonitor.emit('critical_event', {
        id: 'critical-1',
        severity: 'high',
        message: 'Test critical event'
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(performFullOptimizationAnalysisSpy).toHaveBeenCalled();
    });

    test('should handle validation failure events', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Emit critical validation failure
      mockValidationMonitor.emit('validation_recorded', {
        result: 'failed',
        severity: 'critical',
        agentId: 'content-specialist'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical validation failure')
      );

      consoleLogSpy.mockRestore();
    });

    test('should reset daily counters at midnight', async () => {
      // Mock date to simulate day change
      const originalDate = Date;
      const mockDate = vi.fn(() => ({
        toDateString: vi.fn().mockReturnValue('2023-12-02')
      }));
      global.Date = mockDate as any;

      // Set some optimizations applied
      (integration as any).appliedOptimizationsToday = 5;
      (integration as any).lastOptimizationReset = '2023-12-01';

      // Trigger the interval check (simulate time passing)
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect((integration as any).appliedOptimizationsToday).toBe(0);
          expect((integration as any).lastOptimizationReset).toBe('2023-12-02');
          
          global.Date = originalDate;
          resolve();
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle metrics collection errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Start integration to trigger metrics collection
      await integration.start();
      
      // Mock metrics to throw error
      mockValidationMonitor.getMetrics = vi.fn().mockImplementation(() => {
        throw new Error('Metrics collection failed');
      });

      // Wait for metrics collection interval
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Metrics collection error')
      );

      consoleErrorSpy.mockRestore();
    });

    test('should handle optimization errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockRejectedValue(new Error('Analysis failed'));

      await expect(integration.generateAndApplyOptimizations()).rejects.toThrow('Analysis failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate/apply optimizations')
      );

      consoleErrorSpy.mockRestore();
    });

    test('should emit optimization_error event on failures', async () => {
      mockOptimizationEngine.analyzeSystemPerformance = vi.fn().mockRejectedValue(new Error('Test error'));

      const errorPromise = new Promise(resolve => integration.once('optimization_error', resolve));
      
      try {
        await integration.generateAndApplyOptimizations();
      } catch (e) {
        // Expected to throw
      }
      
      await expect(errorPromise).resolves.toBeDefined();
    });
  });

  describe('Performance and Efficiency', () => {
    test('should complete metrics collection within reasonable time', async () => {
      const startTime = Date.now();
      
      await integration.getIntegratedMetricsSnapshot();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent optimization requests', async () => {
      const promises = Array.from({ length: 5 }, () => 
        integration.getOptimizationRecommendations()
      );

      const results = await Promise.all(promises);

      // All should complete successfully
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});