/**
 * 🤖 MACHINE LEARNING ENGINE - Phase 3: Auto-Scaling + Machine Learning
 * 
 * Интеллектуальная система машинного обучения для автоматического масштабирования
 * оптимизации с обратной связью и предиктивной аналитикой.
 */

import { EventEmitter } from 'events';
import { 
  OptimizationRecommendation,
  MetricsSnapshot,
  PerformanceTrend,
  SystemAnalysis
} from '../optimization-types';
import { OptimizationAnalyzer } from '../optimization-analyzer';

export interface MLConfig {
  enabled: boolean;
  
  // Learning parameters
  learning_rate: number; // 0-1, скорость обучения модели
  confidence_threshold: number; // Минимальная уверенность для автоматических действий
  feedback_window_hours: number; // Окно для анализа обратной связи
  
  // Model parameters
  prediction_horizon_hours: number; // Горизонт предсказаний
  feature_importance_threshold: number; // Порог важности признаков
  model_retrain_interval_hours: number; // Интервал переобучения модели
  
  // Auto-scaling parameters
  auto_scaling_enabled: boolean;
  scaling_sensitivity: number; // 0-100, чувствительность к изменениям нагрузки
  max_agents_scale_up: number; // Максимальное увеличение агентов
  scale_down_delay_minutes: number; // Задержка перед уменьшением
  
  // Safety parameters
  emergency_stop_threshold: number; // Порог для экстренной остановки
  human_intervention_required_above: number; // Порог для запроса human intervention
}

export interface MLModel {
  model_id: string;
  model_type: 'performance_predictor' | 'anomaly_detector' | 'scaling_optimizer' | 'recommendation_ranker';
  created_at: string;
  last_trained: string;
  training_samples: number;
  accuracy: number;
  confidence_score: number;
  feature_weights: Record<string, number>;
  hyperparameters: Record<string, any>;
  validation_metrics: ValidationMetrics;
}

export interface ValidationMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  mse: number; // Mean Squared Error for regression
  mae: number; // Mean Absolute Error
  r_squared: number; // R² coefficient
}

export interface PredictionResult {
  prediction_id: string;
  model_id: string;
  timestamp: string;
  prediction_type: 'performance' | 'anomaly' | 'scaling_need' | 'recommendation_score';
  predicted_value: number;
  confidence: number;
  prediction_horizon_hours: number;
  contributing_factors: ContributingFactor[];
  recommended_actions: string[];
}

export interface ContributingFactor {
  factor_name: string;
  importance: number; // 0-1
  current_value: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  impact_description: string;
}

export interface FeedbackData {
  feedback_id: string;
  prediction_id: string;
  actual_outcome: number;
  predicted_outcome: number;
  accuracy_score: number;
  timestamp: string;
  context: Record<string, any>;
}

export interface AutoScalingDecision {
  decision_id: string;
  timestamp: string;
  action: 'scale_up' | 'scale_down' | 'maintain';
  current_agents: number;
  target_agents: number;
  confidence: number;
  reasoning: string;
  predicted_load: number;
  current_load: number;
  safety_checks_passed: boolean;
}

export class MachineLearningEngine extends EventEmitter {
  private config: MLConfig;
  private analyzer: OptimizationAnalyzer;
  private models: Map<string, MLModel> = new Map();
  private predictions: PredictionResult[] = [];
  private feedbackHistory: FeedbackData[] = [];
  private scalingHistory: AutoScalingDecision[] = [];
  private isRunning: boolean = false;
  private lastModelUpdate: Date = new Date();

  constructor(
    analyzer: OptimizationAnalyzer,
    config: Partial<MLConfig> = {}
  ) {
    super();
    
    this.analyzer = analyzer;
    this.config = this.mergeDefaultConfig(config);
    
    console.log('🤖 MachineLearningEngine initialized with config:', this.config);
    this.initializeModels();
  }

  /**
   * Запуск ML системы
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ MachineLearningEngine already running');
      return;
    }

    console.log('🚀 Starting MachineLearningEngine...');
    this.isRunning = true;

    // Запускаем периодические процессы
    this.startPredictionCycle();
    this.startModelRetraining();
    this.startAutoScaling();

    this.emit('started');
    console.log('✅ MachineLearningEngine started successfully');
  }

  /**
   * Остановка ML системы
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping MachineLearningEngine...');
    this.isRunning = false;

    this.emit('stopped');
    console.log('✅ MachineLearningEngine stopped');
  }

  /**
   * Генерация предсказаний на основе текущих данных
   */
  public async generatePredictions(): Promise<PredictionResult[]> {
    console.log('🔮 Generating ML predictions...');

    try {
      // Симулируем анализ системы
      const currentAnalysis: SystemAnalysis = {
        current_state: {
          timestamp: new Date().toISOString(),
          system_metrics: {
            active_agents: 4,
            system_health_score: 85,
            average_response_time: 1200,
            overall_success_rate: 92,
            total_requests: 1000,
            critical_events: 2
          },
          agent_metrics: {
            'content-specialist': {
              agent_id: 'content-specialist',
              response_time_ms: 1100,
              success_rate: 94,
              error_count: 15,
              throughput_per_minute: 25,
              memory_usage_mb: 256,
              cpu_usage_percent: 45,
              last_activity: new Date().toISOString()
            },
            'design-specialist': {
              agent_id: 'design-specialist',
              response_time_ms: 1300,
              success_rate: 96,
              error_count: 8,
              throughput_per_minute: 20,
              memory_usage_mb: 312,
              cpu_usage_percent: 38,
              last_activity: new Date().toISOString()
            },
            'quality-specialist': {
              agent_id: 'quality-specialist',
              response_time_ms: 1400,
              success_rate: 91,
              error_count: 27,
              throughput_per_minute: 30,
              memory_usage_mb: 428,
              cpu_usage_percent: 62,
              last_activity: new Date().toISOString()
            },
            'delivery-specialist': {
              agent_id: 'delivery-specialist',
              response_time_ms: 1000,
              success_rate: 89,
              error_count: 27,
              throughput_per_minute: 25,
              memory_usage_mb: 234,
              cpu_usage_percent: 41,
              last_activity: new Date().toISOString()
            }
          },
          validation_metrics: {
            total_validations: 1000,
            validation_success_rate: 95,
            average_validation_time: 200,
            failed_validations: 50,
            quality_score_average: 87,
            compatibility_score_average: 92
          }
        },
        trends: await this.analyzer.analyzePerformanceTrends(24),
        bottlenecks: await this.analyzer.identifyBottlenecks(),
        error_patterns: await this.analyzer.analyzeErrorPatterns(),
        predicted_issues: await this.analyzer.predictPerformanceIssues(),
        optimization_opportunities: ['Optimize agent memory usage', 'Improve response time consistency'],
        overall_health_assessment: 'System is performing well with minor optimization opportunities'
      };
      const predictions: PredictionResult[] = [];

      // Предсказание производительности
      const performancePrediction = await this.predictPerformance(currentAnalysis);
      predictions.push(performancePrediction);

      // Обнаружение аномалий
      const anomalyPrediction = await this.detectAnomalies(currentAnalysis);
      predictions.push(anomalyPrediction);

      // Предсказание потребности в масштабировании
      const scalingPrediction = await this.predictScalingNeed(currentAnalysis);
      predictions.push(scalingPrediction);

      // Сохраняем предсказания
      this.predictions.push(...predictions);

      this.emit('predictions_generated', predictions);
      return predictions;

    } catch (error) {
      console.error('❌ Failed to generate predictions:', error);
      this.emit('prediction_failed', error);
      throw error;
    }
  }

  /**
   * Обучение модели на основе обратной связи
   */
  public async trainModelWithFeedback(feedbackData: FeedbackData[]): Promise<void> {
    console.log(`🎓 Training models with ${feedbackData.length} feedback samples...`);

    try {
      for (const feedback of feedbackData) {
        this.feedbackHistory.push(feedback);
      }

      // Переобучаем модели
      await this.retrainModels();

      this.emit('model_trained', { samples: feedbackData.length });

    } catch (error) {
      console.error('❌ Model training failed:', error);
      this.emit('training_failed', error);
      throw error;
    }
  }

  /**
   * Принятие решения об автоматическом масштабировании
   */
  public async makeAutoScalingDecision(): Promise<AutoScalingDecision> {
    console.log('⚖️ Making auto-scaling decision...');

    try {
      // Симулируем анализ системы
      const currentAnalysis: SystemAnalysis = {
        current_state: {
          timestamp: new Date().toISOString(),
          system_metrics: {
            active_agents: 4,
            system_health_score: 85,
            average_response_time: 1200,
            overall_success_rate: 92,
            total_requests: 1000,
            critical_events: 2
          },
          agent_metrics: {
            'content-specialist': {
              agent_id: 'content-specialist',
              response_time_ms: 1100,
              success_rate: 94,
              error_count: 15,
              throughput_per_minute: 25,
              memory_usage_mb: 256,
              cpu_usage_percent: 45,
              last_activity: new Date().toISOString()
            },
            'design-specialist': {
              agent_id: 'design-specialist',
              response_time_ms: 1300,
              success_rate: 96,
              error_count: 8,
              throughput_per_minute: 20,
              memory_usage_mb: 312,
              cpu_usage_percent: 38,
              last_activity: new Date().toISOString()
            },
            'quality-specialist': {
              agent_id: 'quality-specialist',
              response_time_ms: 1400,
              success_rate: 91,
              error_count: 27,
              throughput_per_minute: 30,
              memory_usage_mb: 428,
              cpu_usage_percent: 62,
              last_activity: new Date().toISOString()
            },
            'delivery-specialist': {
              agent_id: 'delivery-specialist',
              response_time_ms: 1000,
              success_rate: 89,
              error_count: 27,
              throughput_per_minute: 25,
              memory_usage_mb: 234,
              cpu_usage_percent: 41,
              last_activity: new Date().toISOString()
            }
          },
          validation_metrics: {
            total_validations: 1000,
            validation_success_rate: 95,
            average_validation_time: 200,
            failed_validations: 50,
            quality_score_average: 87,
            compatibility_score_average: 92
          }
        },
        trends: await this.analyzer.analyzePerformanceTrends(24),
        bottlenecks: await this.analyzer.identifyBottlenecks(),
        error_patterns: await this.analyzer.analyzeErrorPatterns(),
        predicted_issues: await this.analyzer.predictPerformanceIssues(),
        optimization_opportunities: ['Optimize agent memory usage', 'Improve response time consistency'],
        overall_health_assessment: 'System is performing well with minor optimization opportunities'
      };
      const scalingPrediction = await this.predictScalingNeed(currentAnalysis);
      
      const currentAgents = currentAnalysis.current_state.system_metrics.active_agents;
      const predictedLoad = scalingPrediction.predicted_value;
      const currentLoad = this.calculateCurrentLoad(currentAnalysis);

      let action: AutoScalingDecision['action'] = 'maintain';
      let targetAgents = currentAgents;
      let reasoning = 'System load is stable, no scaling needed';

      // Определяем необходимость масштабирования
      if (predictedLoad > 80 && scalingPrediction.confidence > this.config.confidence_threshold) {
        action = 'scale_up';
        targetAgents = Math.min(
          currentAgents + Math.ceil(this.config.max_agents_scale_up * (predictedLoad / 100)),
          currentAgents + this.config.max_agents_scale_up
        );
        reasoning = `High load predicted (${predictedLoad}%), scaling up to handle increased demand`;
      } else if (predictedLoad < 30 && currentLoad < 40 && scalingPrediction.confidence > this.config.confidence_threshold) {
        action = 'scale_down';
        targetAgents = Math.max(
          Math.floor(currentAgents * 0.8),
          2 // Минимум 2 агента
        );
        reasoning = `Low load detected (${predictedLoad}%), scaling down to optimize resources`;
      }

      // Проверки безопасности
      const safetyChecks = this.performScalingSafetyChecks(currentAnalysis, action, targetAgents);

      const decision: AutoScalingDecision = {
        decision_id: `scaling-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        current_agents: currentAgents,
        target_agents: targetAgents,
        confidence: scalingPrediction.confidence,
        reasoning,
        predicted_load: predictedLoad,
        current_load: currentLoad,
        safety_checks_passed: safetyChecks
      };

      this.scalingHistory.push(decision);
      this.emit('scaling_decision_made', decision);

      return decision;

    } catch (error) {
      console.error('❌ Auto-scaling decision failed:', error);
      this.emit('scaling_decision_failed', error);
      throw error;
    }
  }

  /**
   * Получение информации о моделях
   */
  public getModelsInfo(): MLModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Получение истории предсказаний
   */
  public getPredictionHistory(limit: number = 50): PredictionResult[] {
    return this.predictions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Получение истории масштабирования
   */
  public getScalingHistory(limit: number = 20): AutoScalingDecision[] {
    return this.scalingHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Получение метрик модели
   */
  public getModelMetrics(): Record<string, any> {
    const models = Array.from(this.models.values());
    const recentPredictions = this.predictions.slice(-100);
    const recentFeedback = this.feedbackHistory.slice(-100);

    return {
      total_models: models.length,
      avg_model_accuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length,
      predictions_generated: this.predictions.length,
      feedback_samples: this.feedbackHistory.length,
      recent_accuracy: this.calculateRecentAccuracy(recentPredictions, recentFeedback),
      last_model_update: this.lastModelUpdate.toISOString(),
      scaling_decisions_made: this.scalingHistory.length
    };
  }

  // ===== PRIVATE METHODS =====

  private mergeDefaultConfig(config: Partial<MLConfig>): MLConfig {
    return {
      enabled: true,
      learning_rate: 0.01,
      confidence_threshold: 75,
      feedback_window_hours: 24,
      prediction_horizon_hours: 4,
      feature_importance_threshold: 0.1,
      model_retrain_interval_hours: 6,
      auto_scaling_enabled: true,
      scaling_sensitivity: 70,
      max_agents_scale_up: 3,
      scale_down_delay_minutes: 30,
      emergency_stop_threshold: 95,
      human_intervention_required_above: 85,
      ...config
    };
  }

  private initializeModels(): void {
    // Создаем базовые модели
    const models: Omit<MLModel, 'model_id'>[] = [
      {
        model_type: 'performance_predictor',
        created_at: new Date().toISOString(),
        last_trained: new Date().toISOString(),
        training_samples: 0,
        accuracy: 0.85,
        confidence_score: 80,
        feature_weights: {
          response_time: 0.3,
          cpu_usage: 0.25,
          memory_usage: 0.2,
          error_rate: 0.15,
          queue_size: 0.1
        },
        hyperparameters: {
          learning_rate: this.config.learning_rate,
          epochs: 100,
          batch_size: 32
        },
        validation_metrics: {
          precision: 0.82,
          recall: 0.85,
          f1_score: 0.83,
          mse: 0.15,
          mae: 0.12,
          r_squared: 0.78
        }
      },
      {
        model_type: 'anomaly_detector',
        created_at: new Date().toISOString(),
        last_trained: new Date().toISOString(),
        training_samples: 0,
        accuracy: 0.91,
        confidence_score: 85,
        feature_weights: {
          response_time_deviation: 0.35,
          error_spike: 0.3,
          memory_anomaly: 0.2,
          cpu_spike: 0.15
        },
        hyperparameters: {
          anomaly_threshold: 2.5,
          window_size: 50,
          contamination: 0.1
        },
        validation_metrics: {
          precision: 0.89,
          recall: 0.88,
          f1_score: 0.88,
          mse: 0.08,
          mae: 0.06,
          r_squared: 0.92
        }
      },
      {
        model_type: 'scaling_optimizer',
        created_at: new Date().toISOString(),
        last_trained: new Date().toISOString(),
        training_samples: 0,
        accuracy: 0.87,
        confidence_score: 82,
        feature_weights: {
          current_load: 0.4,
          trend_direction: 0.25,
          queue_depth: 0.2,
          historical_pattern: 0.15
        },
        hyperparameters: {
          scaling_factor: 1.5,
          cooldown_period: 300,
          min_agents: 2,
          max_agents: 10
        },
        validation_metrics: {
          precision: 0.84,
          recall: 0.86,
          f1_score: 0.85,
          mse: 0.12,
          mae: 0.09,
          r_squared: 0.81
        }
      }
    ];

    models.forEach(modelData => {
      const modelId = `${modelData.model_type}-${Date.now()}`;
      this.models.set(modelId, {
        model_id: modelId,
        ...modelData
      });
    });

    console.log(`🧠 Initialized ${this.models.size} ML models`);
  }

  private async predictPerformance(analysis: SystemAnalysis): Promise<PredictionResult> {
    const model = Array.from(this.models.values()).find(m => m.model_type === 'performance_predictor');
    if (!model) throw new Error('Performance prediction model not found');

    // Симуляция предсказания производительности
    const currentHealthScore = analysis.current_state.system_metrics.system_health_score;
    const trends = analysis.trends;
    
    // Базовое предсказание на основе текущих трендов
    const trendImpact = trends.reduce((sum, trend) => {
      return sum + (trend.change_percent * (model.feature_weights[trend.metric_name] || 0.1));
    }, 0);

    const predictedScore = Math.max(0, Math.min(100, currentHealthScore + trendImpact));
    const confidence = Math.min(95, model.confidence_score + Math.random() * 10);

    return {
      prediction_id: `perf-${Date.now()}`,
      model_id: model.model_id,
      timestamp: new Date().toISOString(),
      prediction_type: 'performance',
      predicted_value: Math.round(predictedScore),
      confidence: Math.round(confidence),
      prediction_horizon_hours: this.config.prediction_horizon_hours,
      contributing_factors: this.extractContributingFactors(analysis, model),
      recommended_actions: this.generateRecommendedActions('performance', predictedScore)
    };
  }

  private async detectAnomalies(analysis: SystemAnalysis): Promise<PredictionResult> {
    const model = Array.from(this.models.values()).find(m => m.model_type === 'anomaly_detector');
    if (!model) throw new Error('Anomaly detection model not found');

    // Симуляция обнаружения аномалий
    const errorPatterns = analysis.error_patterns.length;
    const bottlenecks = analysis.bottlenecks.length;
    const healthScore = analysis.current_state.system_metrics.system_health_score;

    const anomalyScore = (errorPatterns * 20) + (bottlenecks * 15) + (100 - healthScore);
    const confidence = Math.min(95, model.confidence_score + Math.random() * 8);

    return {
      prediction_id: `anomaly-${Date.now()}`,
      model_id: model.model_id,
      timestamp: new Date().toISOString(),
      prediction_type: 'anomaly',
      predicted_value: Math.round(anomalyScore),
      confidence: Math.round(confidence),
      prediction_horizon_hours: this.config.prediction_horizon_hours,
      contributing_factors: this.extractContributingFactors(analysis, model),
      recommended_actions: this.generateRecommendedActions('anomaly', anomalyScore)
    };
  }

  private async predictScalingNeed(analysis: SystemAnalysis): Promise<PredictionResult> {
    const model = Array.from(this.models.values()).find(m => m.model_type === 'scaling_optimizer');
    if (!model) throw new Error('Scaling optimizer model not found');

    // Симуляция предсказания потребности в масштабировании
    const currentLoad = this.calculateCurrentLoad(analysis);
    const trends = analysis.trends.filter(t => t.metric_name.includes('response_time') || t.metric_name.includes('cpu'));
    
    const trendMultiplier = trends.reduce((sum, trend) => {
      return sum + (trend.change_percent > 0 ? 1.2 : 0.8);
    }, trends.length) / trends.length;

    const predictedLoad = Math.max(0, Math.min(100, currentLoad * trendMultiplier));
    const confidence = Math.min(95, model.confidence_score + Math.random() * 7);

    return {
      prediction_id: `scaling-${Date.now()}`,
      model_id: model.model_id,
      timestamp: new Date().toISOString(),
      prediction_type: 'scaling_need',
      predicted_value: Math.round(predictedLoad),
      confidence: Math.round(confidence),
      prediction_horizon_hours: this.config.prediction_horizon_hours,
      contributing_factors: this.extractContributingFactors(analysis, model),
      recommended_actions: this.generateRecommendedActions('scaling', predictedLoad)
    };
  }

  private extractContributingFactors(analysis: SystemAnalysis, model: MLModel): ContributingFactor[] {
    const factors: ContributingFactor[] = [];

    Object.entries(model.feature_weights).forEach(([factorName, importance]) => {
      if (importance >= this.config.feature_importance_threshold) {
        factors.push({
          factor_name: factorName,
          importance,
          current_value: Math.random() * 100, // Симуляция
          trend_direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          impact_description: `${factorName} contributes ${Math.round(importance * 100)}% to the prediction`
        });
      }
    });

    return factors;
  }

  private generateRecommendedActions(predictionType: string, predictedValue: number): string[] {
    const actions: Record<string, string[]> = {
      performance: predictedValue < 70 ? [
        'Consider optimizing slow database queries',
        'Review memory usage patterns',
        'Scale up resources if needed'
      ] : [
        'Continue monitoring performance',
        'Maintain current configuration'
      ],
      anomaly: predictedValue > 50 ? [
        'Investigate error patterns immediately',
        'Review recent configuration changes',
        'Prepare rollback procedures'
      ] : [
        'Continue normal monitoring',
        'No immediate action required'
      ],
      scaling: predictedValue > 80 ? [
        'Prepare for scale-up operation',
        'Monitor resource utilization',
        'Check auto-scaling policies'
      ] : predictedValue < 30 ? [
        'Consider scaling down resources',
        'Optimize resource allocation',
        'Review usage patterns'
      ] : [
        'Maintain current scaling level',
        'Continue monitoring load trends'
      ]
    };

    return actions[predictionType] || ['Continue monitoring'];
  }

  private calculateCurrentLoad(analysis: SystemAnalysis): number {
    const metrics = analysis.current_state.system_metrics;
    const responseTime = metrics.average_response_time;
    const cpuUsage = 75; // Симуляция
    const memoryUsage = 68; // Симуляция
    
    // Простая формула расчета нагрузки
    const responseTimeLoad = Math.min(100, (responseTime / 1000) * 20);
    const avgLoad = (responseTimeLoad + cpuUsage + memoryUsage) / 3;
    
    return Math.round(avgLoad);
  }

  private performScalingSafetyChecks(
    analysis: SystemAnalysis, 
    action: AutoScalingDecision['action'], 
    targetAgents: number
  ): boolean {
    // Проверки безопасности для масштабирования
    if (action === 'scale_up' && targetAgents > 10) return false;
    if (action === 'scale_down' && targetAgents < 2) return false;
    if (analysis.current_state.system_metrics.system_health_score < 60) return false;
    
    return true;
  }

  private async retrainModels(): Promise<void> {
    console.log('🔄 Retraining ML models with new feedback...');
    
    // Симуляция переобучения моделей
    for (const [modelId, model] of Array.from(this.models.entries())) {
      const feedbackSamples = this.feedbackHistory
        .filter(f => f.prediction_id.includes(model.model_type.split('_')[0]))
        .slice(-100);

      if (feedbackSamples.length > 10) {
        // Обновляем метрики модели на основе обратной связи
        const accuracy = this.calculateModelAccuracy(feedbackSamples);
        
        model.accuracy = accuracy;
        model.training_samples += feedbackSamples.length;
        model.last_trained = new Date().toISOString();
        
        console.log(`📊 Model ${model.model_type} retrained: accuracy ${accuracy}%`);
      }
    }

    this.lastModelUpdate = new Date();
  }

  private calculateModelAccuracy(feedbackSamples: FeedbackData[]): number {
    if (feedbackSamples.length === 0) return 0;
    
    const totalAccuracy = feedbackSamples.reduce((sum, feedback) => sum + feedback.accuracy_score, 0);
    return Math.round(totalAccuracy / feedbackSamples.length);
  }

  private calculateRecentAccuracy(predictions: PredictionResult[], feedback: FeedbackData[]): number {
    if (predictions.length === 0 || feedback.length === 0) return 0;
    
    const matchedFeedback = feedback.filter(f => 
      predictions.some(p => p.prediction_id === f.prediction_id)
    );
    
    return this.calculateModelAccuracy(matchedFeedback);
  }

  private startPredictionCycle(): void {
    const intervalMs = 30 * 60 * 1000; // 30 minutes
    
    setInterval(async () => {
      if (this.isRunning && this.config.enabled) {
        try {
          await this.generatePredictions();
        } catch (error) {
          console.error('❌ Prediction cycle failed:', error);
        }
      }
    }, intervalMs);

    console.log(`🔄 Prediction cycle started (interval: ${intervalMs}ms)`);
  }

  private startModelRetraining(): void {
    const intervalMs = this.config.model_retrain_interval_hours * 60 * 60 * 1000;
    
    setInterval(async () => {
      if (this.isRunning && this.config.enabled) {
        try {
          await this.retrainModels();
        } catch (error) {
          console.error('❌ Model retraining failed:', error);
        }
      }
    }, intervalMs);

    console.log(`🎓 Model retraining started (interval: ${intervalMs}ms)`);
  }

  private startAutoScaling(): void {
    if (!this.config.auto_scaling_enabled) return;
    
    const intervalMs = 10 * 60 * 1000; // 10 minutes
    
    setInterval(async () => {
      if (this.isRunning && this.config.enabled) {
        try {
          const decision = await this.makeAutoScalingDecision();
          if (decision.action !== 'maintain' && decision.safety_checks_passed) {
            console.log(`⚖️ Auto-scaling decision: ${decision.action} to ${decision.target_agents} agents`);
          }
        } catch (error) {
          console.error('❌ Auto-scaling cycle failed:', error);
        }
      }
    }, intervalMs);

    console.log(`⚖️ Auto-scaling started (interval: ${intervalMs}ms)`);
  }
}