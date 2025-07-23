import { MetricsService } from '../monitoring/metrics-service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  strategy?: 'lru' | 'lfu'; // Cache eviction strategy
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Multi-level cache service with Redis and local caching
 * Implements LRU/LFU eviction strategies for optimal performance
 */
export class CacheService {
  private localCache = new Map<string, CacheEntry<any>>();
  private maxLocalSize = 1000;
  private defaultTTL = 3600; // 1 hour
  private strategy: 'lru' | 'lfu' = 'lru';

  constructor(
    private redisClient?: any, // Redis client (optional for local-only mode)
    private metricsService?: MetricsService,
    private _options: CacheOptions = {} // Used in constructor
  ) {
    this.maxLocalSize = this._options.maxSize || 1000;
    this.defaultTTL = this._options.ttl || 3600;
    this.strategy = this._options.strategy || 'lru';

    // Start cleanup interval for expired entries
    setInterval(() => this.cleanupExpired(), 60000); // Every minute
  }

  /**
   * Get value from cache (checks local first, then Redis)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Try local cache first
      const localValue = this.getFromLocal<T>(key);
      if (localValue !== null) {
        this.metricsService?.incrementCounter('cache.local.hit');
        this.metricsService?.recordDuration('cache.lookup.duration', Date.now() - startTime);
        return localValue;
      }

      // Try Redis cache if available
      if (this.redisClient) {
        const redisValue = await this.getFromRedis<T>(key);
        if (redisValue !== null) {
          // Store in local cache for faster future access
          this.setToLocal(key, redisValue, this.defaultTTL);
          this.metricsService?.incrementCounter('cache.redis.hit');
          this.metricsService?.recordDuration('cache.lookup.duration', Date.now() - startTime);
          return redisValue;
        }
      }

      this.metricsService?.incrementCounter('cache.miss');
      this.metricsService?.recordDuration('cache.lookup.duration', Date.now() - startTime);
      return null;

    } catch (error) {
      this.metricsService?.incrementCounter('cache.error');
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache (stores in both local and Redis)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTTL = ttl || this.defaultTTL;
    
    try {
      // Store in local cache
      this.setToLocal(key, value, effectiveTTL);

      // Store in Redis if available
      if (this.redisClient) {
        await this.setToRedis(key, value, effectiveTTL);
      }

      this.metricsService?.incrementCounter('cache.set');
    } catch (error) {
      this.metricsService?.incrementCounter('cache.error');
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from local cache
      this.localCache.delete(key);

      // Delete from Redis if available
      if (this.redisClient) {
        await this.redisClient.del(key);
      }

      this.metricsService?.incrementCounter('cache.delete');
    } catch (error) {
      this.metricsService?.incrementCounter('cache.error');
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear local cache
      this.localCache.clear();

      // Clear Redis if available
      if (this.redisClient) {
        await this.redisClient.flushall();
      }

      this.metricsService?.incrementCounter('cache.clear');
    } catch (error) {
      this.metricsService?.incrementCounter('cache.error');
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    localSize: number;
    maxLocalSize: number;
    strategy: string;
    hitRate?: number;
  } {
    return {
      localSize: this.localCache.size,
      maxLocalSize: this.maxLocalSize,
      strategy: this.strategy,
      // Hit rate would be calculated from metrics if available
    };
  }

  /**
   * Get value from local cache
   */
  private getFromLocal<T>(key: string): T | null {
    const entry = this.localCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.localCache.delete(key);
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set value in local cache with eviction if needed
   */
  private setToLocal<T>(key: string, value: T, ttl: number): void {
    // Check if we need to evict entries
    if (this.localCache.size >= this.maxLocalSize) {
      this.evictEntries();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.localCache.set(key, entry);
  }

  /**
   * Get value from Redis
   */
  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in Redis
   */
  private async setToRedis<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redisClient.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(): void {
    const evictCount = Math.floor(this.maxLocalSize * 0.1); // Evict 10%
    
    if (this.strategy === 'lru') {
      this.evictLRU(evictCount);
    } else {
      this.evictLFU(evictCount);
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(count: number): void {
    const entries = Array.from(this.localCache.entries())
      .sort(([, a], [, b]) => (a?.lastAccessed || 0) - (b?.lastAccessed || 0));

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const entry = entries[i];
      if (entry) {
        this.localCache.delete(entry[0]);
      }
    }
  }

  /**
   * Evict least frequently used entries
   */
  private evictLFU(count: number): void {
    const entries = Array.from(this.localCache.entries())
      .sort(([, a], [, b]) => (a?.accessCount || 0) - (b?.accessCount || 0));

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const entry = entries[i];
      if (entry) {
        this.localCache.delete(entry[0]);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    // const now = Date.now(); // Currently unused
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.localCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.localCache.delete(key));

    if (expiredKeys.length > 0) {
      this.metricsService?.incrementCounter('cache.expired_cleanup', {
        count: expiredKeys.length.toString()
      });
    }
  }
}

/**
 * Redis Cache Client wrapper
 * Provides Redis-specific caching functionality
 */
export class RedisCacheService {
  constructor(
    private redisClient: any,
    private metricsService?: MetricsService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (value) {
        this.metricsService?.incrementCounter('redis.cache.hit');
        return JSON.parse(value);
      }
      this.metricsService?.incrementCounter('redis.cache.miss');
      return null;
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redisClient.setex(key, ttl, serialized);
      this.metricsService?.incrementCounter('redis.cache.set');
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.metricsService?.incrementCounter('redis.cache.delete');
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redisClient.expire(key, ttl);
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.metricsService?.incrementCounter('redis.cache.error');
      return -1;
    }
  }
}

/**
 * Cache factory for creating cache instances
 */
export class CacheFactory {
  static createLocalCache(options: CacheOptions = {}): CacheService {
    return new CacheService(undefined, undefined, options);
  }

  static createRedisCache(
    redisClient: any,
    metricsService?: MetricsService,
    options: CacheOptions = {}
  ): CacheService {
    return new CacheService(redisClient, metricsService, options);
  }

  static createHybridCache(
    redisClient: any,
    metricsService?: MetricsService,
    options: CacheOptions = {}
  ): CacheService {
    return new CacheService(redisClient, metricsService, options);
  }
} 