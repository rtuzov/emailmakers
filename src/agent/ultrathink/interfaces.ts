/**
 * UltraThink System Interfaces
 * Defines contracts for all components to improve testability and modularity
 */

import { 
  EmailGenerationRequest, 
  ValidationResult, 
  ContextEnrichment, 
  ToolSequence, 
  QualityControlResult, 
  QualityControlConfig,
  ErrorStrategy,
  SeasonalContext 
} from './types';

// Core Engine Interface
export interface IUltraThinkEngine {
  enhanceRequest(request: EmailGenerationRequest): Promise<ContextEnrichment>;
  validateQualityResult(toolResult: any): QualityControlResult;
  shouldContinueWorkflow(phase: string): boolean;
  handleExecutionError(error: any, tool: string, attempt: number, context?: any): Promise<any>;
  getExecutionAnalytics(): any;
  formatEnhancedPrompt(basePrompt: string, context: ContextEnrichment): string;
  clearExecutionHistory(): void;
}

// Validation Interfaces
export interface IRouteValidator {
  validateRoute(origin?: string, destination?: string): ValidationResult;
  analyzeRoutePopularity(origin: string, destination: string): { 
    popularity: number; 
    insights: string[]; 
  };
  suggestAlternativeRoutes(origin: string, destination: string): string[];
}

export interface IDateValidator {
  validateDateRange(dateRange?: string): ValidationResult;
  analyzeDatePatterns(dateRange: string): {
    season: string;
    insights: string[];
    warnings: string[];
  };
  suggestOptimalDates(destination: string): string[];
}

export interface IInputSanitizer {
  validateString(input: any): string | null;
  validateCityCode(code: string | undefined | null): string | null;
  validateDateString(date: string | undefined | null): string | null;
  checkRateLimit(identifier?: string): boolean;
  escapeSpecialCharacters(input: string): string;
}

// Orchestration Interfaces
export interface IToolSequencer {
  optimizeSequence(request: EmailGenerationRequest): ToolSequence;
  createEnforcedSequence(request: EmailGenerationRequest): ToolSequence;
  initializeQualityControl(config: QualityControlConfig): void;
}

export interface IQualityController {
  validateQualityResult(toolResult: any): QualityControlResult;
  shouldContinueWorkflow(phase: string): boolean;
  createEnforcedSequence(baseSequence: ToolSequence): ToolSequence;
  getQualityStats(): any;
  clearExecutionHistory(): void;
  setMaxHistorySize(size: number): void;
}

export interface IErrorHandler {
  getErrorStrategy(tool: string, error: any): ErrorStrategy;
  analyzeErrorContext(tool: string, error: any, context?: any): any;
  handleExecutionError(error: any, tool: string, attempt: number, context?: any): Promise<any>;
}

// Data Provider Interfaces
export interface IDataProvider {
  isHoliday(date: string, countryCode: string): boolean;
  getSeasonalContext(date: Date): SeasonalContext;
  getRoutePopularity(origin: string, destination: string): number;
  isWeekend(date: Date): boolean;
  isSchoolHoliday(date: Date, countryCode?: string): { isHoliday: boolean; holidayName?: string };
  getTravelAdvisory(countryCode: string): any;
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number;
  getPriceMultiplier(date: Date, origin: string, destination: string, countryCode?: string): any;
  getYearlyHolidays(year: number, countryCode: string): string[];
  getBookingRecommendations(travelDate: Date, bookingDate?: Date): any;
  getDestinationTips(countryCode: string): string[];
}

export interface IContextEnricher {
  enrichContext(request: EmailGenerationRequest): Promise<ContextEnrichment>;
  analyzeDestination(destination: string): any;
  analyzeRoute(origin: string, destination: string): any;
  analyzeDateContext(dateRange: string): any;
  analyzeSeasonalFactors(destination: string, dateRange: string): any;
  analyzePricingContext(origin: string, destination: string, dateRange: string): any;
}

// Logging Interface
export interface ILogger {
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any): void;
  logSecure(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any): void;
  sanitizeForLogging(data: any): any;
}

// Configuration Interface
export interface IConfigProvider {
  getTimeConstants(): typeof import('./constants').TIME_CONSTANTS;
  getLimits(): typeof import('./constants').LIMITS;
  getQualityConstants(): typeof import('./constants').QUALITY_CONSTANTS;
  getBusinessThresholds(): typeof import('./constants').BUSINESS_THRESHOLDS;
  getToolConstants(): typeof import('./constants').TOOL_CONSTANTS;
}

// Factory Interfaces
export interface IUltraThinkFactory {
  createEngine(config?: any): IUltraThinkEngine;
  createQualityController(config?: QualityControlConfig): IQualityController;
  createToolSequencer(): IToolSequencer;
  createErrorHandler(): IErrorHandler;
  createDataProvider(): IDataProvider;
  createContextEnricher(): IContextEnricher;
  createLogger(): ILogger;
}

// Dependency Injection Container Interface
export interface IDependencyContainer {
  register<T>(token: string, factory: () => T): void;
  registerSingleton<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
  isRegistered(token: string): boolean;
  clear(): void;
}

// Service Tokens for DI
export const SERVICE_TOKENS = {
  UltraThinkEngine: 'UltraThinkEngine',
  RouteValidator: 'RouteValidator',
  DateValidator: 'DateValidator',
  InputSanitizer: 'InputSanitizer',
  ToolSequencer: 'ToolSequencer',
  QualityController: 'QualityController',
  ErrorHandler: 'ErrorHandler',
  DataProvider: 'DataProvider',
  ContextEnricher: 'ContextEnricher',
  Logger: 'Logger',
  ConfigProvider: 'ConfigProvider'
} as const;

export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];