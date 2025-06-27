// UltraThink - Intelligent Logic Enhancement for Email Generator Agent
// Phase 1: Simple Logic Optimization without complex computations

// Main engine
export { UltraThinkEngine } from './ultrathink-engine';

// Core components
export { RouteValidator } from './route-validator';
export { DateValidator } from './date-validator';
export { ToolSequencer } from './tool-sequencer';
export { SmartErrorHandler } from './smart-error-handler';
export { SimpleDataProvider } from './simple-data-provider';
export { ContextEnricher } from './context-enricher';

// Import for internal use
import { RouteValidator } from './route-validator';
import { DateValidator } from './date-validator';
import { SimpleDataProvider } from './simple-data-provider';
import { UltraThinkEngine } from './ultrathink-engine';

// Types and interfaces
export type {
  CityInfo,
  RouteValidation,
  DateValidation,
  SeasonalContext,
  ToolStep,
  ToolSequence,
  ErrorStrategy,
  ContextEnrichment,
  ValidationResult,
  ValidationIssue,
  UltraThinkConfig
} from './types';

// Utility functions for quick access
export const UltraThinkUtils = {
  /**
   * Quick route validation
   */
  validateRoute: (origin: string, destination: string) => {
    return RouteValidator.validateRoute(origin, destination);
  },

  /**
   * Quick date validation
   */
  validateDate: (dateRange: string, destination?: string) => {
    return DateValidator.validateDateRange(dateRange, destination);
  },

  /**
   * Quick seasonal context
   */
  getSeasonalContext: (date: Date) => {
    return SimpleDataProvider.getSeasonalContext(date);
  },

  /**
   * Quick holiday check
   */
  isHoliday: (date: string, countryCode: string) => {
    return SimpleDataProvider.isHoliday(date, countryCode);
  },

  /**
   * Quick route popularity
   */
  getRoutePopularity: (origin: string, destination: string) => {
    return SimpleDataProvider.getRoutePopularity(origin, destination);
  },

  /**
   * Quick price multiplier
   */
  getPriceMultiplier: (date: Date, origin: string, destination: string, countryCode?: string) => {
    return SimpleDataProvider.getPriceMultiplier(date, origin, destination, countryCode);
  },

  /**
   * Quick booking recommendations
   */
  getBookingRecommendations: (travelDate: Date, bookingDate?: Date) => {
    return SimpleDataProvider.getBookingRecommendations(travelDate, bookingDate);
  }
} as const;

// Pre-configured engine instances
export const UltraThinkPresets = {
  /**
   * Speed-optimized configuration for fast execution
   */
  speed: () => UltraThinkEngine.createSpeedOptimized(),

  /**
   * Quality-optimized configuration for best results
   */
  quality: () => UltraThinkEngine.createQualityOptimized(),

  /**
   * Debug configuration with detailed logging
   */
  debug: () => UltraThinkEngine.createDebugMode()
};

// Version and metadata
export const UltraThinkInfo = {
  version: '1.0.0',
  phase: 'Phase 1: Simple Logic Optimization',
  description: 'Intelligent logic enhancement without complex computations',
  features: [
    'Smart route validation with city database',
    'Contextual date validation and seasonal checks', 
    'Intelligent tool sequencing and execution order',
    'Context-aware error handling with fallbacks',
    'Simple external data integration (holidays, seasons)',
    'Request context enrichment with travel insights'
  ],
  limitations: [
    'No ML-based predictions',
    'No complex external API dependencies',
    'Static data only (no real-time updates)',
    'Simple heuristics over advanced algorithms'
  ]
};

// Quick start helper
export function createUltraThink(mode: 'speed' | 'quality' | 'debug' = 'quality'): UltraThinkEngine {
  switch (mode) {
    case 'speed':
      return UltraThinkEngine.createSpeedOptimized();
    case 'debug':
      return UltraThinkEngine.createDebugMode();
    case 'quality':
    default:
      return UltraThinkEngine.createQualityOptimized();
  }
}