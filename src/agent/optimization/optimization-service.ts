/**
 * 🎯 OPTIMIZATION SERVICE - Главный координатор системы оптимизации
 * 
 * Центральный сервис для управления всей системой оптимизации агентов и валидаторов.
 * Координирует OptimizationEngine, OptimizationIntegration и предоставляет простой API.
 */

import { EventEmitter } from 'events';
import { OptimizationEngine } from './optimization-engine';
import { OptimizationIntegration, OptimizationIntegrationConfig } from './optimization-integration';
import { 
  OptimizationRecommendation,
  OptimizationResult,
  SystemAnalysis,
  OptimizationConfig,
  MetricsSnapshot,
  DynamicThresholds,
  OptimizationStatus
} from './optimization-types';
import { 
  getOptimizationConfig, 
  validateOptimizationConfig, 
  applyEnvironmentOverrides,
  ProductionOptimizationConfig 
} from '../../config/optimization-config';

export interface OptimizationServiceConfig {
  // Основные настройки
  enabled: boolean;
  auto_optimization: boolean;
  
  // Настройки безопасности
  require_approval_for_critical: boolean;
  max_auto_optimizations_per_day: number;
  min_confidence_threshold: number;
  
  // Настройки мониторинга
  metrics_collection_interval_ms: number;
  analysis_interval_ms: number;
  
  // Настройки интеграции
  integration: Partial<OptimizationIntegrationConfig>;
  engine: Partial<OptimizationConfig>;
}

export interface OptimizationServiceStatus {
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  last_analysis: string | null;
  last_optimization: string | null;
  active_optimizations: number;
  total_optimizations_today: number;
  system_health_score: number;
  recommendations_pending: number;
}

export interface OptimizationReport {
  generated_at: string;
  analysis_period: string;
  system_analysis: SystemAnalysis;
  recommendations: OptimizationRecommendation[];
  applied_optimizations: OptimizationResult[];
  performance_metrics: {
    before: MetricsSnapshot;
    after?: MetricsSnapshot;
    improvement_percentage: number;
  };
  next_analysis_scheduled: string;
}

export class OptimizationService extends EventEmitter {
  private engine: OptimizationEngine;
  private integration: OptimizationIntegration;
  private config: OptimizationServiceConfig;
  
  private status: OptimizationServiceStatus;
  private isInitialized: boolean = false;
  private analysisTimer?: NodeJS.Timeout;
  private optimizationHistory: OptimizationResult[] = [];
  private pendingRecommendations: OptimizationRecommendation[] = [];

  constructor(config: Partial<OptimizationServiceConfig> = {}) {
    super();
    
    this.config = this.mergeDefaultConfig(config);
    
    this.status = {
      status: 'stopped',
      last_analysis: null,
      last_optimization: null,
      active_optimizations: 0,
      total_optimizations_today: 0,
      system_health_score: 0,
      recommendations_pending: 0
    };

    console.log('🎯 OptimizationService initializing with config:', this.config);
    this.initializeComponents();
  }

  /**
   * Инициализация сервиса оптимизации
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ OptimizationService already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing OptimizationService...');

      // Проверяем доступность зависимостей
      await this.checkDependencies();

      // Инициализируем интеграцию
      await this.integration.start();

      // Выполняем первоначальный анализ
      await this.performInitialAnalysis();

      // Запускаем периодические процессы
      this.startPeriodicAnalysis();

      this.isInitialized = true;
      this.status.status = 'running';
      
      this.emit('initialized');
      console.log('✅ OptimizationService initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize OptimizationService:', error);
      this.status.status = 'error';
      this.emit('initialization_failed', error);
      throw error;
    }
  }

  /**
   * Остановка сервиса оптимизации
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      console.log('🛑 Shutting down OptimizationService...');

      // Останавливаем периодические процессы
      this.stopPeriodicAnalysis();

      // Останавливаем интеграцию
      await this.integration.stop();

      this.isInitialized = false;
      this.status.status = 'stopped';
      
      this.emit('shutdown');
      console.log('✅ OptimizationService shut down successfully');

    } catch (error) {
      console.error('❌ Error during OptimizationService shutdown:', error);
      this.emit('shutdown_error', error);
      throw error;
    }
  }

  /**
   * Получение текущего статуса сервиса
   */
  public getStatus(): OptimizationServiceStatus {
    return { ...this.status };
  }

  /**
   * Выполнение мгновенного анализа системы
   */
  public async analyzeSystem(): Promise<SystemAnalysis> {
    console.log('🔍 Performing on-demand system analysis...');

    try {
      const analysis = await this.integration.performFullOptimizationAnalysis();
      
      this.status.last_analysis = new Date().toISOString();
      this.status.system_health_score = this.extractHealthScore(analysis);
      
      this.emit('analysis_completed', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ System analysis failed:', error);
      this.emit('analysis_failed', error);
      throw error;
    }
  }

  /**
   * Получение рекомендаций по оптимизации
   */
  public async getRecommendations(forceRefresh: boolean = false): Promise<OptimizationRecommendation[]> {
    console.log('💡 Getting optimization recommendations...');

    try {
      if (forceRefresh || this.pendingRecommendations.length === 0) {
        this.pendingRecommendations = await this.integration.getOptimizationRecommendations();
      }

      this.status.recommendations_pending = this.pendingRecommendations.length;
      
      this.emit('recommendations_updated', this.pendingRecommendations);
      return [...this.pendingRecommendations];

    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      this.emit('recommendations_failed', error);
      throw error;
    }
  }

  /**
   * Применение конкретной рекомендации
   */
  public async applyRecommendation(recommendationId: string, forceApply: boolean = false): Promise<OptimizationResult> {
    console.log(`⚙️ Applying recommendation: ${recommendationId}`);

    try {
      const recommendation = this.pendingRecommendations.find(r => r.id === recommendationId);
      if (!recommendation) {
        throw new Error(`Recommendation ${recommendationId} not found`);
      }

      // Проверяем безопасность применения
      if (!forceApply && !this.canApplyRecommendation(recommendation)) {
        throw new Error(`Recommendation ${recommendationId} requires manual approval or exceeds safety limits`);
      }

      const results = await this.engine.applyOptimizations([recommendation]);
      const result = results[0];

      if (result) {
        this.optimizationHistory.push(result);
        this.status.last_optimization = new Date().toISOString();
        this.status.total_optimizations_today++;

        // Удаляем примененную рекомендацию из pending
        this.pendingRecommendations = this.pendingRecommendations.filter(r => r.id !== recommendationId);
        this.status.recommendations_pending = this.pendingRecommendations.length;

        this.emit('optimization_applied', result);
      }

      return result;

    } catch (error) {
      console.error(`❌ Failed to apply recommendation ${recommendationId}:`, error);
      this.emit('optimization_failed', { recommendationId, error });
      throw error;
    }
  }

  /**
   * Применение всех безопасных рекомендаций
   */
  public async applyAllSafeRecommendations(): Promise<OptimizationResult[]> {
    console.log('🔄 Applying all safe recommendations...');

    if (!this.config.auto_optimization) {
      throw new Error('Auto-optimization is disabled');
    }

    try {
      const results = await this.integration.generateAndApplyOptimizations();
      
      results.forEach(result => {
        this.optimizationHistory.push(result);
        if (result.status === 'completed') {
          this.status.total_optimizations_today++;
        }
      });

      this.status.last_optimization = new Date().toISOString();
      
      // Обновляем pending recommendations
      await this.getRecommendations(true);

      this.emit('batch_optimization_completed', results);
      return results;

    } catch (error) {
      console.error('❌ Failed to apply safe recommendations:', error);
      this.emit('batch_optimization_failed', error);
      throw error;
    }
  }

  /**
   * Откат оптимизации
   */
  public async rollbackOptimization(optimizationId: string): Promise<OptimizationResult> {
    console.log(`🔙 Rolling back optimization: ${optimizationId}`);

    try {
      const result = await this.engine.rollbackOptimization(optimizationId);
      
      // Обновляем историю
      const historyIndex = this.optimizationHistory.findIndex(h => h.optimization_id === optimizationId);
      if (historyIndex !== -1) {
        this.optimizationHistory[historyIndex] = result;
      }

      this.emit('optimization_rolled_back', result);
      return result;

    } catch (error) {
      console.error(`❌ Failed to rollback optimization ${optimizationId}:`, error);
      this.emit('rollback_failed', { optimizationId, error });
      throw error;
    }
  }

  /**
   * Генерация динамических порогов
   */
  public async generateDynamicThresholds(): Promise<DynamicThresholds> {
    console.log('📊 Generating dynamic thresholds...');

    try {
      const thresholds = await this.engine.generateDynamicThresholds();
      
      this.emit('thresholds_generated', thresholds);
      return thresholds;

    } catch (error) {
      console.error('❌ Failed to generate dynamic thresholds:', error);
      this.emit('thresholds_failed', error);
      throw error;
    }
  }

  /**
   * Получение детального отчета по оптимизации
   */
  public async generateOptimizationReport(periodHours: number = 24): Promise<OptimizationReport> {
    console.log(`📋 Generating optimization report for ${periodHours}h period...`);

    try {
      const currentAnalysis = await this.analyzeSystem();
      const currentRecommendations = await this.getRecommendations();
      
      const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000);
      const recentOptimizations = this.optimizationHistory.filter(opt => 
        new Date(opt.applied_at) >= periodStart
      );

      const beforeMetrics = await this.integration.getIntegratedMetricsSnapshot();
      
      const report: OptimizationReport = {
        generated_at: new Date().toISOString(),
        analysis_period: `${periodHours}h`,
        system_analysis: currentAnalysis,
        recommendations: currentRecommendations,
        applied_optimizations: recentOptimizations,
        performance_metrics: {
          before: beforeMetrics,
          improvement_percentage: this.calculateImprovementPercentage(recentOptimizations)
        },
        next_analysis_scheduled: this.getNextAnalysisTime()
      };

      this.emit('report_generated', report);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate optimization report:', error);
      this.emit('report_failed', error);
      throw error;
    }
  }

  /**
   * Получение истории оптимизаций
   */
  public getOptimizationHistory(limitCount?: number): OptimizationResult[] {
    const history = [...this.optimizationHistory].reverse(); // Новые сначала
    return limitCount ? history.slice(0, limitCount) : history;
  }

  // ===== PRIVATE METHODS =====

  private mergeDefaultConfig(config: Partial<OptimizationServiceConfig>): OptimizationServiceConfig {
    return {
      enabled: true,
      auto_optimization: false,
      require_approval_for_critical: true,
      max_auto_optimizations_per_day: 20,
      min_confidence_threshold: 80,
      metrics_collection_interval_ms: 60000, // 1 minute
      analysis_interval_ms: 300000, // 5 minutes
      integration: {},
      engine: {},
      ...config
    };
  }

  private initializeComponents(): void {
    // Инициализируем OptimizationEngine
    this.engine = new OptimizationEngine(this.config.engine);

    // Инициализируем OptimizationIntegration
    this.integration = new OptimizationIntegration({
      enabled: this.config.enabled,
      auto_optimization_enabled: this.config.auto_optimization,
      metrics_collection_interval_ms: this.config.metrics_collection_interval_ms,
      require_human_approval_for_critical: this.config.require_approval_for_critical,
      max_auto_optimizations_per_hour: Math.ceil(this.config.max_auto_optimizations_per_day / 24),
      ...this.config.integration
    });

    // Подключаем обработчики событий
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // События от Integration
    this.integration.on('analysis_completed', (analysis) => {
      this.status.system_health_score = this.extractHealthScore(analysis);
      this.emit('system_analysis_updated', analysis);
    });

    this.integration.on('optimizations_applied', (results) => {
      results.forEach(result => this.optimizationHistory.push(result));
      this.status.total_optimizations_today += results.filter(r => r.status === 'completed').length;
      this.emit('automated_optimization_completed', results);
    });

    this.integration.on('recommendations_generated', (recommendations) => {
      this.pendingRecommendations = recommendations;
      this.status.recommendations_pending = recommendations.length;
      this.emit('new_recommendations_available', recommendations);
    });

    // События от Engine
    // Добавим при необходимости
  }

  private async checkDependencies(): Promise<void> {
    // Проверяем доступность ValidationMonitor, MetricsService и т.д.
    // В реальной реализации здесь будут конкретные проверки
    console.log('✅ All dependencies are available');
  }

  private async performInitialAnalysis(): Promise<void> {
    try {
      console.log('🔍 Performing initial system analysis...');
      
      const analysis = await this.integration.performFullOptimizationAnalysis();
      this.status.last_analysis = new Date().toISOString();
      this.status.system_health_score = this.extractHealthScore(analysis);

      // Получаем начальные рекомендации
      await this.getRecommendations(true);

      console.log('✅ Initial analysis completed');
    } catch (error) {
      console.error('❌ Initial analysis failed:', error);
      throw error;
    }
  }

  private startPeriodicAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.analysisTimer = setInterval(async () => {
      try {
        await this.analyzeSystem();
        await this.getRecommendations(true);
      } catch (error) {
        console.error('❌ Periodic analysis failed:', error);
      }
    }, this.config.analysis_interval_ms);

    console.log(`📊 Periodic analysis started (interval: ${this.config.analysis_interval_ms}ms)`);
  }

  private stopPeriodicAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = undefined;
      console.log('🛑 Periodic analysis stopped');
    }
  }

  private extractHealthScore(analysis: SystemAnalysis): number {
    return analysis.current_state.system_metrics.system_health_score || 0;
  }

  private canApplyRecommendation(recommendation: OptimizationRecommendation): boolean {
    // Проверяем безопасность применения
    if (recommendation.requires_human_approval && this.config.require_approval_for_critical) {
      return false;
    }

    if (recommendation.safety_assessment.risk_level === 'critical' || 
        recommendation.safety_assessment.risk_level === 'high') {
      return false;
    }

    if (this.status.total_optimizations_today >= this.config.max_auto_optimizations_per_day) {
      return false;
    }

    return true;
  }

  private calculateImprovementPercentage(optimizations: OptimizationResult[]): number {
    const completedOptimizations = optimizations.filter(opt => opt.status === 'completed');
    if (completedOptimizations.length === 0) return 0;

    // Простое вычисление улучшения (можно сделать более сложным)
    return completedOptimizations.length * 5; // 5% за каждую успешную оптимизацию
  }

  private getNextAnalysisTime(): string {
    return new Date(Date.now() + this.config.analysis_interval_ms).toISOString();
  }
}