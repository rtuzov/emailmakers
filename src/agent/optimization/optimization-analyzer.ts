/**
 * 🔍 OPTIMIZATION ANALYZER - Анализ паттернов и выявление bottlenecks
 * 
 * Система интеллектуального анализа метрик производительности для выявления
 * паттернов, bottlenecks и предсказания потенциальных проблем.
 */

import { 
  MetricsSnapshot, 
  PerformanceTrend, 
  Bottleneck, 
  ErrorPattern, 
  PredictedIssue,
  AgentType,
  TrendDirection,
  TrendDataPoint,
  OPTIMIZATION_CONSTANTS
} from './optimization-types';

// Add throttling and circuit breaker interfaces
interface AnalysisState {
  isAnalyzing: boolean;
  lastAnalysisTime: number;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  analysisCount: number;
}

interface ThrottleConfig {
  minInterval: number; // Minimum time between analyses (ms)
  maxConcurrent: number; // Maximum concurrent analyses
  circuitBreakerThreshold: number; // Failures before opening circuit
  circuitBreakerTimeout: number; // Time to keep circuit open (ms)
  logThrottleThreshold: number; // Reduce logging after this many analyses
}

export interface PatternAnalyzer {
  // Анализ трендов производительности
  analyzePerformanceTrends(timeWindow: number): Promise<PerformanceTrend[]>;
  
  // Выявление bottlenecks
  identifyBottlenecks(): Promise<Bottleneck[]>;
  
  // Анализ паттернов ошибок
  analyzeErrorPatterns(): Promise<ErrorPattern[]>;
  
  // Предсказание проблем
  predictPerformanceIssues(): Promise<PredictedIssue[]>;
}

export class OptimizationAnalyzer implements PatternAnalyzer {
  private metricsHistory: MetricsSnapshot[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly TREND_ANALYSIS_WINDOW = 24; // hours
  
  // Add state management for throttling and circuit breaker
  private analysisState: AnalysisState = {
    isAnalyzing: false,
    lastAnalysisTime: 0,
    consecutiveFailures: 0,
    circuitBreakerOpen: false,
    analysisCount: 0
  };

  private throttleConfig: ThrottleConfig = {
    minInterval: 30000, // 30 seconds minimum between analyses
    maxConcurrent: 1, // Only one analysis at a time
    circuitBreakerThreshold: 5, // Open circuit after 5 failures
    circuitBreakerTimeout: 300000, // Keep circuit open for 5 minutes
    logThrottleThreshold: 10 // Reduce logging after 10 analyses
  };
  
  constructor() {
    const shouldLog = this.analysisState.analysisCount < this.throttleConfig.logThrottleThreshold;
    if (shouldLog) {
      console.log('🔍 OptimizationAnalyzer initialized');
    }
  }

  /**
   * Добавить новые метрики в историю для анализа
   */
  public addMetricsSnapshot(snapshot: MetricsSnapshot): void {
    this.metricsHistory.push(snapshot);
    
    // Ограничиваем размер истории
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE);
    }
    
    console.log(`📊 Added metrics snapshot. History size: ${this.metricsHistory.length}`);
  }

  /**
   * Анализ трендов производительности с throttling
   */
  public async analyzePerformanceTrends(timeWindowHours: number = this.TREND_ANALYSIS_WINDOW): Promise<PerformanceTrend[]> {
    // Check circuit breaker
    if (this.analysisState.circuitBreakerOpen) {
      const timeSinceFailure = Date.now() - this.analysisState.lastAnalysisTime;
      if (timeSinceFailure < this.throttleConfig.circuitBreakerTimeout) {
        console.warn('⚡ Circuit breaker open - skipping analysis');
        return [];
      } else {
        // Reset circuit breaker
        this.analysisState.circuitBreakerOpen = false;
        this.analysisState.consecutiveFailures = 0;
        console.log('🔄 Circuit breaker reset');
      }
    }

    // Check if analysis is already running
    if (this.analysisState.isAnalyzing) {
      console.warn('⏸️ Analysis already in progress - skipping');
      return [];
    }

    // Check minimum interval
    const timeSinceLastAnalysis = Date.now() - this.analysisState.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.throttleConfig.minInterval) {
      const shouldLog = this.analysisState.analysisCount < this.throttleConfig.logThrottleThreshold;
      if (shouldLog) {
        console.warn(`⏳ Analysis throttled - ${this.throttleConfig.minInterval - timeSinceLastAnalysis}ms remaining`);
      }
      return [];
    }

    this.analysisState.isAnalyzing = true;
    this.analysisState.lastAnalysisTime = Date.now();
    this.analysisState.analysisCount++;

    try {
      const shouldLog = this.analysisState.analysisCount <= this.throttleConfig.logThrottleThreshold;
      if (shouldLog) {
        console.log(`🔍 Analyzing performance trends for ${timeWindowHours}h window`);
      }
      
      if (this.metricsHistory.length < OPTIMIZATION_CONSTANTS.MIN_DATA_POINTS_FOR_PATTERN) {
        if (shouldLog) {
          console.warn('⚠️ Insufficient data for trend analysis');
        }
        // Return minimal baseline trends when insufficient data
        return this.generateBaselineTrends();
      }

      const cutoffTime = Date.now() - (timeWindowHours * 60 * 60 * 1000);
      const recentMetrics = this.metricsHistory.filter(
        m => new Date(m.timestamp).getTime() > cutoffTime
      );

      const trends: PerformanceTrend[] = [];

      // Анализ системных трендов
      trends.push(...this.analyzeSystemMetricsTrends(recentMetrics, timeWindowHours));
      
      // Анализ трендов по агентам
      for (const agentType of ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'] as AgentType[]) {
        trends.push(...this.analyzeAgentTrends(recentMetrics, agentType, timeWindowHours));
      }

      // Анализ трендов валидации
      trends.push(...this.analyzeValidationTrends(recentMetrics, timeWindowHours));

      const filteredTrends = trends.filter(trend => trend.confidence_score >= OPTIMIZATION_CONSTANTS.PATTERN_CONFIDENCE_THRESHOLD);
      
      if (shouldLog) {
        console.log(`✅ Found ${filteredTrends.length} performance trends`);
      }

      // Reset failure count on success
      this.analysisState.consecutiveFailures = 0;
      
      return filteredTrends;

    } catch (error) {
      console.error('❌ Performance trends analysis failed:', error);
      this.analysisState.consecutiveFailures++;
      
      // Open circuit breaker if too many failures
      if (this.analysisState.consecutiveFailures >= this.throttleConfig.circuitBreakerThreshold) {
        this.analysisState.circuitBreakerOpen = true;
        console.error('🚨 Circuit breaker opened due to repeated failures');
      }
      
      return [];
    } finally {
      this.analysisState.isAnalyzing = false;
    }
  }

  /**
   * Выявление bottlenecks в системе
   */
  public async identifyBottlenecks(): Promise<Bottleneck[]> {
    const shouldLog = this.analysisState.analysisCount <= this.throttleConfig.logThrottleThreshold;
    if (shouldLog) {
      console.log('🔍 Identifying system bottlenecks');
    }
    
    if (this.metricsHistory.length === 0) {
      if (shouldLog) {
        console.warn('⚠️ No metrics data for bottleneck analysis');
      }
      return [];
    }

    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const bottlenecks: Bottleneck[] = [];

    // Анализ bottlenecks системы
    bottlenecks.push(...this.identifySystemBottlenecks(latestMetrics));
    
    // Анализ bottlenecks агентов
    for (const agentType of Object.keys(latestMetrics.agent_metrics) as AgentType[]) {
      bottlenecks.push(...this.identifyAgentBottlenecks(latestMetrics, agentType));
    }

    // Анализ bottlenecks валидации
    bottlenecks.push(...this.identifyValidationBottlenecks(latestMetrics));

    if (shouldLog) {
      console.log(`✅ Identified ${bottlenecks.length} bottlenecks`);
    }
    return bottlenecks.sort((a, b) => this.getBottleneckPriority(a) - this.getBottleneckPriority(b));
  }

  /**
   * Анализ паттернов ошибок
   */
  public async analyzeErrorPatterns(): Promise<ErrorPattern[]> {
    console.log('🔍 Analyzing error patterns');
    
    if (this.metricsHistory.length < OPTIMIZATION_CONSTANTS.MIN_DATA_POINTS_FOR_PATTERN) {
      console.warn('⚠️ Insufficient data for error pattern analysis');
      return [];
    }

    const errorPatterns: ErrorPattern[] = [];
    
    // Анализ паттернов системных ошибок
    errorPatterns.push(...this.analyzeSystemErrorPatterns());
    
    // Анализ паттернов ошибок агентов
    for (const agentType of ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'] as AgentType[]) {
      errorPatterns.push(...this.analyzeAgentErrorPatterns(agentType));
    }

    console.log(`✅ Found ${errorPatterns.length} error patterns`);
    return errorPatterns;
  }

  /**
   * Предсказание потенциальных проблем с защитой от рекурсии
   */
  public async predictPerformanceIssues(): Promise<PredictedIssue[]> {
    // Check circuit breaker
    if (this.analysisState.circuitBreakerOpen) {
      console.warn('⚡ Circuit breaker open - skipping predictions');
      return [];
    }

    const shouldLog = this.analysisState.analysisCount <= this.throttleConfig.logThrottleThreshold;
    if (shouldLog) {
      console.log('🔮 Predicting performance issues');
    }
    
    if (this.metricsHistory.length < OPTIMIZATION_CONSTANTS.MIN_DATA_POINTS_FOR_PATTERN) {
      if (shouldLog) {
        console.warn('⚠️ Insufficient data for prediction');
      }
      return [];
    }

    try {
      const predictions: PredictedIssue[] = [];
      
      // IMPORTANT: Don't call analyzePerformanceTrends() here to prevent recursion
      // Instead, use cached or simplified trend analysis
      const recentMetrics = this.metricsHistory.slice(-24); // Last 24 snapshots
      const simplifiedTrends = this.getSimplifiedTrends(recentMetrics);
      
      // Предсказание на основе упрощенных трендов
      predictions.push(...this.predictIssuesFromTrends(simplifiedTrends));
      
      // Предсказание перегрузки системы
      predictions.push(...this.predictSystemOverload());
      
      // Предсказание сбоев валидации
      predictions.push(...this.predictValidationFailures());

      const filteredPredictions = predictions.filter(p => p.confidence_percent >= OPTIMIZATION_CONSTANTS.PATTERN_CONFIDENCE_THRESHOLD);
      
      if (shouldLog) {
        console.log(`✅ Generated ${filteredPredictions.length} predictions`);
      }
      
      return filteredPredictions;

    } catch (error) {
      console.error('❌ Performance prediction failed:', error);
      this.analysisState.consecutiveFailures++;
      
      if (this.analysisState.consecutiveFailures >= this.throttleConfig.circuitBreakerThreshold) {
        this.analysisState.circuitBreakerOpen = true;
        console.error('🚨 Circuit breaker opened due to prediction failures');
      }
      
      return [];
    }
  }

  // ===== PRIVATE METHODS =====

  private analyzeSystemMetricsTrends(metrics: MetricsSnapshot[], timeWindowHours: number): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    
    // Анализ времени отклика системы
    const responseTimeTrend = this.calculateTrendForMetric(
      metrics.map(m => ({ timestamp: m.timestamp, value: m.system_metrics.average_response_time })),
      'system_average_response_time',
      timeWindowHours
    );
    if (responseTimeTrend) trends.push(responseTimeTrend);

    // Анализ success rate системы
    const successRateTrend = this.calculateTrendForMetric(
      metrics.map(m => ({ timestamp: m.timestamp, value: m.system_metrics.overall_success_rate })),
      'system_success_rate',
      timeWindowHours
    );
    if (successRateTrend) trends.push(successRateTrend);

    // Анализ health score системы
    const healthScoreTrend = this.calculateTrendForMetric(
      metrics.map(m => ({ timestamp: m.timestamp, value: m.system_metrics.system_health_score })),
      'system_health_score',
      timeWindowHours
    );
    if (healthScoreTrend) trends.push(healthScoreTrend);

    return trends;
  }

  private analyzeAgentTrends(metrics: MetricsSnapshot[], agentType: AgentType, timeWindowHours: number): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    
    // Фильтруем метрики где агент присутствует
    const agentMetrics = metrics.filter(m => m.agent_metrics[agentType]);
    
    if (agentMetrics.length < 3) return trends;

    // Анализ времени отклика агента
    const responseTimeTrend = this.calculateTrendForMetric(
      agentMetrics.map(m => ({ timestamp: m.timestamp, value: m.agent_metrics[agentType].response_time_ms })),
      `${agentType}_response_time`,
      timeWindowHours,
      agentType
    );
    if (responseTimeTrend) trends.push(responseTimeTrend);

    // Анализ success rate агента
    const successRateTrend = this.calculateTrendForMetric(
      agentMetrics.map(m => ({ timestamp: m.timestamp, value: m.agent_metrics[agentType].success_rate })),
      `${agentType}_success_rate`,
      timeWindowHours,
      agentType
    );
    if (successRateTrend) trends.push(successRateTrend);

    // Анализ throughput агента
    const throughputTrend = this.calculateTrendForMetric(
      agentMetrics.map(m => ({ timestamp: m.timestamp, value: m.agent_metrics[agentType].throughput_per_minute })),
      `${agentType}_throughput`,
      timeWindowHours,
      agentType
    );
    if (throughputTrend) trends.push(throughputTrend);

    return trends;
  }

  private analyzeValidationTrends(metrics: MetricsSnapshot[], timeWindowHours: number): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    
    // Анализ времени валидации
    const validationTimeTrend = this.calculateTrendForMetric(
      metrics.map(m => ({ timestamp: m.timestamp, value: m.validation_metrics.average_validation_time })),
      'validation_average_time',
      timeWindowHours
    );
    if (validationTimeTrend) trends.push(validationTimeTrend);

    // Анализ success rate валидации
    const validationSuccessTrend = this.calculateTrendForMetric(
      metrics.map(m => ({ timestamp: m.timestamp, value: m.validation_metrics.validation_success_rate })),
      'validation_success_rate',
      timeWindowHours
    );
    if (validationSuccessTrend) trends.push(validationSuccessTrend);

    return trends;
  }

  private calculateTrendForMetric(
    dataPoints: { timestamp: string; value: number }[], 
    metricName: string, 
    timeWindowHours: number,
    agentId?: AgentType
  ): PerformanceTrend | null {
    if (dataPoints.length < 3) return null;

    // Сортируем по времени
    const sortedData = dataPoints.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Вычисляем тренд методом линейной регрессии
    const n = sortedData.length;
    const xValues = sortedData.map((_, i) => i);
    const yValues = sortedData.map(d => d.value);
    
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    // Определяем направление тренда
    let trendDirection: TrendDirection;
    const changePercent = Math.abs((slope * (n - 1)) / avgY * 100);
    
    if (changePercent < 2) {
      trendDirection = 'stable';
    } else if (slope > 0) {
      trendDirection = 'up';
    } else {
      trendDirection = 'down';
    }

    // Вычисляем уверенность на основе R²
    const yMean = avgY;
    const totalVariation = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const unexplainedVariation = yValues.reduce((sum, y, i) => {
      const predicted = (slope * i) + (yMean - slope * (n - 1) / 2);
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const rSquared = totalVariation > 0 ? 1 - (unexplainedVariation / totalVariation) : 0;
    const confidenceScore = Math.max(0, Math.min(100, rSquared * 100));

    // Создаем trend data points с аномалиями
    const trendDataPoints: TrendDataPoint[] = sortedData.map((d, i) => {
      const predicted = (slope * i) + (yMean - slope * (n - 1) / 2);
      const deviation = Math.abs(d.value - predicted);
      const threshold = avgY * 0.2; // 20% отклонение как аномалия
      
      return {
        timestamp: d.timestamp,
        value: d.value,
        anomaly_detected: deviation > threshold
      };
    });

    return {
      metric_name: metricName,
      agent_id: agentId,
      trend_direction: trendDirection,
      change_percent: changePercent,
      confidence_score: confidenceScore,
      time_window: `${timeWindowHours}h`,
      data_points: trendDataPoints
    };
  }

  private identifySystemBottlenecks(metrics: MetricsSnapshot): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const thresholds = OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS;

    // Проверка времени отклика системы
    if (metrics.system_metrics.average_response_time > thresholds.max_response_time_ms) {
      bottlenecks.push({
        id: `system-response-time-${Date.now()}`,
        type: 'network',
        affected_agent: 'system',
        severity: metrics.system_metrics.average_response_time > thresholds.max_response_time_ms * 1.5 ? 'critical' : 'high',
        description: `System average response time (${metrics.system_metrics.average_response_time}ms) exceeds threshold (${thresholds.max_response_time_ms}ms)`,
        impact_assessment: 'High response time affects user experience and system throughput',
        resolution_urgency: 'high',
        estimated_improvement: Math.round((metrics.system_metrics.average_response_time - thresholds.max_response_time_ms) / thresholds.max_response_time_ms * 100)
      });
    }

    // Проверка success rate системы
    if (metrics.system_metrics.overall_success_rate < thresholds.min_success_rate_percent) {
      bottlenecks.push({
        id: `system-success-rate-${Date.now()}`,
        type: 'validation',
        affected_agent: 'system',
        severity: metrics.system_metrics.overall_success_rate < thresholds.min_success_rate_percent * 0.8 ? 'critical' : 'high',
        description: `System success rate (${metrics.system_metrics.overall_success_rate}%) below threshold (${thresholds.min_success_rate_percent}%)`,
        impact_assessment: 'Low success rate indicates widespread issues affecting system reliability',
        resolution_urgency: 'critical',
        estimated_improvement: Math.round((thresholds.min_success_rate_percent - metrics.system_metrics.overall_success_rate))
      });
    }

    return bottlenecks;
  }

  private identifyAgentBottlenecks(metrics: MetricsSnapshot, agentType: AgentType): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const agentMetrics = metrics.agent_metrics[agentType];
    const thresholds = OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS;

    if (!agentMetrics) return bottlenecks;

    // Проверка использования памяти
    if (agentMetrics.memory_usage_mb > thresholds.max_memory_usage_mb) {
      bottlenecks.push({
        id: `${agentType}-memory-${Date.now()}`,
        type: 'memory',
        affected_agent: agentType,
        severity: agentMetrics.memory_usage_mb > thresholds.max_memory_usage_mb * 1.2 ? 'critical' : 'medium',
        description: `${agentType} memory usage (${agentMetrics.memory_usage_mb}MB) exceeds threshold (${thresholds.max_memory_usage_mb}MB)`,
        impact_assessment: 'High memory usage may lead to performance degradation and potential crashes',
        resolution_urgency: 'medium',
        estimated_improvement: Math.round((agentMetrics.memory_usage_mb - thresholds.max_memory_usage_mb) / thresholds.max_memory_usage_mb * 100)
      });
    }

    // Проверка использования CPU
    if (agentMetrics.cpu_usage_percent > thresholds.max_cpu_usage_percent) {
      bottlenecks.push({
        id: `${agentType}-cpu-${Date.now()}`,
        type: 'cpu',
        affected_agent: agentType,
        severity: agentMetrics.cpu_usage_percent > thresholds.max_cpu_usage_percent * 1.2 ? 'high' : 'medium',
        description: `${agentType} CPU usage (${agentMetrics.cpu_usage_percent}%) exceeds threshold (${thresholds.max_cpu_usage_percent}%)`,
        impact_assessment: 'High CPU usage may cause response time degradation and resource contention',
        resolution_urgency: 'medium',
        estimated_improvement: Math.round((agentMetrics.cpu_usage_percent - thresholds.max_cpu_usage_percent))
      });
    }

    return bottlenecks;
  }

  private identifyValidationBottlenecks(metrics: MetricsSnapshot): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const validationMetrics = metrics.validation_metrics;
    const thresholds = OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS;

    // Проверка времени валидации
    if (validationMetrics.average_validation_time > thresholds.max_validation_time_ms) {
      bottlenecks.push({
        id: `validation-time-${Date.now()}`,
        type: 'validation',
        affected_agent: 'system',
        severity: 'medium',
        description: `Average validation time (${validationMetrics.average_validation_time}ms) exceeds threshold (${thresholds.max_validation_time_ms}ms)`,
        impact_assessment: 'Slow validation affects overall system responsiveness',
        resolution_urgency: 'medium',
        estimated_improvement: Math.round((validationMetrics.average_validation_time - thresholds.max_validation_time_ms) / thresholds.max_validation_time_ms * 100)
      });
    }

    return bottlenecks;
  }

  private analyzeSystemErrorPatterns(): ErrorPattern[] {
    // Анализ системных ошибок на основе критических событий
    const recentMetrics = this.metricsHistory.slice(-24); // Последние 24 снэпшота
    const errorCounts = recentMetrics.map(m => m.system_metrics.critical_events);
    const totalErrors = errorCounts.reduce((a, b) => a + b, 0);

    if (totalErrors === 0) return [];

    return [{
      pattern_id: `system-errors-${Date.now()}`,
      error_type: 'critical_system_events',
      frequency: totalErrors,
      affected_agents: ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'],
      common_conditions: ['High system load', 'Resource contention', 'Network issues'],
      potential_causes: ['Memory pressure', 'CPU overload', 'External service failures'],
      suggested_fixes: ['Scale resources', 'Optimize algorithms', 'Add circuit breakers'],
      business_impact: totalErrors > 10 ? 'high' : totalErrors > 5 ? 'medium' : 'low'
    }];
  }

  private analyzeAgentErrorPatterns(agentType: AgentType): ErrorPattern[] {
    const recentMetrics = this.metricsHistory.slice(-24);
    const agentErrors = recentMetrics
      .filter(m => m.agent_metrics[agentType])
      .map(m => m.agent_metrics[agentType].error_count);
    
    const totalErrors = agentErrors.reduce((a, b) => a + b, 0);
    
    if (totalErrors === 0) return [];

    return [{
      pattern_id: `${agentType}-errors-${Date.now()}`,
      error_type: `${agentType}_errors`,
      frequency: totalErrors,
      affected_agents: [agentType],
      common_conditions: [`${agentType} specific issues`],
      potential_causes: ['Input validation failures', 'External API timeouts', 'Resource limitations'],
      suggested_fixes: ['Improve input validation', 'Add retry mechanisms', 'Optimize resource usage'],
      business_impact: totalErrors > 5 ? 'medium' : 'low'
    }];
  }

  private predictIssuesFromTrends(trends: PerformanceTrend[]): PredictedIssue[] {
    const predictions: PredictedIssue[] = [];

    for (const trend of trends) {
      if (trend.trend_direction === 'down' && trend.metric_name.includes('success_rate') && trend.confidence_score > 80) {
        predictions.push({
          issue_id: `trend-prediction-${Date.now()}-${trend.metric_name}`,
          predicted_at: new Date().toISOString(),
          likely_occurrence: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          confidence_percent: trend.confidence_score,
          issue_type: 'performance_degradation',
          affected_components: trend.agent_id ? [trend.agent_id] : ['system'],
          preventive_actions: ['Monitor closely', 'Prepare rollback plan', 'Alert operations team'],
          monitoring_requirements: [`Track ${trend.metric_name}`, 'Monitor related metrics', 'Watch for anomalies']
        });
      }
    }

    return predictions;
  }

  private predictSystemOverload(): PredictedIssue[] {
    if (this.metricsHistory.length < 5) return [];

    const recentMetrics = this.metricsHistory.slice(-5);
    const avgRequests = recentMetrics.reduce((sum, m) => sum + m.system_metrics.total_requests, 0) / recentMetrics.length;
    const loadTrend = recentMetrics.map(m => m.system_metrics.total_requests);
    
    // Простой прогноз на основе роста нагрузки
    const isIncreasing = loadTrend.slice(-3).every((val, i, arr) => i === 0 || val >= arr[i - 1]);
    
    if (isIncreasing && avgRequests > 100) {
      return [{
        issue_id: `overload-prediction-${Date.now()}`,
        predicted_at: new Date().toISOString(),
        likely_occurrence: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        confidence_percent: 75,
        issue_type: 'system_overload',
        affected_components: ['system', 'all-agents'],
        preventive_actions: ['Scale resources', 'Enable load shedding', 'Optimize critical paths'],
        monitoring_requirements: ['Track request volume', 'Monitor response times', 'Watch resource usage']
      }];
    }

    return [];
  }

  private predictValidationFailures(): PredictedIssue[] {
    const recentMetrics = this.metricsHistory.slice(-10);
    const validationSuccessRates = recentMetrics.map(m => m.validation_metrics.validation_success_rate);
    const avgSuccessRate = validationSuccessRates.reduce((a, b) => a + b, 0) / validationSuccessRates.length;

    if (avgSuccessRate < 90) {
      return [{
        issue_id: `validation-failure-prediction-${Date.now()}`,
        predicted_at: new Date().toISOString(),
        likely_occurrence: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        confidence_percent: 70,
        issue_type: 'validation_failure',
        affected_components: ['validation-system'],
        preventive_actions: ['Review validation rules', 'Check data quality', 'Prepare manual override'],
        monitoring_requirements: ['Track validation success rate', 'Monitor error types', 'Watch input quality']
      }];
    }

    return [];
  }

  private getBottleneckPriority(bottleneck: Bottleneck): number {
    const severityPriority = { critical: 1, high: 2, medium: 3, low: 4 };
    return severityPriority[bottleneck.severity];
  }

  /**
   * Get simplified trends without triggering full analysis (prevents recursion)
   */
  private getSimplifiedTrends(metrics: MetricsSnapshot[]): PerformanceTrend[] {
    if (metrics.length < 3) return [];

    const trends: PerformanceTrend[] = [];
    
    // Simple trend calculation for success rate
    const successRates = metrics.map(m => m.system_metrics.overall_success_rate);
    const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;
    const recentSuccessRate = successRates.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    if (Math.abs(recentSuccessRate - avgSuccessRate) > 5) {
      trends.push({
        metric_name: 'system_success_rate',
        trend_direction: recentSuccessRate > avgSuccessRate ? 'up' : 'down',
        change_percent: ((recentSuccessRate - avgSuccessRate) / avgSuccessRate) * 100,
        confidence_score: 75,
        time_window: '1h',
        data_points: successRates.map((rate, i) => ({
          timestamp: metrics[i].timestamp,
          value: rate,
          anomaly_detected: false
        }))
      });
    }

    return trends;
  }

  /**
   * Generate baseline trends when insufficient data is available
   */
  private generateBaselineTrends(): PerformanceTrend[] {
    return [
      {
        metric_name: 'system_baseline',
        trend_direction: 'stable',
        change_percent: 0,
        confidence_score: 50,
        time_window: '1h',
        data_points: [{
          timestamp: new Date().toISOString(),
          value: 100,
          anomaly_detected: false
        }]
      }
    ];
  }
}