/**
 * 📧 Template Processing Domain - Public API
 * 
 * Main entry point for MJML template processing domain
 * Exports all interfaces, entities, and services following DDD principles
 */

// Internal imports for factory functions
import { TemplateCacheService } from './infrastructure/template-cache.service';
import { MjmlGenerationService } from './services/mjml-generation.service';
import { CachedMjmlGenerationService } from './services/cached-mjml-generation.service';

// Core Interfaces
export * from './interfaces/mjml-generator.interface';

// Domain Entities
export { MjmlTemplate } from './entities/mjml-template.entity';
export { EmailTemplate } from './entities/email-template.entity';
export type { EmailTemplateMetadata, OptimizationSummary, EmailQualityMetrics } from './entities/email-template.entity';

// Domain Services
export { MjmlGeneratorService } from './services/mjml-generator.service';
export { TemplateRendererService } from './services/template-renderer.service';
export { TemplateValidatorService } from './services/template-validator.service';

// Application Services (re-export imported classes)
export { MjmlGenerationService } from './services/mjml-generation.service';
export type { 
  MjmlGenerationServiceOptions,
  CompleteMjmlGenerationResult
} from './services/mjml-generation.service';

// High-Performance Services with Caching (re-export imported classes)
export { 
  CachedMjmlGenerationService,
  type CachedGenerationOptions,
  type GenerationPerformanceReport,
  globalCachedMjmlService
} from './services/cached-mjml-generation.service';

// Infrastructure Services (re-export imported classes)
export { 
  TemplateCacheService,
  type CacheOptions,
  type CacheMetrics,
  globalTemplateCache
} from './infrastructure/template-cache.service';

// Refactored Processor Service
export { MjmlProcessorService } from './services/mjml-processor-service';
export type { ProcessingResult, OptimizationReport } from './services/mjml-processor-service';

// Legacy Compatibility Adapters
export { 
  LegacyMjmlAdapter,
  generateDynamicMjmlTemplate,
  legacyMjmlAdapter
} from './adapters/legacy-mjml-adapter';

export { 
  MjmlToolAdapter,
  renderMjml,
  generateMjmlWithProgressiveSaving,
  mjmlToolAdapter
} from './adapters/mjml-tool-adapter';

// Convenience factory for creating a complete MJML processing service
export function createMjmlProcessor(options?: {
  enablePerformanceLogging?: boolean;
  enableCaching?: boolean;
  defaultEmailClients?: import('./interfaces/mjml-generator.interface').EmailClient[];
  maxCacheSize?: number;
  cacheDefaultTTL?: number;
}): CachedMjmlGenerationService {
  // Create cache service if caching is enabled
  const cacheService = options?.enableCaching !== false 
    ? new TemplateCacheService({
        maxSize: options?.maxCacheSize || 500,
        defaultTTL: options?.cacheDefaultTTL || 3600,
        enableMetrics: true
      })
    : undefined;

  // Create base service
  const baseService = new MjmlGenerationService();
  
  // Create cached service
  const service = new CachedMjmlGenerationService(baseService, cacheService);
  
  if (options?.enablePerformanceLogging) {
    console.log('🚀 High-Performance MJML Processor initialized');
    console.log(`   📋 Caching: ${options?.enableCaching !== false ? 'Enabled' : 'Disabled'}`);
    console.log(`   💾 Cache Size: ${options?.maxCacheSize || 500} templates`);
    console.log(`   ⏰ Cache TTL: ${options?.cacheDefaultTTL || 3600}s`);
  }
  
  return service;
}

// Convenience function for quick MJML generation
export async function generateMjmlTemplate(
  request: import('./interfaces/mjml-generator.interface').MjmlGenerationRequest,
  options?: import('./services/mjml-generation.service').MjmlGenerationServiceOptions
): Promise<import('./services/mjml-generation.service').CompleteMjmlGenerationResult> {
  const processor = createMjmlProcessor({ 
    enablePerformanceLogging: options?.performanceLogging || false 
  });
  return processor.generateComplete(request, options);
}

// Type guards for runtime type checking
export function isMjmlTemplate(obj: any): obj is import('./entities/mjml-template.entity').MjmlTemplate {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.mjmlContent === 'string' && 
         obj.metadata && 
         typeof obj.validate === 'function';
}

export function isEmailTemplate(obj: any): obj is import('./entities/email-template.entity').EmailTemplate {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.htmlContent === 'string' && 
         obj.metadata && 
         typeof obj.validate === 'function';
}

// Constants for email client support
export const SUPPORTED_EMAIL_CLIENTS = [
  'gmail',
  'outlook', 
  'outlook-web',
  'apple-mail',
  'yahoo-mail',
  'thunderbird'
] as const;

export const DEFAULT_EMAIL_CLIENTS = [
  'gmail',
  'outlook',
  'apple-mail'
] as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  maxTemplateSize: 100 * 1024, // 100KB
  maxGenerationTime: 5000, // 5 seconds
  maxCachedGenerationTime: 500, // 500ms for cached responses
  maxComplexityScore: 75,
  minValidationScore: 80,
  optimalCacheHitRate: 80, // 80% cache hit rate target
  maxConcurrentGenerations: 10
} as const;

// Cache configuration constants
export const CACHE_DEFAULTS = {
  maxSize: 500,
  defaultTTL: 3600, // 1 hour
  maxTTL: 86400, // 24 hours
  preWarmCommonTemplates: true,
  enableMetrics: true
} as const;

// Validation severity levels
export const VALIDATION_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
} as const; 