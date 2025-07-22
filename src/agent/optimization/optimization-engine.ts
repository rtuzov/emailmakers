/**
 * ⚙️ OPTIMIZATION ENGINE - Ядро системы автоматической оптимизации
 * 
 * Центральный компонент для анализа метрик, генерации рекомендаций
 * и безопасного применения оптимизаций с comprehensive safety mechanisms.
 */

import { 
  MetricsSnapshot,
  OptimizationRecommendation, 
  OptimizationResult,
  SystemAnalysis,
  OptimizationConfig,
  SafetyAssessment,
  OPTIMIZATION_CONSTANTS,
  OptimizationType,
  OptimizationPriority,
  OptimizationStatus,
  DynamicThresholds
} from './optimization-types';

import { OptimizationAnalyzer } from './optimization-analyzer';

export interface OptimizationEngineInterface {
  // Анализ текущих метрик
  analyzeSystemPerformance(): Promise<SystemAnalysis>;
  
  // Генерация рекомендаций
  generateOptimizations(): Promise<OptimizationRecommendation[]>;
  
  // Применение оптимизаций
  applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<OptimizationResult[]>;
  
  // Мониторинг результатов
  trackOptimizationResults(): Promise<OptimizationResult[]>;
  
  // Rollback оптимизаций
  rollbackOptimization(optimizationId: string): Promise<OptimizationResult>;
}

export class OptimizationEngine implements OptimizationEngineInterface {
  private analyzer: OptimizationAnalyzer;
  private config: OptimizationConfig;
  private activeOptimizations: Map<string, OptimizationResult> = new Map();
  private optimizationHistory: OptimizationResult[] = [];
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
  private lastSuccessfulAnalysis: SystemAnalysis | null = null;

  // Add throttling state
  private isAnalyzing: boolean = false;
  private lastAnalysisTime: number = 0;
  private analysisCount: number = 0;
  private readonly MIN_ANALYSIS_INTERVAL = 60000; // 1 minute minimum (increased from 30s)

  // Add logging throttling for tracking
  private lastTrackingLogTime: number = 0;
  private trackingLogCount: number = 0;
  private readonly MIN_TRACKING_LOG_INTERVAL = 300000; // 5 minutes between tracking logs
  private readonly MAX_TRACKING_LOGS_PER_HOUR = 6; // Limit to 6 logs per hour

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.analyzer = new OptimizationAnalyzer();
    
    console.log('⚙️ OptimizationEngine initialized');
    
    // Запускаем мониторинг только если не запущен
    if (!this.isRunning) {
      this.startContinuousMonitoring();
    }
  }

  /**
   * Анализ текущего состояния системы с throttling
   */
  public async analyzeSystemPerformance(): Promise<SystemAnalysis> {
    // Check if analysis is already running
    if (this.isAnalyzing) {
      console.warn('⏸️ System performance analysis already in progress');
      throw new Error('Analysis already in progress');
    }

    // Check minimum interval
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.MIN_ANALYSIS_INTERVAL) {
      const remainingTime = this.MIN_ANALYSIS_INTERVAL - timeSinceLastAnalysis;
      
      // Log throttling only occasionally to avoid spam
      if (this.analysisCount % 10 === 0) {
        console.warn(`⏳ System analysis throttled - ${Math.ceil(remainingTime / 1000)}s remaining`);
      }
      
      // Return cached analysis if available instead of throwing error
      if (this.lastSuccessfulAnalysis) {
        console.log('📋 Returning cached analysis due to throttling');
        return this.lastSuccessfulAnalysis;
      }
      
      throw new Error(`Analysis throttled - ${Math.ceil(remainingTime / 1000)}s remaining`);
    }

    this.isAnalyzing = true;
    this.lastAnalysisTime = Date.now();
    this.analysisCount++;

    try {
      const shouldLog = this.analysisCount <= 3; // Reduce logging after 3 analyses
      if (shouldLog) {
        console.log('🔍 Analyzing system performance...');
      }
      
      // Получаем текущие метрики (в реальности будет интеграция с MetricsService)
      const currentState = await this.getCurrentMetrics();
      
      // Анализируем тренды
      const trends = await this.analyzer.analyzePerformanceTrends(
        this.config.performance_settings?.analysis_window_hours || 24
      );
      
      // Выявляем bottlenecks
      const bottlenecks = await this.analyzer.identifyBottlenecks();
      
      // Анализируем паттерны ошибок
      const errorPatterns = await this.analyzer.analyzeErrorPatterns();
      
      // Предсказываем проблемы
      const predictedIssues = await this.analyzer.predictPerformanceIssues();

      // Генерируем общую оценку здоровья системы
      const overallHealthAssessment = this.generateHealthAssessment(
        currentState, trends, bottlenecks, errorPatterns
      );

      // Определяем возможности для оптимизации
      const optimizationOpportunities = this.identifyOptimizationOpportunities(
        trends, bottlenecks, errorPatterns
      );

      const analysis: SystemAnalysis = {
        current_state: currentState,
        trends,
        bottlenecks,
        error_patterns: errorPatterns,
        predicted_issues: predictedIssues,
        overall_health_assessment: overallHealthAssessment,
        optimization_opportunities: optimizationOpportunities
      };

      if (shouldLog) {
        console.log('✅ System analysis completed:', {
          trends: trends.length,
          bottlenecks: bottlenecks.length,
          errorPatterns: errorPatterns.length,
          predictedIssues: predictedIssues.length
        });
      }

      // Cache successful analysis
      this.lastSuccessfulAnalysis = analysis;
      
      return analysis;

    } catch (error) {
      console.error('❌ System analysis failed:', error);
      throw new Error(`System analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Генерация рекомендаций по оптимизации
   */
  public async generateOptimizations(): Promise<OptimizationRecommendation[]> {
    console.log('💡 Generating optimization recommendations...');
    
    try {
      const analysis = await this.analyzeSystemPerformance();
      const recommendations: OptimizationRecommendation[] = [];

      // Генерируем рекомендации на основе bottlenecks
      for (const bottleneck of analysis.bottlenecks) {
        const recommendation = this.generateBottleneckRecommendation(bottleneck);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Генерируем рекомендации на основе трендов
      for (const trend of analysis.trends) {
        const recommendation = this.generateTrendRecommendation(trend);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Генерируем рекомендации для threshold adjustments
      const thresholdRecommendations = await this.generateThresholdRecommendations(analysis);
      recommendations.push(...thresholdRecommendations);

      // Сортируем по приоритету
      const sortedRecommendations = recommendations.sort((a, b) => 
        this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority)
      );

      // Ограничиваем количество одновременных оптимизаций
      const maxConcurrent = this.config.safety_settings?.max_concurrent_optimizations || 
        OPTIMIZATION_CONSTANTS.MAX_OPTIMIZATION_BATCH_SIZE;
      
      const finalRecommendations = sortedRecommendations.slice(0, maxConcurrent);

      console.log(`✅ Generated ${finalRecommendations.length} optimization recommendations`);
      return finalRecommendations;
    } catch (error) {
      console.error('❌ Optimization generation failed:', error);
      throw new Error(`Optimization generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Применение оптимизаций с safety checks
   */
  public async applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<OptimizationResult[]> {
    console.log(`🚀 Applying ${recommendations.length} optimizations...`);
    
    const results: OptimizationResult[] = [];

    for (const recommendation of recommendations) {
      try {
        // Проверяем требования human approval
        if (recommendation.requires_human_approval) {
          console.log(`⏸️ Optimization ${recommendation.id} requires human approval, skipping automatic application`);
          continue;
        }

        // Safety checks
        const safetyCheck = await this.performSafetyChecks(recommendation);
        if (!safetyCheck.passed) {
          console.log(`⚠️ Safety check failed for optimization ${recommendation.id}: ${safetyCheck.reason}`);
          continue;
        }

        // Применяем оптимизацию
        const result = await this.executeOptimization(recommendation);
        results.push(result);

        // Сохраняем активную оптимизацию для мониторинга
        this.activeOptimizations.set(recommendation.id, result);

        console.log(`✅ Applied optimization ${recommendation.id} with status: ${result.status}`);
      } catch (error) {
        console.error(`❌ Failed to apply optimization ${recommendation.id}:`, error);
        
        // Создаем результат с ошибкой
        const errorResult: OptimizationResult = {
          optimization_id: recommendation.id,
          status: 'failed',
          applied_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          actions_executed: [],
          performance_impact: await this.createEmptyPerformanceImpact(),
          success_metrics: {
            goals_achieved: [],
            goals_missed: [recommendation.title],
            unexpected_benefits: [],
            side_effects: [`Execution error: ${error instanceof Error ? error.message : String(error)}`],
            overall_satisfaction_score: 0
          },
          issues_encountered: [error instanceof Error ? error.message : String(error)],
          rollback_triggered: false
        };
        
        results.push(errorResult);
      }
    }

    console.log(`✅ Applied optimizations completed. Success: ${results.filter(r => r.status === 'completed').length}, Failed: ${results.filter(r => r.status === 'failed').length}`);
    return results;
  }

  /**
   * Отслеживание результатов активных оптимизаций
   */
  public async trackOptimizationResults(): Promise<OptimizationResult[]> {
    // Throttle logging to prevent spam
    const now = Date.now();
    const timeSinceLastLog = now - this.lastTrackingLogTime;
    const shouldLog = timeSinceLastLog > this.MIN_TRACKING_LOG_INTERVAL && 
                     this.trackingLogCount < this.MAX_TRACKING_LOGS_PER_HOUR;

    if (shouldLog) {
      console.log('📊 Tracking optimization results...');
      this.lastTrackingLogTime = now;
      this.trackingLogCount++;
      
      // Reset hourly counter
      if (this.trackingLogCount >= this.MAX_TRACKING_LOGS_PER_HOUR) {
        setTimeout(() => {
          this.trackingLogCount = 0;
        }, 3600000); // Reset after 1 hour
      }
    }
    
    const results: OptimizationResult[] = [];

    for (const [optimizationId, result] of Array.from(this.activeOptimizations.entries())) {
      try {
        // Проверяем нужно ли делать rollback
        const shouldRollback = await this.checkRollbackTriggers(result);
        
        if (shouldRollback.triggered) {
          if (shouldLog) {
            console.log(`🔄 Triggering rollback for optimization ${optimizationId}: ${shouldRollback.reason}`);
          }
          await this.rollbackOptimization(optimizationId);
          continue;
        }

        // Обновляем метрики результата
        const updatedResult = await this.updateOptimizationMetrics(result);
        this.activeOptimizations.set(optimizationId, updatedResult);
        results.push(updatedResult);

      } catch (error) {
        if (shouldLog) {
          console.error(`❌ Error tracking optimization ${optimizationId}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Rollback оптимизации
   */
  public async rollbackOptimization(optimizationId: string): Promise<OptimizationResult> {
    console.log(`🔄 Rolling back optimization ${optimizationId}...`);
    
    const activeOptimization = this.activeOptimizations.get(optimizationId);
    if (!activeOptimization) {
      throw new Error(`Optimization ${optimizationId} not found in active optimizations`);
    }

    try {
      // В реальной реализации здесь будет логика отката изменений
      // Пока что просто помечаем как откаченное
      const rolledBackResult: OptimizationResult = {
        ...activeOptimization,
        status: 'rolled_back',
        rollback_triggered: true,
        rollback_reason: 'Manual rollback or safety trigger activated',
        completed_at: new Date().toISOString()
      };

      // Удаляем из активных и добавляем в историю
      this.activeOptimizations.delete(optimizationId);
      this.optimizationHistory.push(rolledBackResult);

      console.log(`✅ Rollback completed for optimization ${optimizationId}`);
      return rolledBackResult;
    } catch (error) {
      console.error(`❌ Rollback failed for optimization ${optimizationId}:`, error);
      throw error;
    }
  }

  /**
   * Получение динамических thresholds
   */
  public async generateDynamicThresholds(): Promise<DynamicThresholds> {
    console.log('🎯 Generating dynamic thresholds...');
    
    const analysis = await this.analyzeSystemPerformance();
    const currentThresholds = OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS;
    
    // Анализируем тренды для корректировки thresholds
    const recommendedThresholds = { ...currentThresholds };
    const reasoning = [];

    // Если success rate стабильно высокий - можем ужесточить требования
    const successRateTrend = analysis.trends.find(t => 
      t.metric_name.includes('success_rate') && t.trend_direction === 'up'
    );
    
    if (successRateTrend && successRateTrend.confidence_score > 80) {
      recommendedThresholds.min_success_rate_percent = Math.min(98, currentThresholds.min_success_rate_percent + 2);
      reasoning.push({
        threshold_name: 'min_success_rate_percent',
        current_value: currentThresholds.min_success_rate_percent,
        recommended_value: recommendedThresholds.min_success_rate_percent,
        change_percent: 2,
        justification: 'Success rate trend is consistently positive, can raise standards',
        supporting_data: [`Trend confidence: ${successRateTrend.confidence_score}%`],
        risk_assessment: 'Low risk - gradual improvement'
      });
    }

    // Если response time стабильно улучшается - можем снизить лимит
    const responseTimeTrend = analysis.trends.find(t => 
      t.metric_name.includes('response_time') && t.trend_direction === 'down'
    );
    
    if (responseTimeTrend && responseTimeTrend.confidence_score > 80) {
      const reduction = Math.min(500, currentThresholds.max_response_time_ms * 0.1);
      recommendedThresholds.max_response_time_ms = currentThresholds.max_response_time_ms - reduction;
      reasoning.push({
        threshold_name: 'max_response_time_ms',
        current_value: currentThresholds.max_response_time_ms,
        recommended_value: recommendedThresholds.max_response_time_ms,
        change_percent: (reduction / currentThresholds.max_response_time_ms) * 100,
        justification: 'Response time consistently improving, can set stricter limits',
        supporting_data: [`Trend confidence: ${responseTimeTrend.confidence_score}%`],
        risk_assessment: 'Low risk - based on positive performance trend'
      });
    }

    const safetyAssessment: SafetyAssessment = {
      risk_level: 'low',
      potential_negative_impacts: ['Slightly more sensitive alerting'],
      safety_checks_required: ['Monitor alert frequency', 'Track false positive rate'],
      monitoring_requirements: ['Watch for threshold breach frequency', 'Monitor system stability'],
      rollback_triggers: [{
        metric_name: 'alert_frequency',
        threshold_value: currentThresholds.min_success_rate_percent * 1.1,
        comparison: 'greater_than',
        time_window_minutes: 60,
        description: 'Too many alerts triggered by new thresholds'
      }],
      approval_requirements: reasoning.length > 2 ? ['Senior engineer approval'] : []
    };

    return {
      current: currentThresholds,
      recommended: recommendedThresholds,
      reasoning,
      safety_check: safetyAssessment,
      adjustment_history: [] // В реальности загружается из БД
    };
  }

  // ===== PRIVATE METHODS =====

  private mergeConfig(config: Partial<OptimizationConfig>): OptimizationConfig {
    return {
      safety_settings: {
        require_human_approval_for_critical: true,
        max_concurrent_optimizations: OPTIMIZATION_CONSTANTS.MAX_OPTIMIZATION_BATCH_SIZE,
        rollback_timeout_minutes: 30,
        ...config.safety_settings
      },
      learning_settings: {
        enable_pattern_learning: true,
        pattern_detection_sensitivity: 80,
        prediction_confidence_threshold: OPTIMIZATION_CONSTANTS.PATTERN_CONFIDENCE_THRESHOLD,
        ...config.learning_settings
      },
      performance_settings: {
        metrics_collection_interval_seconds: 60,
        analysis_window_hours: 24,
        optimization_frequency_hours: 6,
        ...config.performance_settings
      }
    };
  }

  private async startContinuousMonitoring(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Starting continuous optimization monitoring...');

    // Мониторинг каждые 30 минут (было 5 минут)
    setInterval(async () => {
      try {
        await this.trackOptimizationResults();
      } catch (error) {
        console.error('❌ Error in continuous monitoring:', error);
      }
    }, 30 * 60 * 1000); // Changed from 5 minutes to 30 minutes
  }

  private async getCurrentMetrics(): Promise<MetricsSnapshot> {
    // В реальности будет интеграция с MetricsService
    // Пока возвращаем mock данные
    return {
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
    };
  }

  private generateHealthAssessment(
    currentState: MetricsSnapshot,
    _trends: any[],
    bottlenecks: any[],
    _errorPatterns: any[]
  ): string {
    const healthScore = currentState.system_metrics.system_health_score;
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    // const _negativeTrends = trends.filter(t => t.trend_direction === 'down').length;

    if (healthScore >= 90 && criticalBottlenecks === 0) {
      return 'Excellent - System performing optimally with no critical issues';
    } else if (healthScore >= 80 && criticalBottlenecks <= 1) {
      return 'Good - System stable with minor optimization opportunities';
    } else if (healthScore >= 70 || criticalBottlenecks <= 2) {
      return 'Fair - System functional but requires attention to performance issues';
    } else {
      return 'Poor - System experiencing significant performance problems requiring immediate action';
    }
  }

  private identifyOptimizationOpportunities(trends: any[], bottlenecks: any[], errorPatterns: any[]): string[] {
    const opportunities = [];

    if (bottlenecks.length > 0) {
      opportunities.push(`Address ${bottlenecks.length} identified bottlenecks`);
    }

    const improvingTrends = trends.filter(t => t.trend_direction === 'up' && t.metric_name.includes('success_rate'));
    if (improvingTrends.length > 0) {
      opportunities.push('Leverage positive trends to raise performance standards');
    }

    const degradingTrends = trends.filter(t => t.trend_direction === 'down' && t.confidence_score > 80);
    if (degradingTrends.length > 0) {
      opportunities.push('Prevent performance degradation through proactive optimization');
    }

    if (errorPatterns.length > 0) {
      opportunities.push('Implement targeted fixes for recurring error patterns');
    }

    return opportunities;
  }

  private generateBottleneckRecommendation(bottleneck: any): OptimizationRecommendation | null {
    // Генерация рекомендации на основе типа bottleneck
    const id = `bottleneck-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (bottleneck.type) {
      case 'memory':
        return this.createMemoryOptimizationRecommendation(id, bottleneck);
      case 'cpu':
        return this.createCpuOptimizationRecommendation(id, bottleneck);
      case 'validation':
        return this.createValidationOptimizationRecommendation(id, bottleneck);
      default:
        return null;
    }
  }

  private generateTrendRecommendation(trend: any): OptimizationRecommendation | null {
    if (trend.trend_direction === 'down' && trend.confidence_score > 80) {
      const id = `trend-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id,
        type: 'performance_tuning' as OptimizationType,
        priority: 'high' as OptimizationPriority,
        title: `Address declining ${trend.metric_name}`,
        description: `Performance degradation detected in ${trend.metric_name} with ${trend.change_percent}% decline`,
        rationale: `High confidence (${trend.confidence_score}%) negative trend requires intervention`,
        expected_impact: {
          performance_improvement_percent: Math.min(trend.change_percent, 15),
          success_rate_improvement_percent: 2,
          response_time_reduction_ms: 100,
          resource_efficiency_gain_percent: 5,
          confidence_level: trend.confidence_score,
          business_value: 'Prevent service degradation and maintain user satisfaction'
        },
        implementation: [{
          action_type: 'algorithm_tuning',
          target_component: trend.agent_id || 'system',
          current_value: 'default_parameters',
          new_value: 'optimized_parameters',
          validation_required: true,
          rollback_possible: true,
          execution_order: 1
        }],
        rollback_plan: [{
          action_type: 'algorithm_tuning',
          target_component: trend.agent_id || 'system',
          current_value: 'optimized_parameters',
          new_value: 'default_parameters',
          validation_required: true,
          rollback_possible: true,
          execution_order: 1
        }],
        safety_assessment: {
          risk_level: 'medium',
          potential_negative_impacts: ['Temporary performance fluctuation during optimization'],
          safety_checks_required: ['Performance monitoring', 'Rollback readiness'],
          monitoring_requirements: [`Track ${trend.metric_name}`, 'Monitor related metrics'],
          rollback_triggers: [{
            metric_name: trend.metric_name,
            threshold_value: trend.data_points[trend.data_points.length - 1].value * 0.9,
            comparison: 'less_than',
            time_window_minutes: 30,
            description: 'Performance degraded further after optimization'
          }],
          approval_requirements: trend.confidence_score > 90 ? [] : ['Engineering review']
        },
        estimated_duration: '15-30 minutes',
        requires_human_approval: trend.confidence_score < 90,
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  }

  private async generateThresholdRecommendations(_analysis: SystemAnalysis): Promise<OptimizationRecommendation[]> {
    const dynamicThresholds = await this.generateDynamicThresholds();
    const recommendations: OptimizationRecommendation[] = [];

    if (dynamicThresholds.reasoning.length > 0) {
      const id = `threshold-adjustment-${Date.now()}`;
      
      recommendations.push({
        id,
        type: 'threshold_adjustment' as OptimizationType,
        priority: 'medium' as OptimizationPriority,
        title: 'Adjust alert thresholds based on performance trends',
        description: `Optimize ${dynamicThresholds.reasoning.length} thresholds based on recent performance data`,
        rationale: 'Performance trends indicate opportunity to optimize alerting sensitivity',
        expected_impact: {
          performance_improvement_percent: 3,
          success_rate_improvement_percent: 1,
          response_time_reduction_ms: 0,
          resource_efficiency_gain_percent: 2,
          confidence_level: 85,
          business_value: 'More accurate alerting and improved operational efficiency'
        },
        implementation: dynamicThresholds.reasoning.map((r, i) => ({
          action_type: 'threshold_adjustment' as const,
          target_component: r.threshold_name,
          current_value: r.current_value,
          new_value: r.recommended_value,
          validation_required: true,
          rollback_possible: true,
          execution_order: i + 1
        })),
        rollback_plan: dynamicThresholds.reasoning.map((r, i) => ({
          action_type: 'threshold_adjustment' as const,
          target_component: r.threshold_name,
          current_value: r.recommended_value,
          new_value: r.current_value,
          validation_required: true,
          rollback_possible: true,
          execution_order: i + 1
        })),
        safety_assessment: dynamicThresholds.safety_check,
        estimated_duration: '5-10 minutes',
        requires_human_approval: dynamicThresholds.reasoning.length > 2,
        created_at: new Date().toISOString()
      });
    }

    return recommendations;
  }

  private createMemoryOptimizationRecommendation(id: string, bottleneck: any): OptimizationRecommendation {
    return {
      id,
      type: 'resource_optimization' as OptimizationType,
      priority: bottleneck.severity === 'critical' ? 'critical' as OptimizationPriority : 'high' as OptimizationPriority,
      title: `Optimize memory usage for ${bottleneck.affected_agent}`,
      description: bottleneck.description,
      rationale: bottleneck.impact_assessment,
      expected_impact: {
        performance_improvement_percent: bottleneck.estimated_improvement,
        success_rate_improvement_percent: 3,
        response_time_reduction_ms: 200,
        resource_efficiency_gain_percent: 15,
        confidence_level: 80,
        business_value: 'Prevent memory-related crashes and improve system stability'
      },
      implementation: [{
        action_type: 'resource_allocation',
        target_component: bottleneck.affected_agent,
        current_value: 'default_memory_limits',
        new_value: 'optimized_memory_limits',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      rollback_plan: [{
        action_type: 'resource_allocation',
        target_component: bottleneck.affected_agent,
        current_value: 'optimized_memory_limits',
        new_value: 'default_memory_limits',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      safety_assessment: {
        risk_level: bottleneck.severity === 'critical' ? 'high' : 'medium',
        potential_negative_impacts: ['Temporary service interruption during optimization'],
        safety_checks_required: ['Memory usage monitoring', 'Service health checks'],
        monitoring_requirements: ['Track memory usage', 'Monitor service stability'],
        rollback_triggers: [{
          metric_name: 'memory_usage_mb',
          threshold_value: OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS.max_memory_usage_mb * 1.1,
          comparison: 'greater_than',
          time_window_minutes: 15,
          description: 'Memory usage increased after optimization'
        }],
        approval_requirements: bottleneck.severity === 'critical' ? ['Senior engineer approval'] : []
      },
      estimated_duration: '10-20 minutes',
      requires_human_approval: bottleneck.severity === 'critical',
      created_at: new Date().toISOString()
    };
  }

  private createCpuOptimizationRecommendation(id: string, bottleneck: any): OptimizationRecommendation {
    return {
      id,
      type: 'resource_optimization' as OptimizationType,
      priority: 'medium' as OptimizationPriority,
      title: `Optimize CPU usage for ${bottleneck.affected_agent}`,
      description: bottleneck.description,
      rationale: bottleneck.impact_assessment,
      expected_impact: {
        performance_improvement_percent: bottleneck.estimated_improvement,
        success_rate_improvement_percent: 2,
        response_time_reduction_ms: 150,
        resource_efficiency_gain_percent: 10,
        confidence_level: 75,
        business_value: 'Improve response times and system efficiency'
      },
      implementation: [{
        action_type: 'algorithm_tuning',
        target_component: bottleneck.affected_agent,
        current_value: 'default_cpu_settings',
        new_value: 'optimized_cpu_settings',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      rollback_plan: [{
        action_type: 'algorithm_tuning',
        target_component: bottleneck.affected_agent,
        current_value: 'optimized_cpu_settings',
        new_value: 'default_cpu_settings',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      safety_assessment: {
        risk_level: 'low',
        potential_negative_impacts: ['Minor performance fluctuation during tuning'],
        safety_checks_required: ['CPU usage monitoring'],
        monitoring_requirements: ['Track CPU usage', 'Monitor response times'],
        rollback_triggers: [{
          metric_name: 'cpu_usage_percent',
          threshold_value: OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS.max_cpu_usage_percent * 1.2,
          comparison: 'greater_than',
          time_window_minutes: 20,
          description: 'CPU usage increased significantly after optimization'
        }],
        approval_requirements: []
      },
      estimated_duration: '5-15 minutes',
      requires_human_approval: false,
      created_at: new Date().toISOString()
    };
  }

  private createValidationOptimizationRecommendation(id: string, bottleneck: any): OptimizationRecommendation {
    return {
      id,
      type: 'performance_tuning' as OptimizationType,
      priority: 'medium' as OptimizationPriority,
      title: 'Optimize validation performance',
      description: bottleneck.description,
      rationale: bottleneck.impact_assessment,
      expected_impact: {
        performance_improvement_percent: bottleneck.estimated_improvement,
        success_rate_improvement_percent: 1,
        response_time_reduction_ms: 100,
        resource_efficiency_gain_percent: 8,
        confidence_level: 70,
        business_value: 'Faster validation improves overall system responsiveness'
      },
      implementation: [{
        action_type: 'algorithm_tuning',
        target_component: 'validation_system',
        current_value: 'default_validation_config',
        new_value: 'optimized_validation_config',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      rollback_plan: [{
        action_type: 'algorithm_tuning',
        target_component: 'validation_system',
        current_value: 'optimized_validation_config',
        new_value: 'default_validation_config',
        validation_required: true,
        rollback_possible: true,
        execution_order: 1
      }],
      safety_assessment: {
        risk_level: 'low',
        potential_negative_impacts: ['Potential validation accuracy changes'],
        safety_checks_required: ['Validation accuracy monitoring', 'Performance tracking'],
        monitoring_requirements: ['Track validation time', 'Monitor validation success rate'],
        rollback_triggers: [{
          metric_name: 'validation_success_rate',
          threshold_value: OPTIMIZATION_CONSTANTS.TARGET_SUCCESS_RATE_PERCENT * 0.95,
          comparison: 'less_than',
          time_window_minutes: 30,
          description: 'Validation success rate dropped after optimization'
        }],
        approval_requirements: []
      },
      estimated_duration: '10-25 minutes',
      requires_human_approval: false,
      created_at: new Date().toISOString()
    };
  }

  private getPriorityWeight(priority: OptimizationPriority): number {
    const weights = { critical: 1, high: 2, medium: 3, low: 4 };
    return weights[priority];
  }

  private async performSafetyChecks(recommendation: OptimizationRecommendation): Promise<{ passed: boolean; reason?: string }> {
    // Проверяем лимиты безопасности
    if (this.activeOptimizations.size >= (this.config.safety_settings?.max_concurrent_optimizations || 5)) {
      return { passed: false, reason: 'Maximum concurrent optimizations limit reached' };
    }

    // Проверяем критические рекомендации
    if (recommendation.priority === 'critical' && this.config.safety_settings?.require_human_approval_for_critical) {
      return { passed: false, reason: 'Critical optimizations require human approval' };
    }

    // Проверяем risk level
    if (recommendation.safety_assessment.risk_level === 'critical') {
      return { passed: false, reason: 'Critical risk level requires manual review' };
    }

    return { passed: true };
  }

  private async executeOptimization(recommendation: OptimizationRecommendation): Promise<OptimizationResult> {
    const startTime = new Date().toISOString();
    
    try {
      // В реальной реализации здесь будет выполнение actions
      // Пока что имитируем выполнение
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result: OptimizationResult = {
        optimization_id: recommendation.id,
        status: 'completed' as OptimizationStatus,
        applied_at: startTime,
        started_at: startTime,
        completed_at: new Date().toISOString(),
        execution_time_ms: 1000,
        actions_executed: recommendation.implementation.map(action => ({
          action,
          executed_at: new Date().toISOString(),
          success: true,
          actual_change: action.new_value,
          validation_result: {
            is_valid: true,
            validation_time_ms: 100,
            checks_performed: ['syntax_check', 'safety_check'],
            warnings: [],
            errors: []
          }
        })),
        performance_impact: await this.createEmptyPerformanceImpact(),
        success_metrics: {
          goals_achieved: [recommendation.title],
          goals_missed: [],
          unexpected_benefits: [],
          side_effects: [],
          overall_satisfaction_score: 85
        },
        issues_encountered: [],
        rollback_triggered: false
      };

      return result;
    } catch (error) {
      return {
        optimization_id: recommendation.id,
        status: 'failed' as OptimizationStatus,
        applied_at: startTime,
        started_at: startTime,
        completed_at: new Date().toISOString(),
        actions_executed: [],
        performance_impact: await this.createEmptyPerformanceImpact(),
        success_metrics: {
          goals_achieved: [],
          goals_missed: [recommendation.title],
          unexpected_benefits: [],
          side_effects: [],
          overall_satisfaction_score: 0
        },
        issues_encountered: [error instanceof Error ? error.message : String(error)],
        rollback_triggered: false
      };
    }
  }

  private async checkRollbackTriggers(_result: OptimizationResult): Promise<{ triggered: boolean; reason?: string }> {
    // В реальной реализации здесь будет проверка rollback triggers
    // Пока что возвращаем false для всех
    return { triggered: false };
  }

  private async updateOptimizationMetrics(result: OptimizationResult): Promise<OptimizationResult> {
    // В реальной реализации здесь будет обновление метрик
    // Пока что возвращаем текущий результат
    return result;
  }

  private async createEmptyPerformanceImpact(): Promise<any> {
    const emptyMetrics = await this.getCurrentMetrics();
    return {
      before_metrics: emptyMetrics,
      after_metrics: emptyMetrics,
      improvement_metrics: {
        response_time_change_ms: 0,
        success_rate_change_percent: 0,
        throughput_change_percent: 0,
        error_rate_change_percent: 0,
        system_health_change: 0
      },
      degradation_detected: false,
      overall_success: true
    };
  }
}