/**
 * 🎯 DYNAMIC THRESHOLDS ENGINE - Phase 2: Динамические пороги с human oversight
 * 
 * Интеллектуальная система адаптивных порогов, которая автоматически
 * корректирует пороги производительности на основе исторических данных
 * и трендов с обязательным human oversight для критических изменений.
 */

import { EventEmitter } from 'events';
import { 
  MetricsSnapshot, 
  PerformanceTrend, 
  DynamicThresholds,
  AlertThresholds,
  OPTIMIZATION_CONSTANTS,
  OptimizationConfig
} from '../optimization-types';
import { OptimizationAnalyzer } from '../optimization-analyzer';

export interface DynamicThresholdsConfig {
  enabled: boolean;
  
  // Настройки адаптации
  adaptation_sensitivity: number; // 0-100, чувствительность к изменениям
  historical_window_days: number; // Период анализа истории
  confidence_threshold: number; // Минимальная уверенность для изменения
  
  // Safety settings
  max_threshold_change_percent: number; // Максимальное изменение за раз
  require_human_approval_above_percent: number; // Порог для human approval
  emergency_rollback_enabled: boolean;
  
  // Learning settings
  trend_weight: number; // Вес трендов в расчете
  seasonal_adjustment: boolean; // Учет сезонности
  anomaly_detection_enabled: boolean;
}

export interface ThresholdAdjustment {
  threshold_name: string;
  current_value: number;
  recommended_value: number;
  change_percent: number;
  confidence_score: number;
  justification: string;
  risk_assessment: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  supporting_trends: PerformanceTrend[];
  historical_performance: number[];
}

export interface ThresholdChangeRequest {
  id: string;
  created_at: string;
  adjustments: ThresholdAdjustment[];
  total_risk_score: number;
  estimated_impact: {
    performance_change_percent: number;
    alert_frequency_change_percent: number;
    false_positive_reduction_percent: number;
  };
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
  approved_by?: string;
  applied_at?: string;
  rollback_plan: ThresholdRollbackPlan;
}

export interface ThresholdRollbackPlan {
  auto_rollback_conditions: string[];
  manual_rollback_procedure: string[];
  rollback_window_hours: number;
  monitoring_metrics: string[];
}

export interface HumanOversightDecision {
  request_id: string;
  decision: 'approve' | 'reject' | 'modify';
  reviewer: string;
  notes: string;
  modified_adjustments?: ThresholdAdjustment[];
  timestamp: string;
}

export class DynamicThresholdsEngine extends EventEmitter {
  private analyzer: OptimizationAnalyzer;
  private config: DynamicThresholdsConfig;
  private currentThresholds: AlertThresholds;
  private thresholdHistory: ThresholdChangeRequest[] = [];
  private pendingRequests: ThresholdChangeRequest[] = [];
  private isRunning: boolean = false;

  constructor(
    analyzer: OptimizationAnalyzer,
    config: Partial<DynamicThresholdsConfig> = {}
  ) {
    super();
    
    this.analyzer = analyzer;
    this.config = this.mergeDefaultConfig(config);
    this.currentThresholds = { ...OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS };
    
    console.log('🎯 DynamicThresholdsEngine initialized with config:', this.config);
  }

  /**
   * Запуск системы динамических порогов
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ DynamicThresholdsEngine already running');
      return;
    }

    console.log('🚀 Starting DynamicThresholdsEngine...');
    this.isRunning = true;

    // Начальный анализ и корректировка порогов
    await this.performInitialThresholdAnalysis();

    // Запускаем периодический анализ
    this.startPeriodicThresholdAnalysis();

    this.emit('started');
    console.log('✅ DynamicThresholdsEngine started successfully');
  }

  /**
   * Остановка системы
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping DynamicThresholdsEngine...');
    this.isRunning = false;

    this.emit('stopped');
    console.log('✅ DynamicThresholdsEngine stopped');
  }

  /**
   * Анализ и генерация рекомендаций по изменению порогов
   */
  public async analyzeDynamicThresholds(): Promise<ThresholdChangeRequest> {
    console.log('🔍 Analyzing dynamic thresholds...');

    try {
      // Анализируем тренды производительности
      const trends = await this.analyzer.analyzePerformanceTrends(
        this.config.historical_window_days * 24
      );

      // Генерируем корректировки порогов
      const adjustments = await this.generateThresholdAdjustments(trends);

      // Создаем запрос на изменение
      const changeRequest: ThresholdChangeRequest = {
        id: `threshold-change-${Date.now()}`,
        created_at: new Date().toISOString(),
        adjustments,
        total_risk_score: this.calculateTotalRiskScore(adjustments),
        estimated_impact: await this.estimateThresholdImpact(adjustments),
        approval_status: this.requiresHumanApproval(adjustments) ? 'pending' : 'auto_applied',
        rollback_plan: this.generateRollbackPlan(adjustments)
      };

      // Сохраняем запрос
      if (changeRequest.approval_status === 'pending') {
        this.pendingRequests.push(changeRequest);
        this.emit('human_approval_required', changeRequest);
      } else {
        await this.applyThresholdChanges(changeRequest);
      }

      this.emit('threshold_analysis_completed', changeRequest);
      return changeRequest;

    } catch (error) {
      console.error('❌ Failed to analyze dynamic thresholds:', error);
      this.emit('threshold_analysis_failed', error);
      throw error;
    }
  }

  /**
   * Обработка решения human oversight
   */
  public async processHumanDecision(decision: HumanOversightDecision): Promise<void> {
    console.log(`👤 Processing human decision for request ${decision.request_id}: ${decision.decision}`);

    const requestIndex = this.pendingRequests.findIndex(r => r.id === decision.request_id);
    if (requestIndex === -1) {
      throw new Error(`Threshold change request ${decision.request_id} not found`);
    }

    const request = this.pendingRequests[requestIndex];

    switch (decision.decision) {
      case 'approve':
        request.approval_status = 'approved';
        request.approved_by = decision.reviewer;
        await this.applyThresholdChanges(request);
        break;

      case 'reject':
        request.approval_status = 'rejected';
        request.approved_by = decision.reviewer;
        console.log(`❌ Threshold change request ${request.id} rejected by ${decision.reviewer}`);
        break;

      case 'modify':
        if (decision.modified_adjustments) {
          request.adjustments = decision.modified_adjustments;
          request.total_risk_score = this.calculateTotalRiskScore(decision.modified_adjustments);
          request.estimated_impact = await this.estimateThresholdImpact(decision.modified_adjustments);
        }
        request.approval_status = 'approved';
        request.approved_by = decision.reviewer;
        await this.applyThresholdChanges(request);
        break;
    }

    // Перемещаем в историю
    this.thresholdHistory.push(request);
    this.pendingRequests.splice(requestIndex, 1);

    this.emit('human_decision_processed', { decision, request });
  }

  /**
   * Применение изменений порогов
   */
  private async applyThresholdChanges(request: ThresholdChangeRequest): Promise<void> {
    console.log(`⚙️ Applying threshold changes for request ${request.id}`);

    const previousThresholds = { ...this.currentThresholds };

    try {
      // Применяем каждую корректировку
      for (const adjustment of request.adjustments) {
        this.updateThreshold(adjustment.threshold_name, adjustment.recommended_value);
      }

      request.applied_at = new Date().toISOString();
      
      console.log('✅ Threshold changes applied successfully');
      console.log('📊 New thresholds:', this.currentThresholds);

      // Запускаем мониторинг результатов
      this.startThresholdMonitoring(request);

      this.emit('thresholds_applied', {
        request,
        previous_thresholds: previousThresholds,
        new_thresholds: this.currentThresholds
      });

    } catch (error) {
      console.error('❌ Failed to apply threshold changes:', error);
      
      // Восстанавливаем предыдущие пороги
      this.currentThresholds = previousThresholds;
      
      this.emit('threshold_application_failed', { request, error });
      throw error;
    }
  }

  /**
   * Откат изменений порогов
   */
  public async rollbackThresholds(requestId: string): Promise<void> {
    console.log(`🔙 Rolling back thresholds for request ${requestId}`);

    const request = this.thresholdHistory.find(r => r.id === requestId);
    if (!request) {
      throw new Error(`Threshold change request ${requestId} not found in history`);
    }

    // Находим предыдущее состояние
    const previousRequest = this.thresholdHistory
      .filter(r => new Date(r.applied_at || '') < new Date(request.applied_at || ''))
      .sort((a, b) => new Date(b.applied_at || '').getTime() - new Date(a.applied_at || '').getTime())[0];

    const rollbackThresholds = previousRequest 
      ? this.reconstructThresholds(previousRequest)
      : OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS;

    this.currentThresholds = rollbackThresholds;

    console.log('✅ Thresholds rolled back successfully');
    this.emit('thresholds_rolled_back', { request_id: requestId, thresholds: rollbackThresholds });
  }

  /**
   * Получение текущих порогов
   */
  public getCurrentThresholds(): AlertThresholds {
    return { ...this.currentThresholds };
  }

  /**
   * Получение истории изменений
   */
  public getThresholdHistory(): ThresholdChangeRequest[] {
    return [...this.thresholdHistory];
  }

  /**
   * Получение ожидающих запросов
   */
  public getPendingRequests(): ThresholdChangeRequest[] {
    return [...this.pendingRequests];
  }

  // ===== PRIVATE METHODS =====

  private mergeDefaultConfig(config: Partial<DynamicThresholdsConfig>): DynamicThresholdsConfig {
    return {
      enabled: true,
      adaptation_sensitivity: 80,
      historical_window_days: 7,
      confidence_threshold: 85,
      max_threshold_change_percent: 20,
      require_human_approval_above_percent: 15,
      emergency_rollback_enabled: true,
      trend_weight: 0.7,
      seasonal_adjustment: true,
      anomaly_detection_enabled: true,
      ...config
    };
  }

  private async performInitialThresholdAnalysis(): Promise<void> {
    console.log('🔍 Performing initial threshold analysis...');
    
    try {
      await this.analyzeDynamicThresholds();
      console.log('✅ Initial threshold analysis completed');
    } catch (error) {
      console.error('❌ Initial threshold analysis failed:', error);
    }
  }

  private startPeriodicThresholdAnalysis(): void {
    const intervalMs = 6 * 60 * 60 * 1000; // 6 hours

    setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.analyzeDynamicThresholds();
        } catch (error) {
          console.error('❌ Periodic threshold analysis failed:', error);
        }
      }
    }, intervalMs);

    console.log(`📊 Periodic threshold analysis started (interval: ${intervalMs}ms)`);
  }

  private async generateThresholdAdjustments(trends: PerformanceTrend[]): Promise<ThresholdAdjustment[]> {
    const adjustments: ThresholdAdjustment[] = [];

    // Анализируем каждый тип порога
    const thresholdMappings = [
      { name: 'max_response_time_ms', trendPattern: 'response_time', direction: 'lower_better' },
      { name: 'min_success_rate_percent', trendPattern: 'success_rate', direction: 'higher_better' },
      { name: 'max_memory_usage_mb', trendPattern: 'memory', direction: 'lower_better' },
      { name: 'max_cpu_usage_percent', trendPattern: 'cpu', direction: 'lower_better' }
    ];

    for (const mapping of thresholdMappings) {
      const relevantTrends = trends.filter(t => 
        t.metric_name.includes(mapping.trendPattern) && 
        t.confidence_score >= this.config.confidence_threshold
      );

      if (relevantTrends.length > 0) {
        const adjustment = this.calculateThresholdAdjustment(mapping, relevantTrends);
        if (adjustment) {
          adjustments.push(adjustment);
        }
      }
    }

    return adjustments;
  }

  private calculateThresholdAdjustment(
    mapping: any, 
    trends: PerformanceTrend[]
  ): ThresholdAdjustment | null {
    const currentValue = (this.currentThresholds as any)[mapping.name];
    if (!currentValue) return null;

    // Вычисляем рекомендуемое значение на основе трендов
    const avgTrendChange = trends.reduce((sum, t) => sum + t.change_percent, 0) / trends.length;
    const avgConfidence = trends.reduce((sum, t) => sum + t.confidence_score, 0) / trends.length;

    // Корректируем значение с учетом направления
    let recommendedValue: number;
    if (mapping.direction === 'lower_better') {
      // Для метрик где меньше = лучше (response time, CPU, memory)
      if (avgTrendChange < 0) { // Улучшение -> можем снизить порог
        recommendedValue = currentValue * (1 + avgTrendChange / 100 * this.config.trend_weight);
      } else { // Ухудшение -> повышаем порог
        recommendedValue = currentValue * (1 + avgTrendChange / 100 * 0.5);
      }
    } else {
      // Для метрик где больше = лучше (success rate)
      if (avgTrendChange > 0) { // Улучшение -> можем повысить порог
        recommendedValue = currentValue * (1 + avgTrendChange / 100 * this.config.trend_weight);
      } else { // Ухудшение -> снижаем порог
        recommendedValue = currentValue * (1 + avgTrendChange / 100 * 0.5);
      }
    }

    const changePercent = Math.abs((recommendedValue - currentValue) / currentValue * 100);

    // Ограничиваем максимальное изменение
    if (changePercent > this.config.max_threshold_change_percent) {
      const direction = recommendedValue > currentValue ? 1 : -1;
      recommendedValue = currentValue * (1 + direction * this.config.max_threshold_change_percent / 100);
    }

    return {
      threshold_name: mapping.name,
      current_value: currentValue,
      recommended_value: Math.round(recommendedValue),
      change_percent: changePercent,
      confidence_score: avgConfidence,
      justification: this.generateJustification(mapping, trends, avgTrendChange),
      risk_assessment: this.assessRisk(changePercent),
      requires_approval: changePercent > this.config.require_human_approval_above_percent,
      supporting_trends: trends,
      historical_performance: [] // TODO: Добавить исторические данные
    };
  }

  private generateJustification(mapping: any, trends: PerformanceTrend[], avgChange: number): string {
    const direction = avgChange > 0 ? 'improvement' : 'degradation';
    const changeDesc = Math.abs(avgChange).toFixed(1);
    
    return `Based on ${trends.length} trends showing ${changeDesc}% ${direction} in ${mapping.trendPattern} metrics over the analysis period`;
  }

  private assessRisk(changePercent: number): 'low' | 'medium' | 'high' | 'critical' {
    if (changePercent <= 5) return 'low';
    if (changePercent <= 15) return 'medium';
    if (changePercent <= 25) return 'high';
    return 'critical';
  }

  private calculateTotalRiskScore(adjustments: ThresholdAdjustment[]): number {
    const riskWeights = { low: 1, medium: 3, high: 7, critical: 10 };
    const totalRisk = adjustments.reduce((sum, adj) => sum + riskWeights[adj.risk_assessment], 0);
    return Math.min(100, totalRisk);
  }

  private requiresHumanApproval(adjustments: ThresholdAdjustment[]): boolean {
    return adjustments.some(adj => adj.requires_approval);
  }

  private async estimateThresholdImpact(adjustments: ThresholdAdjustment[]): Promise<any> {
    // Упрощенная оценка влияния
    const avgChangePercent = adjustments.reduce((sum, adj) => sum + adj.change_percent, 0) / adjustments.length;
    
    return {
      performance_change_percent: avgChangePercent * 0.3, // 30% от изменения порога
      alert_frequency_change_percent: avgChangePercent * -0.5, // Снижение ложных срабатываний
      false_positive_reduction_percent: avgChangePercent * 0.8
    };
  }

  private generateRollbackPlan(adjustments: ThresholdAdjustment[]): ThresholdRollbackPlan {
    return {
      auto_rollback_conditions: [
        'Alert frequency increases by >50%',
        'System performance degrades by >10%',
        'Critical errors increase by >25%'
      ],
      manual_rollback_procedure: [
        'Review system metrics for degradation',
        'Confirm rollback decision with team lead',
        'Execute rollback via DynamicThresholdsEngine.rollbackThresholds()',
        'Monitor system for 1 hour post-rollback'
      ],
      rollback_window_hours: 24,
      monitoring_metrics: adjustments.map(adj => adj.threshold_name)
    };
  }

  private updateThreshold(thresholdName: string, newValue: number): void {
    (this.currentThresholds as any)[thresholdName] = newValue;
  }

  private startThresholdMonitoring(request: ThresholdChangeRequest): void {
    // TODO: Implement monitoring logic
    console.log(`📊 Started monitoring threshold changes for request ${request.id}`);
  }

  private reconstructThresholds(request: ThresholdChangeRequest): AlertThresholds {
    // TODO: Implement threshold reconstruction from historical request
    return { ...OPTIMIZATION_CONSTANTS.DEFAULT_ALERT_THRESHOLDS };
  }
}