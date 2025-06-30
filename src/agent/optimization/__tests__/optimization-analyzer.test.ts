/**
 * 🧪 OPTIMIZATION ANALYZER TESTS - Comprehensive testing for pattern analysis
 * 
 * Tests покрывают анализ трендов, выявление bottlenecks, анализ ошибок
 * и предсказание проблем с различными сценариями данных.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizationAnalyzer } from '../optimization-analyzer';
import { 
  MetricsSnapshot,
  PerformanceTrend,
  Bottleneck,
  ErrorPattern,
  PredictedIssue,
  AgentType,
  AgentMetrics,
  OPTIMIZATION_CONSTANTS
} from '../optimization-types';

describe('OptimizationAnalyzer', () => {
  let analyzer: OptimizationAnalyzer;

  const createMockMetricsSnapshot = (overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot => ({
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
    },
    ...overrides
  });

  const createMetricsHistory = (count: number, baseTime: number = Date.now()): MetricsSnapshot[] => {
    return Array.from({ length: count }, (_, i) => {
      const timestamp = new Date(baseTime - (count - 1 - i) * 60000).toISOString(); // 1 minute intervals
      
      // Simulate trend: improving success rate over time
      const successRateBase = 90 + (i / count) * 5; // 90% to 95%
      const responseTimeBase = 2000 - (i / count) * 500; // 2000ms to 1500ms
      
      return createMockMetricsSnapshot({
        timestamp,
        system_metrics: {
          total_requests: 100 + i * 5,
          active_agents: 4,
          average_response_time: responseTimeBase + Math.random() * 200 - 100,
          overall_success_rate: successRateBase + Math.random() * 4 - 2,
          critical_events: Math.floor(Math.random() * 3),
          system_health_score: 80 + Math.random() * 15
        }
      });
    });
  };

  beforeEach(() => {
    analyzer = new OptimizationAnalyzer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    test('should initialize analyzer successfully', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(OptimizationAnalyzer);
    });

    test('should accept metrics snapshots', () => {
      const snapshot = createMockMetricsSnapshot();
      
      expect(() => analyzer.addMetricsSnapshot(snapshot)).not.toThrow();
    });

    test('should limit metrics history size', () => {
      // Add more than MAX_HISTORY_SIZE snapshots
      const maxHistory = 1000;
      for (let i = 0; i < maxHistory + 100; i++) {
        analyzer.addMetricsSnapshot(createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - i * 60000).toISOString()
        }));
      }

      // History should be limited
      const metricsHistory = (analyzer as any).metricsHistory;
      expect(metricsHistory.length).toBeLessThanOrEqual(maxHistory);
    });
  });

  describe('Performance Trends Analysis', () => {
    test('should analyze trends when sufficient data available', async () => {
      // Add sufficient data points
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends(1); // 1 hour window

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);

      // Verify trend structure
      if (trends.length > 0) {
        const trend = trends[0];
        expect(trend.metric_name).toBeDefined();
        expect(trend.trend_direction).toMatch(/^(up|down|stable)$/);
        expect(trend.change_percent).toBeGreaterThanOrEqual(0);
        expect(trend.confidence_score).toBeGreaterThanOrEqual(0);
        expect(trend.confidence_score).toBeLessThanOrEqual(100);
        expect(trend.time_window).toBeDefined();
        expect(Array.isArray(trend.data_points)).toBe(true);
      }
    });

    test('should return empty array when insufficient data', async () => {
      // Add only a few data points (less than MIN_DATA_POINTS_FOR_PATTERN)
      const history = createMetricsHistory(5);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends();

      expect(trends).toEqual([]);
    });

    test('should filter trends by confidence threshold', async () => {
      // Add data with clear trends
      const history = createMetricsHistory(20);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends();

      // All returned trends should meet confidence threshold
      trends.forEach(trend => {
        expect(trend.confidence_score).toBeGreaterThanOrEqual(OPTIMIZATION_CONSTANTS.PATTERN_CONFIDENCE_THRESHOLD);
      });
    });

    test('should detect different trend directions', async () => {
      // Create data with clear up trend
      const upTrendHistory = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 100,
            active_agents: 4,
            average_response_time: 1000,
            overall_success_rate: 80 + i * 1.2, // Clear upward trend
            critical_events: 0,
            system_health_score: 80
          }
        });
      });

      upTrendHistory.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends();

      // Should detect upward trends in success rate
      const successRateTrend = trends.find(t => 
        t.metric_name.includes('success_rate') && t.trend_direction === 'up'
      );
      expect(successRateTrend).toBeDefined();
    });

    test('should analyze agent-specific trends', async () => {
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends();

      // Should have trends for specific agents
      const agentTrends = trends.filter(t => t.agent_id);
      expect(agentTrends.length).toBeGreaterThan(0);

      agentTrends.forEach(trend => {
        expect(['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'])
          .toContain(trend.agent_id);
      });
    });

    test('should detect anomalies in trend data', async () => {
      // Create data with one clear anomaly
      const history = Array.from({ length: 15 }, (_, i) => {
        const normalValue = 95;
        const anomalyValue = i === 7 ? 60 : normalValue; // Anomaly in the middle
        
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 100,
            active_agents: 4,
            average_response_time: 1000,
            overall_success_rate: anomalyValue,
            critical_events: 0,
            system_health_score: 80
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const trends = await analyzer.analyzePerformanceTrends();

      // Should detect anomalies
      const trendsWithAnomalies = trends.filter(t => 
        t.data_points.some(dp => dp.anomaly_detected)
      );
      expect(trendsWithAnomalies.length).toBeGreaterThan(0);
    });
  });

  describe('Bottleneck Identification', () => {
    test('should identify bottlenecks successfully', async () => {
      const snapshot = createMockMetricsSnapshot();
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      expect(bottlenecks).toBeDefined();
      expect(Array.isArray(bottlenecks)).toBe(true);
    });

    test('should return empty array when no metrics available', async () => {
      const bottlenecks = await analyzer.identifyBottlenecks();

      expect(bottlenecks).toEqual([]);
    });

    test('should identify system-level bottlenecks', async () => {
      // Create snapshot with high response time
      const snapshot = createMockMetricsSnapshot({
        system_metrics: {
          total_requests: 100,
          active_agents: 4,
          average_response_time: 6000, // Above threshold
          overall_success_rate: 94,
          critical_events: 1,
          system_health_score: 70
        }
      });
      
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      const systemBottlenecks = bottlenecks.filter(b => b.affected_agent === 'system');
      expect(systemBottlenecks.length).toBeGreaterThan(0);

      const responseTimeBottleneck = systemBottlenecks.find(b => 
        b.description.includes('response time')
      );
      expect(responseTimeBottleneck).toBeDefined();
    });

    test('should identify agent-specific bottlenecks', async () => {
      // Create snapshot with high memory usage for one agent
      const snapshot = createMockMetricsSnapshot({
        agent_metrics: {
          ...createMockMetricsSnapshot().agent_metrics,
          'design-specialist': {
            agent_id: 'design-specialist',
            response_time_ms: 2100,
            success_rate: 91,
            error_count: 3,
            throughput_per_minute: 8,
            memory_usage_mb: 2048, // Above threshold
            cpu_usage_percent: 95, // Above threshold
            last_activity: new Date().toISOString()
          }
        }
      });
      
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      const agentBottlenecks = bottlenecks.filter(b => b.affected_agent === 'design-specialist');
      expect(agentBottlenecks.length).toBeGreaterThan(0);

      // Should identify both memory and CPU bottlenecks
      const memoryBottleneck = agentBottlenecks.find(b => b.type === 'memory');
      const cpuBottleneck = agentBottlenecks.find(b => b.type === 'cpu');
      
      expect(memoryBottleneck).toBeDefined();
      expect(cpuBottleneck).toBeDefined();
    });

    test('should identify validation bottlenecks', async () => {
      const snapshot = createMockMetricsSnapshot({
        validation_metrics: {
          total_validations: 98,
          validation_success_rate: 95,
          average_validation_time: 2000, // Above threshold
          failed_validations: 5,
          quality_score_average: 88,
          compatibility_score_average: 92
        }
      });
      
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      const validationBottlenecks = bottlenecks.filter(b => b.type === 'validation');
      expect(validationBottlenecks.length).toBeGreaterThan(0);
    });

    test('should sort bottlenecks by severity', async () => {
      // Create snapshot with multiple bottlenecks of different severities
      const snapshot = createMockMetricsSnapshot({
        system_metrics: {
          total_requests: 100,
          active_agents: 4,
          average_response_time: 6000, // High severity
          overall_success_rate: 70, // Critical severity
          critical_events: 5,
          system_health_score: 60
        }
      });
      
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      // Should be sorted by severity (critical first)
      for (let i = 1; i < bottlenecks.length; i++) {
        const prevSeverity = bottlenecks[i - 1].severity;
        const currSeverity = bottlenecks[i].severity;
        
        const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
        expect(severityOrder[prevSeverity]).toBeLessThanOrEqual(severityOrder[currSeverity]);
      }
    });

    test('should provide impact assessment and improvement estimates', async () => {
      const snapshot = createMockMetricsSnapshot({
        system_metrics: {
          total_requests: 100,
          active_agents: 4,
          average_response_time: 6000,
          overall_success_rate: 94,
          critical_events: 1,
          system_health_score: 70
        }
      });
      
      analyzer.addMetricsSnapshot(snapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();

      bottlenecks.forEach(bottleneck => {
        expect(bottleneck.impact_assessment).toBeDefined();
        expect(typeof bottleneck.impact_assessment).toBe('string');
        expect(bottleneck.estimated_improvement).toBeDefined();
        expect(typeof bottleneck.estimated_improvement).toBe('number');
        expect(bottleneck.estimated_improvement).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Pattern Analysis', () => {
    test('should analyze error patterns successfully', async () => {
      // Add some metrics with errors
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const errorPatterns = await analyzer.analyzeErrorPatterns();

      expect(errorPatterns).toBeDefined();
      expect(Array.isArray(errorPatterns)).toBe(true);
    });

    test('should return empty array when insufficient data', async () => {
      // Add insufficient data
      const history = createMetricsHistory(5);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const errorPatterns = await analyzer.analyzeErrorPatterns();

      expect(errorPatterns).toEqual([]);
    });

    test('should identify system error patterns', async () => {
      // Create history with system errors
      const history = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 100,
            active_agents: 4,
            average_response_time: 1500,
            overall_success_rate: 94,
            critical_events: Math.random() > 0.7 ? 2 : 0, // Some critical events
            system_health_score: 85
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const errorPatterns = await analyzer.analyzeErrorPatterns();

      const systemPatterns = errorPatterns.filter(p => 
        p.error_type === 'critical_system_events'
      );
      
      if (systemPatterns.length > 0) {
        const pattern = systemPatterns[0];
        expect(pattern.pattern_id).toBeDefined();
        expect(pattern.frequency).toBeGreaterThan(0);
        expect(Array.isArray(pattern.affected_agents)).toBe(true);
        expect(Array.isArray(pattern.common_conditions)).toBe(true);
        expect(Array.isArray(pattern.potential_causes)).toBe(true);
        expect(Array.isArray(pattern.suggested_fixes)).toBe(true);
        expect(['critical', 'high', 'medium', 'low']).toContain(pattern.business_impact);
      }
    });

    test('should identify agent-specific error patterns', async () => {
      // Create history with agent errors
      const history = Array.from({ length: 15 }, (_, i) => {
        const agentMetrics = createMockMetricsSnapshot().agent_metrics;
        agentMetrics['content-specialist'].error_count = Math.random() > 0.6 ? 3 : 0;
        
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          agent_metrics: agentMetrics
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const errorPatterns = await analyzer.analyzeErrorPatterns();

      const agentPatterns = errorPatterns.filter(p => 
        p.affected_agents.includes('content-specialist')
      );
      
      agentPatterns.forEach(pattern => {
        expect(pattern.error_type).toContain('content-specialist');
        expect(pattern.affected_agents).toContain('content-specialist');
      });
    });

    test('should categorize error patterns by business impact', async () => {
      const history = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 100,
            active_agents: 4,
            average_response_time: 1500,
            overall_success_rate: 94,
            critical_events: i < 5 ? 5 : 1, // High error count in beginning
            system_health_score: 85
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const errorPatterns = await analyzer.analyzeErrorPatterns();

      errorPatterns.forEach(pattern => {
        expect(['critical', 'high', 'medium', 'low']).toContain(pattern.business_impact);
        
        // High frequency should correlate with higher impact
        if (pattern.frequency > 10) {
          expect(['high', 'critical']).toContain(pattern.business_impact);
        }
      });
    });
  });

  describe('Performance Issue Prediction', () => {
    test('should predict performance issues', async () => {
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    test('should return empty array when insufficient data', async () => {
      const history = createMetricsHistory(5);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      expect(predictions).toEqual([]);
    });

    test('should predict issues based on negative trends', async () => {
      // Create data with declining success rate
      const history = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 100,
            active_agents: 4,
            average_response_time: 1500,
            overall_success_rate: 95 - i * 1.5, // Declining trend
            critical_events: 0,
            system_health_score: 85
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      const degradationPredictions = predictions.filter(p => 
        p.issue_type === 'performance_degradation'
      );
      
      expect(degradationPredictions.length).toBeGreaterThan(0);

      degradationPredictions.forEach(prediction => {
        expect(prediction.issue_id).toBeDefined();
        expect(prediction.predicted_at).toBeDefined();
        expect(prediction.likely_occurrence).toBeDefined();
        expect(prediction.confidence_percent).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence_percent).toBeLessThanOrEqual(100);
        expect(Array.isArray(prediction.affected_components)).toBe(true);
        expect(Array.isArray(prediction.preventive_actions)).toBe(true);
        expect(Array.isArray(prediction.monitoring_requirements)).toBe(true);
      });
    });

    test('should predict system overload', async () => {
      // Create data with increasing load
      const history = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          system_metrics: {
            total_requests: 80 + i * 10, // Increasing load
            active_agents: 4,
            average_response_time: 1500,
            overall_success_rate: 94,
            critical_events: 0,
            system_health_score: 85
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      const overloadPredictions = predictions.filter(p => 
        p.issue_type === 'system_overload'
      );
      
      if (overloadPredictions.length > 0) {
        const prediction = overloadPredictions[0];
        expect(prediction.affected_components).toContain('system');
        expect(prediction.preventive_actions).toContain('Scale resources');
      }
    });

    test('should predict validation failures', async () => {
      // Create data with declining validation success rate
      const history = Array.from({ length: 15 }, (_, i) => {
        return createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          validation_metrics: {
            total_validations: 98,
            validation_success_rate: 95 - i * 2, // Declining
            average_validation_time: 450,
            failed_validations: i,
            quality_score_average: 88,
            compatibility_score_average: 92
          }
        });
      });

      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      const validationPredictions = predictions.filter(p => 
        p.issue_type === 'validation_failure'
      );
      
      if (validationPredictions.length > 0) {
        const prediction = validationPredictions[0];
        expect(prediction.affected_components).toContain('validation-system');
        expect(prediction.preventive_actions).toContain('Review validation rules');
      }
    });

    test('should filter predictions by confidence threshold', async () => {
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      // All predictions should meet confidence threshold
      predictions.forEach(prediction => {
        expect(prediction.confidence_percent).toBeGreaterThanOrEqual(OPTIMIZATION_CONSTANTS.PATTERN_CONFIDENCE_THRESHOLD);
      });
    });

    test('should provide appropriate time predictions', async () => {
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const predictions = await analyzer.predictPerformanceIssues();

      predictions.forEach(prediction => {
        const predictedTime = new Date(prediction.likely_occurrence).getTime();
        const currentTime = new Date(prediction.predicted_at).getTime();
        
        // Predicted time should be in the future
        expect(predictedTime).toBeGreaterThan(currentTime);
        
        // Should be within reasonable timeframe (e.g., next 48 hours)
        const maxPredictionWindow = 48 * 60 * 60 * 1000; // 48 hours
        expect(predictedTime - currentTime).toBeLessThanOrEqual(maxPredictionWindow);
      });
    });
  });

  describe('Data Quality and Edge Cases', () => {
    test('should handle empty metrics gracefully', async () => {
      const emptySnapshot = createMockMetricsSnapshot({
        agent_metrics: {} as Record<AgentType, AgentMetrics>,
        system_metrics: {
          total_requests: 0,
          active_agents: 0,
          average_response_time: 0,
          overall_success_rate: 0,
          critical_events: 0,
          system_health_score: 0
        }
      });

      analyzer.addMetricsSnapshot(emptySnapshot);

      const trends = await analyzer.analyzePerformanceTrends();
      const bottlenecks = await analyzer.identifyBottlenecks();
      const errorPatterns = await analyzer.analyzeErrorPatterns();
      const predictions = await analyzer.predictPerformanceIssues();

      expect(trends).toBeDefined();
      expect(bottlenecks).toBeDefined();
      expect(errorPatterns).toBeDefined();
      expect(predictions).toBeDefined();
    });

    test('should handle malformed data gracefully', async () => {
      const malformedSnapshot = {
        timestamp: 'invalid-timestamp',
        agent_metrics: null,
        system_metrics: undefined,
        validation_metrics: {}
      } as any;

      expect(() => analyzer.addMetricsSnapshot(malformedSnapshot)).not.toThrow();
    });

    test('should handle extreme values', async () => {
      const extremeSnapshot = createMockMetricsSnapshot({
        system_metrics: {
          total_requests: Number.MAX_SAFE_INTEGER,
          active_agents: -1,
          average_response_time: 0,
          overall_success_rate: 150, // Invalid percentage
          critical_events: -5,
          system_health_score: 999
        }
      });

      analyzer.addMetricsSnapshot(extremeSnapshot);

      const bottlenecks = await analyzer.identifyBottlenecks();
      expect(Array.isArray(bottlenecks)).toBe(true);
    });

    test('should handle rapid data updates', async () => {
      // Add many snapshots quickly
      const promises = Array.from({ length: 100 }, (_, i) => {
        const snapshot = createMockMetricsSnapshot({
          timestamp: new Date(Date.now() - i * 1000).toISOString() // 1 second intervals
        });
        analyzer.addMetricsSnapshot(snapshot);
        return analyzer.analyzePerformanceTrends(1);
      });

      const results = await Promise.all(promises);

      // All should complete successfully
      results.forEach(trends => {
        expect(Array.isArray(trends)).toBe(true);
      });
    });

    test('should maintain consistent results for same data', async () => {
      const history = createMetricsHistory(15);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      // Run analysis multiple times
      const trends1 = await analyzer.analyzePerformanceTrends();
      const trends2 = await analyzer.analyzePerformanceTrends();
      const bottlenecks1 = await analyzer.identifyBottlenecks();
      const bottlenecks2 = await analyzer.identifyBottlenecks();

      // Results should be consistent
      expect(trends1.length).toBe(trends2.length);
      expect(bottlenecks1.length).toBe(bottlenecks2.length);
    });
  });

  describe('Performance and Efficiency', () => {
    test('should complete analysis within reasonable time', async () => {
      const history = createMetricsHistory(100); // Large dataset
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      const startTime = Date.now();
      
      await Promise.all([
        analyzer.analyzePerformanceTrends(),
        analyzer.identifyBottlenecks(),
        analyzer.analyzeErrorPatterns(),
        analyzer.predictPerformanceIssues()
      ]);

      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should handle concurrent analysis requests', async () => {
      const history = createMetricsHistory(20);
      history.forEach(snapshot => analyzer.addMetricsSnapshot(snapshot));

      // Run multiple analyses concurrently
      const concurrentPromises = Array.from({ length: 10 }, () => Promise.all([
        analyzer.analyzePerformanceTrends(),
        analyzer.identifyBottlenecks(),
        analyzer.analyzeErrorPatterns(),
        analyzer.predictPerformanceIssues()
      ]));

      const results = await Promise.all(concurrentPromises);

      // All should complete successfully
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.length).toBe(4); // 4 analysis types
      });
    });
  });
});