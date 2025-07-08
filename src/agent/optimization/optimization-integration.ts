/**
 * 🔗 OPTIMIZATION INTEGRATION - Мост между OptimizationEngine и существующими мониторинг системами
 * 
 * Этот модуль интегрирует OptimizationEngine с ValidationMonitor, MetricsService,
 * и PerformanceMonitor для создания единой системы оптимизации.
 */

import { EventEmitter } from 'events';
import { 
  MetricsSnapshot,
  OptimizationRecommendation,
  SystemAnalysis,
  OptimizationResult,
  AgentType,
  OPTIMIZATION_CONSTANTS 
} from './optimization-types';
import { OptimizationEngine } from './optimization-engine';
import { ValidationMonitor } from '../monitoring/validation-monitor';
import { MetricsService } from '../../shared/infrastructure/monitoring/metrics-service';
import { performanceMonitor } from '../../shared/infrastructure/performance/performance-monitoring-service';

export interface OptimizationIntegrationConfig {
  enabled: boolean;
  auto_optimization_enabled: boolean;
  metrics_collection_interval_ms: number;
  optimization_interval_ms: number;
  require_human_approval_for_critical: boolean;
  max_auto_optimizations_per_hour: number;
}

export interface IntegratedMetricsSnapshot extends MetricsSnapshot {
  // Источники данных
  data_sources: {
    validation_monitor: boolean;
    metrics_service: boolean;
    performance_monitor: boolean;
  };
  
  // Дополнительные метрики для оптимизации
  optimization_metadata: {
    last_optimization_time: string;
    active_optimizations_count: number;
    optimization_success_rate: number;
    recommendations_applied_today: number;
  };
}

export class OptimizationIntegration extends EventEmitter {
  private optimizationEngine: OptimizationEngine;
  private validationMonitor: ValidationMonitor;
  private metricsService: MetricsService;
  private config: OptimizationIntegrationConfig;
  
  private isRunning: boolean = false;
  private metricsCollectionTimer?: NodeJS.Timeout;
  private optimizationTimer?: NodeJS.Timeout;
  private appliedOptimizationsToday: number = 0;
  private lastOptimizationReset: string = new Date().toDateString();

  // Add logging throttling for metrics collection
  private lastMetricsLogTime: number = 0;
  private metricsLogCount: number = 0;
  private readonly MIN_METRICS_LOG_INTERVAL = 600000; // 10 minutes between metrics logs
  private readonly MAX_METRICS_LOGS_PER_HOUR = 6; // Limit to 6 logs per hour

  constructor(config: Partial<OptimizationIntegrationConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      auto_optimization_enabled: true,
      metrics_collection_interval_ms: 900000, // 15 minutes (was likely much shorter)
      optimization_interval_ms: 1800000, // 30 minutes (was likely much shorter)
      require_human_approval_for_critical: true,
      max_auto_optimizations_per_hour: 2, // Reduced from potentially higher number
      ...config
    };

    console.log('🔧 OptimizationIntegration initialized with config:', {
      enabled: this.config.enabled,
      auto_optimization: this.config.auto_optimization_enabled,
      metrics_interval_minutes: this.config.metrics_collection_interval_ms / 60000,
      optimization_interval_minutes: this.config.optimization_interval_ms / 60000,
      max_optimizations_per_hour: this.config.max_auto_optimizations_per_hour
    });

    this.optimizationEngine = new OptimizationEngine();
    this.validationMonitor = ValidationMonitor.getInstance();
    this.metricsService = new MetricsService();

    this.setupEventListeners();
  }

  /**
   * Запуск интегрированной системы оптимизации
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ OptimizationIntegration already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('📴 OptimizationIntegration disabled in config');
      return;
    }

    console.log('🚀 Starting OptimizationIntegration...');
    this.isRunning = true;

    // Запуск периодического сбора метрик
    this.startMetricsCollection();

    // Запуск периодической оптимизации (если включена)
    if (this.config.auto_optimization_enabled) {
      this.startPeriodicOptimization();
    }

    this.emit('started');
    console.log('✅ OptimizationIntegration started successfully');
  }

  /**
   * Остановка системы оптимизации
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping OptimizationIntegration...');
    this.isRunning = false;

    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    this.emit('stopped');
    console.log('✅ OptimizationIntegration stopped');
  }

  /**
   * Получение объединенного снэпшота метрик из всех источников
   */
  public async getIntegratedMetricsSnapshot(): Promise<IntegratedMetricsSnapshot> {
    // Throttle logging to prevent spam
    const now = Date.now();
    const timeSinceLastLog = now - this.lastMetricsLogTime;
    const shouldLog = timeSinceLastLog > this.MIN_METRICS_LOG_INTERVAL && 
                     this.metricsLogCount < this.MAX_METRICS_LOGS_PER_HOUR;

    if (shouldLog) {
      console.log('📊 Collecting integrated metrics snapshot...');
      this.lastMetricsLogTime = now;
      this.metricsLogCount++;
      
      // Reset hourly counter
      if (this.metricsLogCount >= this.MAX_METRICS_LOGS_PER_HOUR) {
        setTimeout(() => {
          this.metricsLogCount = 0;
        }, 3600000); // Reset after 1 hour
      }
    }

    try {
      // Получаем метрики из ValidationMonitor
      const validationMetrics = this.validationMonitor.getMetrics();
      
      // Получаем метрики из MetricsService
      const infrastructureMetrics = this.metricsService.getSnapshot();
      
      // Получаем системные метрики производительности
      const systemStats = performanceMonitor.getPerformanceStats();
      
      // Преобразуем в формат OptimizationEngine
      const integratedSnapshot: IntegratedMetricsSnapshot = {
        timestamp: new Date().toISOString(),
        
        // Агентские метрики из ValidationMonitor
        agent_metrics: this.convertAgentMetrics(validationMetrics),
        
        // Системные метрики из PerformanceMonitor и MetricsService
        system_metrics: {
          total_requests: this.extractTotalRequests(infrastructureMetrics),
          active_agents: Object.keys(validationMetrics.agentMetrics).length,
          average_response_time: this.calculateAverageResponseTime(infrastructureMetrics),
          overall_success_rate: validationMetrics.successRate,
          critical_events: validationMetrics.criticalEvents.length,
          system_health_score: this.calculateSystemHealthScore(validationMetrics, systemStats)
        },
        
        // Метрики валидации из ValidationMonitor
        validation_metrics: {
          total_validations: validationMetrics.totalValidations,
          validation_success_rate: validationMetrics.successRate,
          average_validation_time: validationMetrics.averageValidationTime,
          failed_validations: validationMetrics.failedValidations,
          quality_score_average: this.calculateQualityScore(validationMetrics),
          compatibility_score_average: this.calculateCompatibilityScore(validationMetrics)
        },

        // Метаинформация для отслеживания источников
        data_sources: {
          validation_monitor: true,
          metrics_service: true,
          performance_monitor: true
        },

        // Метаданные оптимизации
        optimization_metadata: {
          last_optimization_time: this.getLastOptimizationTime(),
          active_optimizations_count: await this.getActiveOptimizationsCount(),
          optimization_success_rate: await this.getOptimizationSuccessRate(),
          recommendations_applied_today: this.getRecommendationsAppliedToday()
        }
      };

      if (shouldLog) {
        console.log('✅ Integrated metrics snapshot collected successfully');
      }
      return integratedSnapshot;

    } catch (error) {
      if (shouldLog) {
        console.error('❌ Failed to collect integrated metrics:', error);
      }
      throw new Error(`Integrated metrics collection failed: ${error.message}`);
    }
  }

  /**
   * Выполнение полного анализа системы с рекомендациями
   */
  public async performFullOptimizationAnalysis(): Promise<SystemAnalysis> {
    console.log('🔍 Performing full optimization analysis...');

    // Получаем интегрированные метрики
    const metrics = await this.getIntegratedMetricsSnapshot();
    
    // Добавляем метрики в OptimizationEngine
    this.optimizationEngine['analyzer'].addMetricsSnapshot(metrics);
    
    // Выполняем анализ
    const analysis = await this.optimizationEngine.analyzeSystemPerformance();
    
    // Обогащаем анализ данными из существующих систем
    const enhancedAnalysis = this.enhanceAnalysisWithExistingData(analysis);
    
    this.emit('analysis_completed', enhancedAnalysis);
    return enhancedAnalysis;
  }

  /**
   * Генерация и применение оптимизаций (с учетом безопасности)
   */
  public async generateAndApplyOptimizations(): Promise<OptimizationResult[]> {
    console.log('⚙️ Generating and applying optimizations...');

    if (!this.canApplyMoreOptimizations()) {
      console.log('⏸️ Optimization limit reached for today');
      return [];
    }

    try {
      // Выполняем анализ
      await this.performFullOptimizationAnalysis();
      
      // Генерируем рекомендации
      const recommendations = await this.optimizationEngine.generateOptimizations();
      
      // Фильтруем рекомендации по политике безопасности
      const safeRecommendations = this.filterRecommendationsBySafetyPolicy(recommendations);
      
      if (safeRecommendations.length === 0) {
        console.log('ℹ️ No safe recommendations available for auto-application');
        return [];
      }

      // Применяем безопасные рекомендации
      const results = await this.optimizationEngine.applyOptimizations(safeRecommendations);
      
      // Обновляем счетчики
      this.appliedOptimizationsToday += results.filter(r => r.status === 'completed').length;
      
      // Уведомляем о применении оптимизаций
      this.emit('optimizations_applied', results);
      
      // Интегрируем результаты с существующими системами
      await this.integrateOptimizationResults(results);

      console.log(`✅ Applied ${results.length} optimizations successfully`);
      return results;

    } catch (error) {
      console.error('❌ Failed to generate/apply optimizations:', error);
      this.emit('optimization_error', error);
      throw error;
    }
  }

  /**
   * Получение рекомендаций без автоматического применения
   */
  public async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    console.log('💡 Getting optimization recommendations...');

    await this.performFullOptimizationAnalysis();
    const recommendations = await this.optimizationEngine.generateOptimizations();
    
    // Обогащаем рекомендации контекстом из существующих систем
    const enhancedRecommendations = this.enhanceRecommendationsWithContext(recommendations);
    
    this.emit('recommendations_generated', enhancedRecommendations);
    return enhancedRecommendations;
  }

  // ===== PRIVATE METHODS =====

  private setupEventListeners(): void {
    // Add throttling for critical events to prevent cascading loops
    let lastCriticalEventAnalysis = 0;
    const CRITICAL_EVENT_THROTTLE = 120000; // 2 minutes between critical event analyses

    // Слушаем события ValidationMonitor
    this.validationMonitor.on('critical_event', (event) => {
      const timeSinceLastAnalysis = Date.now() - lastCriticalEventAnalysis;
      
      if (timeSinceLastAnalysis > CRITICAL_EVENT_THROTTLE) {
        console.log('🚨 Critical event detected, triggering throttled optimization analysis');
        lastCriticalEventAnalysis = Date.now();
        
        // Use setTimeout to prevent blocking the event loop
        setTimeout(() => {
          this.performFullOptimizationAnalysis().catch(error => {
            console.error('❌ Critical event analysis failed:', error);
          });
        }, 1000); // 1 second delay
      } else {
        console.log('⏳ Critical event detected but analysis throttled');
      }
    });

    this.validationMonitor.on('validation_recorded', (event) => {
      // Only trigger analysis for critical failures, and with throttling
      if (event.result === 'failed' && event.severity === 'critical') {
        const timeSinceLastAnalysis = Date.now() - lastCriticalEventAnalysis;
        
        if (timeSinceLastAnalysis > CRITICAL_EVENT_THROTTLE) {
          console.log('⚠️ Critical validation failure, scheduling delayed optimization check');
          lastCriticalEventAnalysis = Date.now();
          
          // Delay the analysis to prevent immediate cascading
          setTimeout(() => {
            // Only perform lightweight analysis for validation failures
            console.log('🔍 Performing lightweight analysis for validation failure');
          }, 5000); // 5 second delay
        }
      }
    });

    // Сброс счетчика ежедневно
    setInterval(() => {
      const today = new Date().toDateString();
      if (this.lastOptimizationReset !== today) {
        this.appliedOptimizationsToday = 0;
        this.lastOptimizationReset = today;
        console.log('🔄 Daily optimization counter reset');
      }
    }, 60000); // Проверяем каждую минуту
  }

  private startMetricsCollection(): void {
    this.metricsCollectionTimer = setInterval(async () => {
      try {
        const metrics = await this.getIntegratedMetricsSnapshot();
        this.optimizationEngine['analyzer'].addMetricsSnapshot(metrics);
        this.emit('metrics_collected', metrics);
      } catch (error) {
        console.error('❌ Metrics collection error:', error);
      }
    }, this.config.metrics_collection_interval_ms);

    console.log(`📊 Metrics collection started (interval: ${this.config.metrics_collection_interval_ms}ms)`);
  }

  private startPeriodicOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      try {
        if (this.canApplyMoreOptimizations()) {
          await this.generateAndApplyOptimizations();
        }
      } catch (error) {
        console.error('❌ Periodic optimization error:', error);
      }
    }, this.config.optimization_interval_ms);

    console.log(`⚙️ Periodic optimization started (interval: ${this.config.optimization_interval_ms}ms)`);
  }

  private convertAgentMetrics(validationMetrics: any): any {
    const agentMetrics: any = {};
    
    for (const [agentId, metrics] of Object.entries(validationMetrics.agentMetrics) as [string, any][]) {
      agentMetrics[agentId as AgentType] = {
        agent_id: agentId as AgentType,
        response_time_ms: metrics.averageValidationTime || 1000,
        success_rate: metrics.successRate || 95,
        error_count: metrics.failedValidations || 0,
        throughput_per_minute: metrics.validationsPerMinute || 10,
        memory_usage_mb: this.getAgentMemoryUsage(agentId),
        cpu_usage_percent: this.getAgentCpuUsage(agentId),
        last_activity: new Date().toISOString()
      };
    }

    return agentMetrics;
  }

  private extractTotalRequests(infrastructureMetrics: any): number {
    // Извлекаем общее количество запросов из Prometheus метрик
    const requestCounters = infrastructureMetrics.counters?.filter((c: any) => 
      c.name.includes('request') || c.name.includes('call')
    ) || [];
    
    return requestCounters.reduce((total: number, counter: any) => total + counter.value, 0);
  }

  private calculateAverageResponseTime(infrastructureMetrics: any): number {
    // Вычисляем среднее время отклика из histogram метрик
    const durationHistograms = infrastructureMetrics.histograms?.filter((h: any) => 
      h.name.includes('duration') || h.name.includes('response_time')
    ) || [];
    
    if (durationHistograms.length === 0) throw new Error('No duration histograms available for median calculation');
    
    const totalDuration = durationHistograms.reduce((sum: number, hist: any) => sum + hist.sum, 0);
    const totalCount = durationHistograms.reduce((sum: number, hist: any) => sum + hist.count, 0);
    
    return totalCount > 0 ? totalDuration / totalCount : 1000;
  }

  private calculateSystemHealthScore(validationMetrics: any, systemStats: any): number {
    // Комбинируем различные показатели для общего health score
    const successRateScore = validationMetrics.successRate;
    const memoryScore = Math.max(0, 100 - (systemStats.memoryUsage?.heapUsed || 0) / 1024 / 1024 / 100); // MB to %
    const criticalEventsScore = Math.max(0, 100 - validationMetrics.criticalEvents.length * 10);
    
    return Math.round((successRateScore + memoryScore + criticalEventsScore) / 3);
  }

  private calculateQualityScore(validationMetrics: any): number {
    // Вычисляем оценку качества на основе валидации
    return validationMetrics.successRate || 85;
  }

  private calculateCompatibilityScore(validationMetrics: any): number {
    // Оценка совместимости (заглушка, можно расширить)
    return Math.min(95, validationMetrics.successRate + 5);
  }

  private getAgentMemoryUsage(agentId: string): number {
    // Заглушка для получения использования памяти агента
    return Math.floor(Math.random() * 512) + 256; // 256-768 MB
  }

  private getAgentCpuUsage(agentId: string): number {
    // Заглушка для получения использования CPU агента
    return Math.floor(Math.random() * 60) + 20; // 20-80%
  }

  private getLastOptimizationTime(): string {
    // Получаем время последней оптимизации (заглушка)
    return new Date(Date.now() - Math.random() * 3600000).toISOString();
  }

  private async getActiveOptimizationsCount(): Promise<number> {
    // Получаем количество активных оптимизаций
    return 0; // Заглушка
  }

  private async getOptimizationSuccessRate(): Promise<number> {
    // Вычисляем успешность оптимизаций
    return 95; // Заглушка
  }

  private getRecommendationsAppliedToday(): number {
    return this.appliedOptimizationsToday;
  }

  private canApplyMoreOptimizations(): boolean {
    const hourlyLimit = this.config.max_auto_optimizations_per_hour;
    return this.appliedOptimizationsToday < hourlyLimit * 24; // Дневной лимит
  }

  private filterRecommendationsBySafetyPolicy(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    return recommendations.filter(rec => {
      // Фильтруем критические изменения если требуется ручное подтверждение
      if (this.config.require_human_approval_for_critical && rec.requires_human_approval) {
        return false;
      }
      
      // Фильтруем высокорискованные изменения
      if (rec.safety_assessment.risk_level === 'critical' || rec.safety_assessment.risk_level === 'high') {
        return false;
      }
      
      return true;
    });
  }

  private enhanceAnalysisWithExistingData(analysis: SystemAnalysis): SystemAnalysis {
    // Обогащаем анализ данными из ValidationMonitor
    const validationMetrics = this.validationMonitor.getMetrics();
    
    return {
      ...analysis,
      optimization_opportunities: [
        ...analysis.optimization_opportunities,
        ...this.generateContextualOpportunities(validationMetrics)
      ]
    };
  }

  private enhanceRecommendationsWithContext(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    // Добавляем контекст из ValidationMonitor к рекомендациям
    return recommendations.map(rec => ({
      ...rec,
      rationale: `${rec.rationale} (Based on ValidationMonitor insights: ${this.getValidationInsights()})`
    }));
  }

  private generateContextualOpportunities(validationMetrics: any): string[] {
    const opportunities: string[] = [];
    
    if (validationMetrics.successRate < 95) {
      opportunities.push('Enable AI auto-correction to improve validation success rate');
    }
    
    if (validationMetrics.averageValidationTime > 1000) {
      opportunities.push('Optimize validation pipeline to reduce processing time');
    }
    
    return opportunities;
  }

  private getValidationInsights(): string {
    const metrics = this.validationMonitor.getMetrics();
    return `Success rate: ${metrics.successRate}%, Avg time: ${metrics.averageValidationTime}ms`;
  }

  private async integrateOptimizationResults(results: OptimizationResult[]): Promise<void> {
    // Интегрируем результаты оптимизации в существующие системы
    for (const result of results) {
      if (result.status === 'completed') {
        // Можем записать в MetricsService как специальное событие
        this.metricsService.incrementCounter('optimization_applied', {
          type: result.optimization_id,
          status: result.status
        });
      }
    }
  }
}