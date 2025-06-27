// Base interfaces for UltraThink system
export interface CityInfo {
  name: string;
  country: string;
  timezone: string;
  popular: boolean;
  seasonal?: 'summer' | 'winter' | 'all-year';
  region?: string;
}

export interface RouteValidation {
  valid: boolean;
  popularity?: 'high' | 'medium' | 'low';
  timezoneDiff?: number;
  suggestion?: string;
  issues?: string[];
  correctedOrigin?: string;
  correctedDestination?: string;
}

export interface DateValidation {
  valid: boolean;
  issue?: string;
  warning?: string;
  suggestion?: string;
  seasonalContext?: SeasonalContext;
  isHoliday?: boolean;
}

export interface SeasonalContext {
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'unknown';
  priceFactor: number;
  months: number[];
  description?: string;
}

export interface ToolStep {
  tool: string;
  priority: number;
  parallel?: boolean;
  condition?: string;
  fallback?: string;
}

export interface ToolSequence {
  steps: ToolStep[];
  estimatedDuration: number;
  strategy: 'speed' | 'quality' | 'balanced';
}

export interface ErrorStrategy {
  action: 'retry' | 'fallback' | 'skip' | 'wait' | 'standard_retry';
  delay?: number;
  fallback?: string;
  skipRetry?: boolean;
  modification?: string;
  maxAttempts?: number;
}

export interface ContextEnrichment {
  seasonal: SeasonalContext;
  holidays: boolean;
  routePopularity: 'high' | 'medium' | 'low';
  timezoneDiff: number;
  suggestions: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  correctedRequest?: any;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'route' | 'date' | 'parameter';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autofix?: boolean;
}

export interface UltraThinkConfig {
  enableValidation: boolean;
  enableContextEnrichment: boolean;
  enableSmartSequencing: boolean;
  enableErrorIntelligence: boolean;
  fallbackToUnsplash: boolean;
  debugMode: boolean;
  enableQualityControl: boolean;
}

// Quality Control types
export interface QualityGate {
  stage: 'post-render' | 'pre-upload' | 'final';
  required: boolean;
  tool: string;
  timeout: number;
  retries: number;
}

export interface QualityControlResult {
  passed: boolean;
  score?: number;
  issues: QualityIssue[];
  recommendations: string[];
  shouldProceed: boolean;
  requiresRegeneration: boolean;
}

export interface QualityIssue {
  type: 'content' | 'technical' | 'design' | 'accessibility';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  autoFixable: boolean;
  location?: string;
}

export interface QualityControlConfig {
  enforceAiConsultant: boolean;
  minimumScore: number;
  criticalIssueThreshold: number;
  autoRetryCount: number;
  requireManualReview: boolean;
}