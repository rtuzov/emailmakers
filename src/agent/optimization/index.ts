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

// Утилиты (если будут добавлены)
// export * from './optimization-utils';

// Re-export для удобства
export type { 
  OptimizationEngine as Engine,
  OptimizationAnalyzer as Analyzer,
  OptimizationIntegration as Integration,
  OptimizationService as Service
} from './index';

/**
 * Заводской метод для создания полностью настроенного OptimizationService
 */
export function createOptimizationService(config?: Partial<import('./optimization-service').OptimizationServiceConfig>) {
  return new (require('./optimization-service').OptimizationService)(config);
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
    'Integration with ValidationMonitor, MetricsService, PerformanceMonitor'
  ]
} as const;