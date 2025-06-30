/**
 * 🎯 OPTIMIZATION SYSTEM - Единая точка экспорта всех компонентов системы оптимизации
 * 
 * Экспортирует все компоненты системы автоматической оптимизации агентов и валидаторов
 * для удобного импорта в других частях приложения.
 */

// Основные компоненты
export { OptimizationEngine } from './optimization-engine';
export { OptimizationAnalyzer } from './optimization-analyzer';
export { OptimizationIntegration } from './optimization-integration';
export { OptimizationService } from './optimization-service';

// Phase 2: Dynamic Thresholds + Human Oversight
export { DynamicThresholdsEngine } from './phase2/dynamic-thresholds-engine';
export { HumanOversightDashboard } from './phase2/human-oversight-dashboard';

// Phase 3: Auto-Scaling + Machine Learning
export { MachineLearningEngine } from './phase3/machine-learning-engine';
export { AutoScalingManager } from './phase3/auto-scaling-manager';

// Типы и интерфейсы
export {
  // Базовые типы
  type MetricsSnapshot,
  type AgentMetrics,
  type SystemMetrics,
  type ValidationMetrics,
  type OptimizationRecommendation,
  type OptimizationResult,
  type SystemAnalysis,
  type OptimizationConfig,
  
  // Типы анализа
  type PerformanceTrend,
  type Bottleneck,
  type ErrorPattern,
  type PredictedIssue,
  
  // Типы интеграции
  type IntegratedMetricsSnapshot,
  type OptimizationIntegrationConfig,
  
  // Типы сервиса
  type OptimizationServiceConfig,
  type OptimizationServiceStatus,
  type OptimizationReport,
  
  // Enum и union типы
  type AgentType,
  type OptimizationType,
  type OptimizationPriority,
  type OptimizationStatus,
  type TrendDirection,
  type BottleneckSeverity,
  
  // Интерфейсы
  type OptimizationEngineInterface,
  type PatternAnalyzer,
  
  // Константы
  OPTIMIZATION_CONSTANTS
} from './optimization-types';

// Integration Tests
export { runPhase2IntegrationTest } from './phase2/integration-test';
export { runPhase3IntegrationTest } from './phase3/integration-test';
export { runMasterIntegrationTest, runMasterSmokeTest } from './master-integration-test';

// Демонстрационные компоненты
export { 
  demonstrateOptimizationSystem,
  simulateRealWorldOptimization,
  demonstrateSystemIntegration
} from './optimization-demo';

// Re-export для удобства
export type { 
  OptimizationEngine as Engine,
  OptimizationAnalyzer as Analyzer,
  OptimizationIntegration as Integration,
  OptimizationService as Service
} from './index';

/**
 * Заводской метод для создания полностью настроенного OptimizationService
 * Использует production-ready конфигурацию с возможностью переопределения
 */
export function createOptimizationService(config?: Partial<import('./optimization-service').OptimizationServiceConfig>) {
  // Получаем production configuration
  const { getOptimizationConfig, validateOptimizationConfig, applyEnvironmentOverrides } = require('../../config/optimization-config');
  
  let productionConfig = getOptimizationConfig();
  productionConfig = applyEnvironmentOverrides(productionConfig);
  
  // Validate configuration
  if (!validateOptimizationConfig(productionConfig)) {
    console.warn('⚠️ Invalid optimization configuration, using safe defaults');
    productionConfig = {
      enabled: true,
      auto_optimization: false, // Safe default
      require_approval_for_critical: true,
      max_auto_optimizations_per_day: 5,
      min_confidence_threshold: 90,
      metrics_collection_interval_ms: 60000,
      analysis_interval_ms: 300000,
      emergency_stop_enabled: true,
      rollback_timeout_minutes: 30,
      max_concurrent_optimizations: 1,
      ml_enabled: false,
      auto_scaling_enabled: false,
      human_oversight_required: true,
      prediction_confidence_threshold: 95,
      dashboard_refresh_interval_ms: 30000,
      real_time_monitoring: true,
      alert_thresholds: {
        low_health_score: 60,
        high_error_rate: 20,
        slow_response_time_ms: 5000
      }
    };
  }
  
  // Merge user config with production config
  const finalConfig = {
    ...productionConfig,
    ...config, // User overrides
    integration: config?.integration || {},
    engine: config?.engine || {}
  };
  
  console.log('🚀 Creating OptimizationService with production configuration:', {
    enabled: finalConfig.enabled,
    auto_optimization: finalConfig.auto_optimization,
    environment: process.env.NODE_ENV || 'development',
    ml_enabled: finalConfig.ml_enabled,
    auto_scaling_enabled: finalConfig.auto_scaling_enabled
  });
  
  return new (require('./optimization-service').OptimizationService)(finalConfig);
}

/**
 * Заводской метод для создания автономного OptimizationEngine
 */
export function createOptimizationEngine(config?: Partial<import('./optimization-types').OptimizationConfig>) {
  return new (require('./optimization-engine').OptimizationEngine)(config);
}

/**
 * Заводской метод для создания OptimizationIntegration
 */
export function createOptimizationIntegration(config?: Partial<import('./optimization-integration').OptimizationIntegrationConfig>) {
  return new (require('./optimization-integration').OptimizationIntegration)(config);
}

/**
 * Версия пакета оптимизации
 */
export const OPTIMIZATION_VERSION = '1.0.0';

/**
 * Информация о системе оптимизации
 */
export const OPTIMIZATION_INFO = {
  version: OPTIMIZATION_VERSION,
  name: 'Email-Makers Optimization System',
  description: 'AI-powered optimization system for email template generation agents and validators',
  components: [
    'OptimizationEngine - Core optimization logic',
    'OptimizationAnalyzer - Pattern analysis and bottleneck detection', 
    'OptimizationIntegration - Integration with existing monitoring systems',
    'OptimizationService - Main coordination service'
  ],
  capabilities: [
    'Real-time performance monitoring',
    'Automatic bottleneck detection', 
    'AI-powered recommendation generation',
    'Safe optimization application with rollback',
    'Dynamic threshold adjustment',
    'Predictive issue detection',
    'Human oversight for critical decisions',
    'Machine learning with feedback loops',
    'Auto-scaling based on ML predictions',
    'Emergency scaling mechanisms',
    'Cross-phase integration testing',
    'Integration with ValidationMonitor, MetricsService, PerformanceMonitor'
  ],
  phases: [
    'Phase 1: Foundation + Safety - Core optimization engine with safety mechanisms',
    'Phase 2: Dynamic Thresholds + Human Oversight - Intelligent threshold adjustment with human approval workflows',
    'Phase 3: Auto-Scaling + Machine Learning - ML-powered auto-scaling with feedback loops and predictive analytics'
  ]
} as const;