/**
 * 🚀 Template Cache Service
 * 
 * High-performance caching service for MJML templates and compiled HTML
 * Supports in-memory caching with configurable TTL and size limits
 */

import { ITemplateCache, CachedTemplate } from '../interfaces/mjml-generator.interface';
import { MjmlTemplate } from '../entities/mjml-template.entity';
import { EmailTemplate } from '../entities/email-template.entity';

export interface CacheOptions {
  maxSize: number; // Maximum number of cached items
  defaultTTL: number; // Default TTL in seconds
  enableMetrics: boolean; // Whether to track cache metrics
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsageMB: number;
}

export interface CacheEntry {
  key: string;
  data: CachedTemplate;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  lastAccessed: Date;
}

/**
 * In-Memory Template Cache with LRU eviction
 */
export class TemplateCacheService implements ITemplateCache {
  private cache: Map<string, CacheEntry>;
  private options: CacheOptions;
  private metrics: CacheMetrics;

  constructor(options: Partial<CacheOptions> = {}) {
    this.cache = new Map();
    this.options = {
      maxSize: options.maxSize || 1000,
      defaultTTL: options.defaultTTL || 3600, // 1 hour
      enableMetrics: options.enableMetrics ?? true
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsageMB: 0
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), 300000); // 5 minutes
  }

  /**
   * Get cached template
   */
  async get(key: string): Promise<CachedTemplate | null> {
    this.metrics.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = new Date();
    
    this.metrics.hits++;
    this.updateMetrics();
    
    console.log(`📋 Cache HIT for key: ${key} (${entry.hits} hits)`);
    return entry.data;
  }

  /**
   * Store template in cache
   */
  async set(key: string, template: CachedTemplate, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.options.defaultTTL;
    const expiresAt = new Date(Date.now() + actualTTL * 1000);
    
    const entry: CacheEntry = {
      key,
      data: template,
      createdAt: new Date(),
      expiresAt,
      hits: 0,
      lastAccessed: new Date()
    };

    // Check if we need to evict items
    if (this.cache.size >= this.options.maxSize) {
      await this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateCacheSize();
    
    console.log(`💾 Cached template: ${key} (expires in ${actualTTL}s)`);
  }

  /**
   * Clear cache for specific key or all
   */
  async clear(key?: string): Promise<void> {
    if (key) {
      const deleted = this.cache.delete(key);
      if (deleted) {
        console.log(`🗑️ Cleared cache for key: ${key}`);
      }
    } else {
      this.cache.clear();
      this.resetMetrics();
      console.log('🗑️ Cleared entire cache');
    }
    
    this.updateCacheSize();
  }

  /**
   * Cache MJML template
   */
  async cacheMjmlTemplate(template: MjmlTemplate, ttl?: number): Promise<string> {
    const cacheKey = this.generateMjmlCacheKey(template);
    
    const cachedTemplate: CachedTemplate = {
      key: cacheKey,
      mjmlContent: template.mjmlContent,
      htmlContent: '', // Will be set when rendered
      compiledAt: new Date(),
      metadata: template.metadata
    };

    await this.set(cacheKey, cachedTemplate, ttl);
    return cacheKey;
  }

  /**
   * Cache compiled HTML template
   */
  async cacheCompiledTemplate(
    mjmlTemplate: MjmlTemplate, 
    emailTemplate: EmailTemplate, 
    ttl?: number
  ): Promise<string> {
    const cacheKey = this.generateCompiledCacheKey(mjmlTemplate, emailTemplate);
    
    const cachedTemplate: CachedTemplate = {
      key: cacheKey,
      mjmlContent: mjmlTemplate.mjmlContent,
      htmlContent: emailTemplate.htmlContent,
      compiledAt: new Date(),
      metadata: mjmlTemplate.metadata
    };

    await this.set(cacheKey, cachedTemplate, ttl);
    return cacheKey;
  }

  /**
   * Get cached MJML template
   */
  async getCachedMjmlTemplate(cacheKey: string): Promise<MjmlTemplate | null> {
    const cached = await this.get(cacheKey);
    if (!cached) return null;

    try {
      return MjmlTemplate.fromData({
        id: cached.metadata.templateId,
        name: `cached-${cached.metadata.templateId}`,
        mjmlContent: cached.mjmlContent,
        metadata: cached.metadata,
        createdAt: cached.compiledAt
      });
    } catch (error) {
      console.warn('Failed to recreate MJML template from cache:', error);
      return null;
    }
  }

  /**
   * Get cached compiled template
   */
  async getCachedCompiledTemplate(cacheKey: string): Promise<{
    mjmlTemplate: MjmlTemplate;
    emailTemplate: EmailTemplate;
  } | null> {
    const cached = await this.get(cacheKey);
    if (!cached || !cached.htmlContent) return null;

    try {
      const mjmlTemplate = MjmlTemplate.fromData({
        id: cached.metadata.templateId,
        name: `cached-${cached.metadata.templateId}`,
        mjmlContent: cached.mjmlContent,
        metadata: cached.metadata,
        createdAt: cached.compiledAt
      });

      const emailTemplate = EmailTemplate.fromData({
        id: `email-${cached.metadata.templateId}`,
        name: `cached-email-${cached.metadata.templateId}`,
        htmlContent: cached.htmlContent,
        cssContent: '',
        metadata: {
          templateId: `email-${cached.metadata.templateId}`,
          mjmlSourceId: cached.metadata.templateId,
          compiledAt: cached.compiledAt,
          version: cached.metadata.version,
          emailClients: ['gmail', 'outlook', 'apple-mail'],
          optimizations: {
            cssInlined: true,
            imagesOptimized: false,
            darkModeSupported: false,
            mobileOptimized: true,
            compressionApplied: false,
            originalSize: Buffer.byteLength(cached.mjmlContent, 'utf8'),
            optimizedSize: Buffer.byteLength(cached.htmlContent, 'utf8')
          }
        },
        createdAt: cached.compiledAt
      });

      return { mjmlTemplate, emailTemplate };
    } catch (error) {
      console.warn('Failed to recreate templates from cache:', error);
      return null;
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    metrics: CacheMetrics;
    topKeys: Array<{ key: string; hits: number; lastAccessed: Date }>;
    expiryInfo: Array<{ key: string; expiresAt: Date; timeToExpiry: number }>;
  } {
    const topKeys = Array.from(this.cache.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10)
      .map(entry => ({
        key: entry.key,
        hits: entry.hits,
        lastAccessed: entry.lastAccessed
      }));

    const expiryInfo = Array.from(this.cache.values())
      .map(entry => ({
        key: entry.key,
        expiresAt: entry.expiresAt,
        timeToExpiry: Math.max(0, entry.expiresAt.getTime() - Date.now())
      }))
      .sort((a, b) => a.timeToExpiry - b.timeToExpiry)
      .slice(0, 10);

    return {
      metrics: this.getMetrics(),
      topKeys,
      expiryInfo
    };
  }

  /**
   * Warm up cache with commonly used templates
   */
  async warmUp(templates: Array<{ mjmlContent: string; key: string }>): Promise<void> {
    console.log(`🔥 Warming up cache with ${templates.length} templates...`);
    
    const warmUpPromises = templates.map(async ({ mjmlContent, key }) => {
      try {
        const template = MjmlTemplate.create({
          name: `warmup-${key}`,
          mjmlContent,
          layoutType: 'gallery-focused',
          sectionsCount: 1,
          assetsUsed: 0
        });
        
        await this.cacheMjmlTemplate(template, this.options.defaultTTL * 2); // Extended TTL for warmup
      } catch (error) {
        console.warn(`Failed to warm up template ${key}:`, error);
      }
    });

    await Promise.allSettled(warmUpPromises);
    console.log('🔥 Cache warm-up completed');
  }

  // Private helper methods
  private generateMjmlCacheKey(template: MjmlTemplate): string {
    const contentHash = this.generateContentHash(template.mjmlContent);
    return `mjml:${contentHash}:${template.metadata.layoutType}`;
  }

  private generateCompiledCacheKey(mjmlTemplate: MjmlTemplate, emailTemplate: EmailTemplate): string {
    const mjmlHash = this.generateContentHash(mjmlTemplate.mjmlContent);
    const clientsHash = this.generateContentHash(emailTemplate.metadata.emailClients.join(','));
    return `compiled:${mjmlHash}:${clientsHash}`;
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async evictLRU(): Promise<void> {
    // Find least recently used entry
    let lruEntry: CacheEntry | null = null;
    let lruKey: string | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!lruEntry || entry.lastAccessed < lruEntry.lastAccessed) {
        lruEntry = entry;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`🗑️ Evicted LRU cache entry: ${lruKey}`);
    }
  }

  private cleanup(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
      this.updateCacheSize();
    }
  }

  private updateMetrics(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }

  private updateCacheSize(): void {
    this.metrics.cacheSize = this.cache.size;
    
    // Estimate memory usage
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += Buffer.byteLength(entry.data.mjmlContent, 'utf8');
      totalSize += Buffer.byteLength(entry.data.htmlContent || '', 'utf8');
      totalSize += 200; // Estimated overhead per entry
    }
    
    this.metrics.memoryUsageMB = totalSize / (1024 * 1024);
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsageMB: 0
    };
  }
}

// Global cache instance
export const globalTemplateCache = new TemplateCacheService({
  maxSize: 500,
  defaultTTL: 3600, // 1 hour
  enableMetrics: true
}); 