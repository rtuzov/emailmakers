/**
 * 🚀 Cached MJML Generation Service
 * 
 * High-performance wrapper around MjmlGenerationService with caching,
 * async processing, and performance optimizations
 */

import { 
  MjmlGenerationService,
  MjmlGenerationServiceOptions,
  CompleteMjmlGenerationResult 
} from './mjml-generation.service';
import { 
  TemplateCacheService,
  CacheMetrics,
  globalTemplateCache 
} from '../infrastructure/template-cache.service';
import { 
  MjmlGenerationRequest
} from '../interfaces/mjml-generator.interface';

export interface CachedGenerationOptions extends MjmlGenerationServiceOptions {
  enableCaching?: boolean;
  cacheTime?: number; // TTL in seconds
  enableAsyncProcessing?: boolean;
  enableBatchOptimization?: boolean;
  maxConcurrentGenerations?: number;
}

export interface GenerationPerformanceReport {
  cacheHitRate: number;
  averageGenerationTime: number;
  totalGenerations: number;
  cacheMetrics: CacheMetrics;
  performanceGains: {
    timesSavedByCache: number;
    totalTimeSaved: number; // in ms
    avgCacheResponseTime: number;
    avgGenerationResponseTime: number;
  };
}

/**
 * Cached MJML Generation Service with Performance Optimizations
 */
export class CachedMjmlGenerationService {
  private baseService: MjmlGenerationService;
  private cache: TemplateCacheService;
  private performanceData: {
    generations: number;
    cacheHits: number;
    totalGenerationTime: number;
    totalCacheTime: number;
  };
  private concurrentGenerations: Set<string>;
  private maxConcurrency: number;

  constructor(
    baseService?: MjmlGenerationService,
    cache?: TemplateCacheService,
    maxConcurrency: number = 5
  ) {
    this.baseService = baseService || new MjmlGenerationService();
    this.cache = cache || globalTemplateCache;
    this.maxConcurrency = maxConcurrency;
    this.concurrentGenerations = new Set();
    
    this.performanceData = {
      generations: 0,
      cacheHits: 0,
      totalGenerationTime: 0,
      totalCacheTime: 0
    };
  }

  /**
   * Generate complete MJML template with intelligent caching
   */
  async generateComplete(
    request: MjmlGenerationRequest,
    options: CachedGenerationOptions = {}
  ): Promise<CompleteMjmlGenerationResult> {
    const startTime = Date.now();
    
    // Check if caching is enabled
    const cacheEnabled = options.enableCaching !== false;
    
    if (cacheEnabled) {
      // Try to get from cache first
      const cacheResult = await this.getFromCache(request, options);
      if (cacheResult) {
        const cacheTime = Date.now() - startTime;
        this.updatePerformanceStats(true, 0, cacheTime);
        
        console.log(`⚡ Cache HIT: Generated in ${cacheTime}ms (cache)`);
        return cacheResult;
      }
    }

    // Generate request hash for concurrency control
    const requestHash = this.generateRequestHash(request);
    
    // Check if same request is already being processed
    if (this.concurrentGenerations.has(requestHash)) {
      console.log('⏳ Same request already in progress, waiting...');
      await this.waitForCompletion(requestHash);
      
      // Try cache again after waiting
      if (cacheEnabled) {
        const cacheResult = await this.getFromCache(request, options);
        if (cacheResult) {
          const cacheTime = Date.now() - startTime;
          this.updatePerformanceStats(true, 0, cacheTime);
          return cacheResult;
        }
      }
    }

    // Check concurrency limits
    if (this.concurrentGenerations.size >= this.maxConcurrency) {
      throw new Error(`Maximum concurrent generations (${this.maxConcurrency}) exceeded`);
    }

    try {
      // Mark request as in progress
      this.concurrentGenerations.add(requestHash);
      
      // Generate using base service
      const result = await this.baseService.generateComplete(request, options);
      
      // Cache the result if caching is enabled
      if (cacheEnabled && result.mjmlTemplate && result.emailTemplate) {
        await this.cacheResult(request, result, options.cacheTime);
      }

      const generationTime = Date.now() - startTime;
      this.updatePerformanceStats(false, generationTime, 0);
      
      console.log(`🎨 Generated fresh template in ${generationTime}ms`);
      return result;
      
    } finally {
      // Remove from concurrent set
      this.concurrentGenerations.delete(requestHash);
    }
  }

  /**
   * Batch generation with optimization
   */
  async generateBatch(
    requests: Array<{
      id: string;
      request: MjmlGenerationRequest;
      options?: CachedGenerationOptions;
    }>
  ): Promise<Array<{
    id: string;
    result?: CompleteMjmlGenerationResult;
    error?: string;
    fromCache?: boolean;
  }>> {
    console.log(`🔄 Starting batch generation for ${requests.length} requests...`);
    
    const results: Array<{
      id: string;
      result?: CompleteMjmlGenerationResult;
      error?: string;
      fromCache?: boolean;
    }> = [];

    // First pass: Check cache for all requests
    const cachePromises = requests.map(async ({ id, request, options }) => {
      try {
        const cacheEnabled = options?.enableCaching !== false;
        if (cacheEnabled) {
          const cached = await this.getFromCache(request, options || {});
          if (cached) {
            return { id, result: cached, fromCache: true };
          }
        }
        return null;
      } catch (error) {
        return { id, error: error instanceof Error ? error.message : 'Cache error' };
      }
    });

    const cacheResults = await Promise.allSettled(cachePromises);
    const remainingRequests: typeof requests = [];

    // Process cache results
    cacheResults.forEach((settled, index) => {
      if (settled.status === 'fulfilled' && settled.value) {
        if (settled.value.error) {
          results.push({ id: settled.value.id, error: settled.value.error });
        } else {
          results.push(settled.value);
        }
      } else {
        const request = requests[index];
        if (request) {
          remainingRequests.push(request);
        }
      }
    });

    console.log(`📋 Cache provided ${results.length} results, generating ${remainingRequests.length} fresh`);

    // Second pass: Generate remaining requests
    if (remainingRequests.length > 0) {
      const generationPromises = remainingRequests.map(async ({ id, request, options }) => {
        try {
          const result = await this.generateComplete(request, options || {});
          return { id, result, fromCache: false };
        } catch (error) {
          return { id, error: error instanceof Error ? error.message : 'Generation error' };
        }
      });

      const generationResults = await Promise.allSettled(generationPromises);
      
      generationResults.forEach((settled) => {
        if (settled.status === 'fulfilled') {
          results.push(settled.value);
        } else {
          results.push({ 
            id: 'unknown', 
            error: settled.reason instanceof Error ? settled.reason.message : 'Promise rejected' 
          });
        }
      });
    }

    return results;
  }

  /**
   * Pre-warm cache with common templates
   */
  async preWarmCache(
    commonRequests: Array<{ key: string; request: MjmlGenerationRequest }>
  ): Promise<void> {
    console.log(`🔥 Pre-warming cache with ${commonRequests.length} common templates...`);
    
    const warmupPromises = commonRequests.map(async ({ key, request }) => {
      try {
        await this.generateComplete(request, {
          enableCaching: true,
          cacheTime: 7200, // 2 hours for common templates
          performanceLogging: false
        });
        console.log(`✅ Pre-warmed: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Failed to pre-warm ${key}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log('🔥 Cache pre-warming completed');
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): GenerationPerformanceReport {
    const cacheMetrics = this.cache.getMetrics();
    const cacheHitRate = this.performanceData.generations > 0 
      ? (this.performanceData.cacheHits / this.performanceData.generations) * 100 
      : 0;

    const avgGenerationTime = this.performanceData.generations > 0 
      ? this.performanceData.totalGenerationTime / (this.performanceData.generations - this.performanceData.cacheHits)
      : 0;

    const avgCacheTime = this.performanceData.cacheHits > 0 
      ? this.performanceData.totalCacheTime / this.performanceData.cacheHits 
      : 0;

    const timeSavedPerHit = Math.max(0, avgGenerationTime - avgCacheTime);
    const totalTimeSaved = timeSavedPerHit * this.performanceData.cacheHits;

    return {
      cacheHitRate,
      averageGenerationTime: avgGenerationTime,
      totalGenerations: this.performanceData.generations,
      cacheMetrics,
      performanceGains: {
        timesSavedByCache: this.performanceData.cacheHits,
        totalTimeSaved,
        avgCacheResponseTime: avgCacheTime,
        avgGenerationResponseTime: avgGenerationTime
      }
    };
  }

  /**
   * Optimize cache (cleanup, reorder)
   */
  async optimizeCache(): Promise<void> {
    console.log('🧹 Optimizing cache...');
    
    // Get cache statistics
    const stats = this.cache.getStatistics();
    
    // Remove items that haven't been accessed recently and have low hit counts
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let optimizedCount = 0;

    for (const entry of stats.topKeys) {
      if (entry.lastAccessed < cutoffDate && entry.hits < 2) {
        await this.cache.clear(entry.key);
        optimizedCount++;
      }
    }

    console.log(`🧹 Cache optimization completed: removed ${optimizedCount} underused entries`);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    return this.cache.getStatistics();
  }

  // Private helper methods
  private async getFromCache(
    request: MjmlGenerationRequest,
    options: CachedGenerationOptions
  ): Promise<CompleteMjmlGenerationResult | null> {
    const cacheKey = this.generateCacheKey(request, options);
    
    const startTime = Date.now();
    const cached = await this.cache.getCachedCompiledTemplate(cacheKey);
    
    if (cached) {
      // Reconstruct complete result from cache
      const result: CompleteMjmlGenerationResult = {
        mjmlTemplate: cached.mjmlTemplate,
        emailTemplate: cached.emailTemplate,
        generationResult: {
          mjmlContent: cached.mjmlTemplate.mjmlContent,
          metadata: cached.mjmlTemplate.metadata,
          validation: cached.mjmlTemplate.validate(),
          performance: cached.mjmlTemplate.getPerformanceMetrics()
        },
        renderingResult: {
          html: cached.emailTemplate.htmlContent,
          css: cached.emailTemplate.metadata.optimizations.cssInlined ? 'inlined' : '',
          fileSize: Buffer.byteLength(cached.emailTemplate.htmlContent, 'utf8'),
          renderTime: Date.now() - startTime,
          warnings: []
        },
        finalValidation: cached.emailTemplate.validate(),
        performanceMetrics: cached.mjmlTemplate.getPerformanceMetrics(),
        processingTime: Date.now() - startTime
      };

      return result;
    }

    return null;
  }

  private async cacheResult(
    request: MjmlGenerationRequest,
    result: CompleteMjmlGenerationResult,
    ttl?: number
  ): Promise<void> {
    if (!result.mjmlTemplate || !result.emailTemplate) return;

    const cacheKey = this.generateCacheKey(request, {});
    
    try {
      await this.cache.cacheCompiledTemplate(
        result.mjmlTemplate, 
        result.emailTemplate, 
        ttl
      );
      console.log(`💾 Cached result with key: ${cacheKey}`);
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  private generateCacheKey(request: MjmlGenerationRequest, options: CachedGenerationOptions): string {
    // Create hash from request content and relevant options
    const keyData = {
      contentContext: request.contentContext,
      designRequirements: request.designRequirements,
      optimizeForClients: options.optimizeForClients,
      renderToHtml: options.renderToHtml
    };
    
    const contentStr = JSON.stringify(keyData);
    return this.generateContentHash(contentStr);
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `gen:${Math.abs(hash).toString(36)}`;
  }

  private generateRequestHash(request: MjmlGenerationRequest): string {
    // Generate simpler hash for concurrency control
    const simpleContent = `${request.contentContext.subject}-${request.contentContext.campaign.id}`;
    return this.generateContentHash(simpleContent);
  }

  private async waitForCompletion(requestHash: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.concurrentGenerations.has(requestHash)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100); // Check every 100ms
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  private updatePerformanceStats(fromCache: boolean, generationTime: number, cacheTime: number): void {
    this.performanceData.generations++;
    
    if (fromCache) {
      this.performanceData.cacheHits++;
      this.performanceData.totalCacheTime += cacheTime;
    } else {
      this.performanceData.totalGenerationTime += generationTime;
    }
  }
}

// Global cached service instance
export const globalCachedMjmlService = new CachedMjmlGenerationService(); 