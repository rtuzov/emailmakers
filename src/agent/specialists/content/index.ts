/**
 * 📝 CONTENT SPECIALISTS INDEX
 * 
 * Модульная архитектура для content generation
 * Централизованные экспорты всех content сервисов
 */

// Common types and utilities
export * from './common/content-types';
export * from './common/content-utils';

// Core services
export { PricingService } from './services/pricing-service';
export { GenerationService } from './services/generation-service';
export { DestinationAnalyzer } from './services/destination-analyzer';
export { MultiDestinationPlanner } from './services/multi-destination-planner';
export { SeasonalOptimizer } from './services/seasonal-optimizer';

// Re-export for backward compatibility
export type {
  ContentGeneratorParams,
  ContentGeneratorResult,
  ContentResult,
  ContentVariant,
  ContentAnalysis,
  ContentInsights,
  MarketingIntelligence,
  PricingContext,
  PricingAnalysisResult,
  GenerationContext,
  GenerationResult,
  OptimizationResult
} from './common/content-types';

// Multi-destination types and interfaces
export type {
  DestinationAnalyzerConfig,
  DestinationGenerationParams
} from './services/destination-analyzer';

export type {
  MultiDestinationPlannerConfig,
  PlanOptimizationParams,
  DestinationMixOptimization,
  UnifiedPlanCreationParams
} from './services/multi-destination-planner';

export type {
  SeasonalOptimizerConfig,
  DateOptimizationParams,
  SeasonalAnalysis,
  DateOptimizationResult,
  CountrySeasonalData
} from './services/seasonal-optimizer';