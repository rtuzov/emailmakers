/**
 * 🎯 OPTIMIZATION TYPES - Базовые типы и интерфейсы для системы автоматической оптимизации
 * 
 * Определяет все необходимые типы для AI-powered optimization engine,
 * включая анализ паттернов, рекомендации и safety mechanisms.
 */

import { z } from 'zod';

// ===== БАЗОВЫЕ ТИПЫ =====

export type OptimizationType = 'threshold_adjustment' | 'performance_tuning' | 'resource_optimization' | 'load_balancing';
export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low';
export type OptimizationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type AgentType = 'content-specialist' | 'design-specialist' | 'quality-specialist' | 'delivery-specialist';
export type TrendDirection = 'up' | 'down' | 'stable';

// ===== МЕТРИКИ И ДАННЫЕ =====

export interface MetricsSnapshot {
  timestamp: string;
  agent_metrics: Record<AgentType, AgentMetrics>;
  system_metrics: SystemMetrics;
  validation_metrics: ValidationMetrics;
}

export interface AgentMetrics {
  agent_id: AgentType;
  response_time_ms: number;
  success_rate: number;
  error_count: number;
  throughput_per_minute: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  last_activity: string;
}

export interface SystemMetrics {
  total_requests: number;
  active_agents: number;
  average_response_time: number;
  overall_success_rate: number;
  critical_events: number;
  system_health_score: number;
}

export interface ValidationMetrics {
  total_validations: number;
  validation_success_rate: number;
  average_validation_time: number;
  failed_validations: number;
  quality_score_average: number;
  compatibility_score_average: number;
}

// ===== АНАЛИЗ ПАТТЕРНОВ =====

export interface PerformanceTrend {
  metric_name: string;
  agent_id?: AgentType;
  trend_direction: TrendDirection;
  change_percent: number;
  confidence_score: number;
  time_window: string;
  data_points: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  anomaly_detected: boolean;
}

export interface Bottleneck {
  id: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'validation';
  affected_agent: AgentType | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact_assessment: string;
  resolution_urgency: OptimizationPriority;
  estimated_improvement: number;
}

export interface ErrorPattern {
  pattern_id: string;
  error_type: string;
  frequency: number;
  affected_agents: AgentType[];
  common_conditions: string[];
  potential_causes: string[];
  suggested_fixes: string[];
  business_impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface PredictedIssue {
  issue_id: string;
  predicted_at: string;
  likely_occurrence: string;
  confidence_percent: number;
  issue_type: 'performance_degradation' | 'system_overload' | 'validation_failure';
  affected_components: string[];
  preventive_actions: string[];
  monitoring_requirements: string[];
}

// ===== РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ =====

export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  priority: OptimizationPriority;
  title: string;
  description: string;
  rationale: string;
  expected_impact: ExpectedImpact;
  implementation: OptimizationAction[];
  rollback_plan: OptimizationAction[];
  safety_assessment: SafetyAssessment;
  estimated_duration: string;
  requires_human_approval: boolean;
  created_at: string;
}

export interface ExpectedImpact {
  performance_improvement_percent: number;
  success_rate_improvement_percent: number;
  response_time_reduction_ms: number;
  resource_efficiency_gain_percent: number;
  confidence_level: number;
  business_value: string;
}

export interface OptimizationAction {
  action_type: 'config_change' | 'threshold_adjustment' | 'resource_allocation' | 'algorithm_tuning';
  target_component: string;
  current_value: any;
  new_value: any;
  validation_required: boolean;
  rollback_possible: boolean;
  execution_order: number;
}

export interface SafetyAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  potential_negative_impacts: string[];
  safety_checks_required: string[];
  monitoring_requirements: string[];
  rollback_triggers: RollbackTrigger[];
  approval_requirements: string[];
}

export interface RollbackTrigger {
  metric_name: string;
  threshold_value: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  time_window_minutes: number;
  description: string;
}

// ===== РЕЗУЛЬТАТЫ ОПТИМИЗАЦИИ =====

export interface OptimizationResult {
  optimization_id: string;
  status: OptimizationStatus;
  applied_at: string;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  actions_executed: OptimizationActionResult[];
  performance_impact: PerformanceImpact;
  success_metrics: SuccessMetrics;
  issues_encountered: string[];
  rollback_triggered: boolean;
  rollback_reason?: string;
}

export interface OptimizationActionResult {
  action: OptimizationAction;
  executed_at: string;
  success: boolean;
  error_message?: string;
  actual_change: any;
  validation_result?: ValidationResult;
}

export interface PerformanceImpact {
  before_metrics: MetricsSnapshot;
  after_metrics: MetricsSnapshot;
  improvement_metrics: ImprovementMetrics;
  degradation_detected: boolean;
  overall_success: boolean;
}

export interface ImprovementMetrics {
  response_time_change_ms: number;
  success_rate_change_percent: number;
  throughput_change_percent: number;
  error_rate_change_percent: number;
  system_health_change: number;
}

export interface SuccessMetrics {
  goals_achieved: string[];
  goals_missed: string[];
  unexpected_benefits: string[];
  side_effects: string[];
  overall_satisfaction_score: number;
}

export interface ValidationResult {
  is_valid: boolean;
  validation_time_ms: number;
  checks_performed: string[];
  warnings: string[];
  errors: string[];
}

// ===== THRESHOLDS И КОНФИГУРАЦИЯ =====

export interface AlertThresholds {
  max_response_time_ms: number;
  min_success_rate_percent: number;
  max_error_rate_percent: number;
  max_memory_usage_mb: number;
  max_cpu_usage_percent: number;
  min_system_health_score: number;
  max_validation_time_ms: number;
  min_compatibility_score: number;
}

export interface DynamicThresholds {
  current: AlertThresholds;
  recommended: AlertThresholds;
  reasoning: ThresholdReasoning[];
  safety_check: SafetyAssessment;
  adjustment_history: ThresholdAdjustment[];
}

export interface ThresholdReasoning {
  threshold_name: string;
  current_value: number;
  recommended_value: number;
  change_percent: number;
  justification: string;
  supporting_data: string[];
  risk_assessment: string;
}

export interface ThresholdAdjustment {
  adjusted_at: string;
  threshold_name: string;
  old_value: number;
  new_value: number;
  reason: string;
  performance_impact?: PerformanceImpact;
  rolled_back: boolean;
  rollback_reason?: string;
}

// ===== СИСТЕМА ОБУЧЕНИЯ =====

export interface LearningData {
  historical_optimizations: OptimizationResult[];
  pattern_database: PatternDatabase;
  model_performance: ModelPerformance;
  prediction_accuracy: PredictionAccuracy;
}

export interface PatternDatabase {
  performance_patterns: PerformancePattern[];
  error_patterns: ErrorPattern[];
  optimization_patterns: OptimizationPattern[];
  seasonal_patterns: SeasonalPattern[];
}

export interface PerformancePattern {
  pattern_id: string;
  description: string;
  conditions: string[];
  typical_impact: string;
  recommended_actions: string[];
  confidence_score: number;
  occurrences: number;
}

export interface OptimizationPattern {
  pattern_id: string;
  optimization_type: OptimizationType;
  typical_scenarios: string[];
  success_rate: number;
  average_improvement: number;
  best_practices: string[];
}

export interface SeasonalPattern {
  pattern_id: string;
  time_period: string;
  typical_load_changes: LoadChange[];
  recommended_adjustments: OptimizationRecommendation[];
  historical_accuracy: number;
}

export interface LoadChange {
  metric_name: string;
  expected_change_percent: number;
  confidence_level: number;
  duration: string;
}

export interface ModelPerformance {
  prediction_accuracy_percent: number;
  false_positive_rate: number;
  false_negative_rate: number;
  model_drift_detected: boolean;
  last_training_date: string;
  training_data_quality: number;
}

export interface PredictionAccuracy {
  short_term_accuracy: number;  // 1-24 hours
  medium_term_accuracy: number; // 1-7 days  
  long_term_accuracy: number;   // 1-4 weeks
  accuracy_trend: TrendDirection;
  improvement_recommendations: string[];
}

// ===== ZOD SCHEMAS =====

export const OptimizationRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(['threshold_adjustment', 'performance_tuning', 'resource_optimization', 'load_balancing']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  rationale: z.string(),
  expected_impact: z.object({
    performance_improvement_percent: z.number(),
    success_rate_improvement_percent: z.number(),
    response_time_reduction_ms: z.number(),
    resource_efficiency_gain_percent: z.number(),
    confidence_level: z.number().min(0).max(100),
    business_value: z.string()
  }),
  implementation: z.array(z.object({
    action_type: z.enum(['config_change', 'threshold_adjustment', 'resource_allocation', 'algorithm_tuning']),
    target_component: z.string(),
    current_value: z.any(),
    new_value: z.any(),
    validation_required: z.boolean(),
    rollback_possible: z.boolean(),
    execution_order: z.number()
  })),
  rollback_plan: z.array(z.object({
    action_type: z.enum(['config_change', 'threshold_adjustment', 'resource_allocation', 'algorithm_tuning']),
    target_component: z.string(),
    current_value: z.any(),
    new_value: z.any(),
    validation_required: z.boolean(),
    rollback_possible: z.boolean(),
    execution_order: z.number()
  })),
  safety_assessment: z.object({
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    potential_negative_impacts: z.array(z.string()),
    safety_checks_required: z.array(z.string()),
    monitoring_requirements: z.array(z.string()),
    rollback_triggers: z.array(z.object({
      metric_name: z.string(),
      threshold_value: z.number(),
      comparison: z.enum(['greater_than', 'less_than', 'equals']),
      time_window_minutes: z.number(),
      description: z.string()
    })),
    approval_requirements: z.array(z.string())
  }),
  estimated_duration: z.string(),
  requires_human_approval: z.boolean(),
  created_at: z.string()
});

export const MetricsSnapshotSchema = z.object({
  timestamp: z.string(),
  agent_metrics: z.record(z.object({
    agent_id: z.enum(['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist']),
    response_time_ms: z.number(),
    success_rate: z.number().min(0).max(100),
    error_count: z.number().min(0),
    throughput_per_minute: z.number().min(0),
    memory_usage_mb: z.number().min(0),
    cpu_usage_percent: z.number().min(0).max(100),
    last_activity: z.string()
  })),
  system_metrics: z.object({
    total_requests: z.number().min(0),
    active_agents: z.number().min(0),
    average_response_time: z.number().min(0),
    overall_success_rate: z.number().min(0).max(100),
    critical_events: z.number().min(0),
    system_health_score: z.number().min(0).max(100)
  }),
  validation_metrics: z.object({
    total_validations: z.number().min(0),
    validation_success_rate: z.number().min(0).max(100),
    average_validation_time: z.number().min(0),
    failed_validations: z.number().min(0),
    quality_score_average: z.number().min(0).max(100),
    compatibility_score_average: z.number().min(0).max(100)
  })
});

// ===== КОНСТАНТЫ =====

export const OPTIMIZATION_CONSTANTS = {
  // Safety limits
  MAX_THRESHOLD_CHANGE_PERCENT: 20,
  ROLLBACK_CONFIDENCE_THRESHOLD: 95,
  MIN_OBSERVATION_WINDOW_HOURS: 1,
  MAX_OPTIMIZATION_BATCH_SIZE: 5,
  
  // Performance targets
  TARGET_SUCCESS_RATE_PERCENT: 95,
  TARGET_RESPONSE_TIME_MS: 2000,
  TARGET_SYSTEM_HEALTH_SCORE: 90,
  
  // Learning system
  MIN_DATA_POINTS_FOR_PATTERN: 10,
  PATTERN_CONFIDENCE_THRESHOLD: 80,
  MODEL_RETRAINING_THRESHOLD_DAYS: 7,
  
  // Alert thresholds
  DEFAULT_ALERT_THRESHOLDS: {
    max_response_time_ms: 5000,
    min_success_rate_percent: 90,
    max_error_rate_percent: 5,
    max_memory_usage_mb: 1024,
    max_cpu_usage_percent: 80,
    min_system_health_score: 80,
    max_validation_time_ms: 1000,
    min_compatibility_score: 85
  } as AlertThresholds
};

// ===== UTILITY TYPES =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type OptimizationConfig = DeepPartial<{
  safety_settings: {
    require_human_approval_for_critical: boolean;
    max_concurrent_optimizations: number;
    rollback_timeout_minutes: number;
  };
  learning_settings: {
    enable_pattern_learning: boolean;
    pattern_detection_sensitivity: number;
    prediction_confidence_threshold: number;
  };
  performance_settings: {
    metrics_collection_interval_seconds: number;
    analysis_window_hours: number;
    optimization_frequency_hours: number;
  };
}>;

export type SystemAnalysis = {
  current_state: MetricsSnapshot;
  trends: PerformanceTrend[];
  bottlenecks: Bottleneck[];
  error_patterns: ErrorPattern[];
  predicted_issues: PredictedIssue[];
  overall_health_assessment: string;
  optimization_opportunities: string[];
};

// ===== INTEGRATION TYPES =====

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

export interface OptimizationIntegrationConfig {
  enabled: boolean;
  auto_optimization_enabled: boolean;
  metrics_collection_interval_ms: number;
  optimization_interval_ms: number;
  require_human_approval_for_critical: boolean;
  max_auto_optimizations_per_hour: number;
}

// ===== SERVICE TYPES =====

export interface OptimizationServiceConfig {
  enabled: boolean;
  auto_optimization: boolean;
  require_approval_for_critical: boolean;
  max_auto_optimizations_per_day: number;
  min_confidence_threshold: number;
  metrics_collection_interval_ms: number;
  analysis_interval_ms: number;
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

// ===== INTERFACE TYPES =====

export interface OptimizationEngineInterface {
  analyzeSystemPerformance(): Promise<SystemAnalysis>;
  generateOptimizations(): Promise<OptimizationRecommendation[]>;
  applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<OptimizationResult[]>;
  trackOptimizationResults(): Promise<OptimizationResult[]>;
  rollbackOptimization(optimizationId: string): Promise<OptimizationResult>;
}

export interface PatternAnalyzer {
  analyzePerformanceTrends(timeWindow: number): Promise<PerformanceTrend[]>;
  identifyBottlenecks(): Promise<Bottleneck[]>;
  analyzeErrorPatterns(): Promise<ErrorPattern[]>;
  predictPerformanceIssues(): Promise<PredictedIssue[]>;
}

// ===== ADDITIONAL TYPES =====

export type BottleneckSeverity = 'critical' | 'high' | 'medium' | 'low';