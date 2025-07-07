/**
 * 🚀 AGENT-SPECIFIC CACHE SYSTEM
 * 
 * Enhanced caching for agent operations with TTL management and type safety
 * Optimized for Figma assets, pricing data, and content templates
 */

import { cacheGet, cacheSet } from '../cache';

export interface CachedResult<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
}

/**
 * Agent-specific cache with TTL management and type safety
 */
export class AgentCache {
  private memoryCache = new Map<string, CachedResult>();
  private defaultTTL = 300; // 5 minutes default

  constructor(private options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 300;
  }

  /**
   * 🔍 Get cached data or execute factory function
   */
  async get<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const fullKey = this.buildKey(key);
    const cacheTTL = ttl || this.defaultTTL;

    // Check memory cache first
    const memoryResult = this.memoryCache.get(fullKey);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data as T;
    }

    // Check Redis/persistent cache
    try {
      const cachedData = await cacheGet<CachedResult<T>>(fullKey);
      if (cachedData && !this.isExpired(cachedData)) {
        // Update memory cache
        this.memoryCache.set(fullKey, cachedData);
        return cachedData.data;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
    }

    // Execute factory and cache result
    const result = await factory();
    const cachedResult: CachedResult<T> = {
      data: result,
      timestamp: Date.now(),
      ttl: cacheTTL
    };

    // Store in both caches
    this.memoryCache.set(fullKey, cachedResult);
    try {
      await cacheSet(fullKey, cachedResult, cacheTTL);
    } catch (error) {
      console.warn('Cache set error:', error);
    }

    return result;
  }

  /**
   * 📝 Set cached data directly
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const cacheTTL = ttl || this.defaultTTL;
    
    const cachedResult: CachedResult<T> = {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL
    };

    this.memoryCache.set(fullKey, cachedResult);
    try {
      await cacheSet(fullKey, cachedResult, cacheTTL);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * 🗑️ Delete cached data
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    this.memoryCache.delete(fullKey);
    // Note: Redis delete would require additional implementation
  }

  /**
   * 🧹 Clear all cached data
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    // Note: Redis clear would require additional implementation
  }

  /**
   * 📊 Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }

  /**
   * 🔧 Build cache key with prefix
   */
  private buildKey(key: string): string {
    const prefix = this.options.prefix || 'agent';
    return `${prefix}:${key}`;
  }

  /**
   * ⏰ Check if cached data is expired
   */
  private isExpired(cached: CachedResult): boolean {
    const now = Date.now();
    const expiresAt = cached.timestamp + (cached.ttl * 1000);
    return now > expiresAt;
  }
}

/**
 * 🎯 Specialized cache instances for different agent types
 */
export class FigmaAssetsCache extends AgentCache {
  constructor() {
    super({ prefix: 'figma', ttl: 600 }); // 10 minutes for assets
  }

  async getAssets(tags: string[]): Promise<any[]> {
    const key = `assets:${tags.sort().join(',')}`;
    return this.get(key, async () => {
      // This would be replaced with actual Figma API call
      console.log('🎨 Fetching Figma assets for tags:', tags);
      return [];
    });
  }
}

export class PricingCache extends AgentCache {
  constructor() {
    super({ prefix: 'pricing', ttl: 180 }); // 3 minutes for pricing
  }

  async getPricing(origin: string, destination: string): Promise<any> {
    const key = `route:${origin}-${destination}`;
    return this.get(key, async () => {
      // This would be replaced with actual pricing API call
      console.log('💰 Fetching pricing for route:', origin, '->', destination);
      return { price: 0, currency: 'RUB' };
    });
  }
}

export class ContentTemplateCache extends AgentCache {
  constructor() {
    super({ prefix: 'content', ttl: 1800 }); // 30 minutes for templates
  }

  async getTemplate(type: string, language: string): Promise<any> {
    const key = `template:${type}:${language}`;
    return this.get(key, async () => {
      // This would be replaced with actual template loading
      console.log('📝 Loading content template:', type, language);
      return { template: '', variables: [] };
    });
  }
}

// Export singleton instances
export const figmaCache = new FigmaAssetsCache();
export const pricingCache = new PricingCache();
export const contentCache = new ContentTemplateCache();
export const generalCache = new AgentCache(); 