import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CacheService } from '../cache/cache-service';

export interface ConnectionPoolConfig {
  max: number;
  idle_timeout: number;
  connect_timeout: number;
  prepare: boolean;
  ssl?: boolean;
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  cached: boolean;
  rowCount?: number;
}

export class DatabaseOptimizationService {
  private queryMetrics: QueryMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Create optimized database connection with connection pooling
   */
  static createOptimizedConnection(
    connectionString: string,
    config: Partial<ConnectionPoolConfig> = {}
  ) {
    const defaultConfig: ConnectionPoolConfig = {
      max: 20, // Maximum pool size
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Timeout for new connections
      prepare: false, // Disable prepared statements for better performance with pooling
      ssl: process.env.NODE_ENV === 'production',
    };

    const finalConfig = { ...defaultConfig, ...config };

    const sql = postgres(connectionString, finalConfig);
    
    return drizzle(sql);
  }

  /**
   * Execute query with performance tracking
   */
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    queryIdentifier: string,
    cacheKey?: string,
    cacheTTL: number = 300 // 5 minutes default
  ): Promise<T> {
    const startTime = Date.now();
    let cached = false;
    let result: T;

    // Try cache first if cache key provided
    if (cacheKey) {
      const cachedResult = await this.cacheService.get<T>(cacheKey);
      if (cachedResult !== null) {
        cached = true;
        result = cachedResult;
        
        this.recordQueryMetrics({
          query: queryIdentifier,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          cached: true,
        });
        
        return result;
      }
    }

    try {
      // Execute query
      result = await queryFn();
      
      // Cache result if cache key provided
      if (cacheKey && !cached) {
        await this.cacheService.set(cacheKey, result, cacheTTL);
      }
      
      this.recordQueryMetrics({
        query: queryIdentifier,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        cached: false,
        ...(Array.isArray(result) ? { rowCount: result.length } : {}),
      });
      
      return result;
    } catch (error) {
      this.recordQueryMetrics({
        query: queryIdentifier,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        cached: false,
      });
      
      throw error;
    }
  }

  /**
   * Create optimized pagination helper
   */
  createPaginationHelper<T>(
    baseQuery: (limit: number, offset: number) => Promise<T[]>,
    countQuery: () => Promise<number>,
    cacheKeyPrefix: string
  ) {
    return async (page: number = 1, pageSize: number = 20) => {
      const offset = (page - 1) * pageSize;
      const cacheKey = `${cacheKeyPrefix}:page:${page}:size:${pageSize}`;
      const countCacheKey = `${cacheKeyPrefix}:count`;

      // Get total count (cached)
      const total = await this.executeQuery(
        countQuery,
        `${cacheKeyPrefix}_count`,
        countCacheKey,
        600 // Cache count for 10 minutes
      );

      // Get paginated results (cached)
      const items = await this.executeQuery(
        () => baseQuery(pageSize, offset),
        `${cacheKeyPrefix}_page_${page}`,
        cacheKey,
        300 // Cache pages for 5 minutes
      );

      return {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page * pageSize < total,
          hasPrev: page > 1,
        },
      };
    };
  }

  /**
   * Batch query execution for better performance
   */
  async executeBatch<T>(
    queries: Array<{
      queryFn: () => Promise<T>;
      identifier: string;
      cacheKey?: string;
      cacheTTL?: number;
    }>
  ): Promise<T[]> {
    const promises = queries.map(({ queryFn, identifier, cacheKey, cacheTTL }) =>
      this.executeQuery(queryFn, identifier, cacheKey, cacheTTL)
    );

    return Promise.all(promises);
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Maintain maximum history size
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }

    // Log slow queries
    if (metrics.duration > 1000 && !metrics.cached) { // Queries slower than 1 second
      console.warn(`[SLOW QUERY] ${metrics.query}: ${metrics.duration}ms`);
    }
  }

  /**
   * Get database performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: QueryMetrics[];
    cacheHitRate: number;
    topSlowQueries: Array<{ query: string; avgDuration: number; count: number }>;
  } {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: [],
        cacheHitRate: 0,
        topSlowQueries: [],
      };
    }

    const totalQueries = this.queryMetrics.length;
    const cachedQueries = this.queryMetrics.filter(m => m.cached).length;
    const nonCachedQueries = this.queryMetrics.filter(m => !m.cached);
    const slowQueries = this.queryMetrics.filter(m => m.duration > 1000 && !m.cached);

    // Calculate average query time for non-cached queries
    const averageQueryTime = nonCachedQueries.length > 0
      ? nonCachedQueries.reduce((sum, m) => sum + m.duration, 0) / nonCachedQueries.length
      : 0;

    // Calculate cache hit rate
    const cacheHitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0;

    // Get top slow queries
    const queryGroups = nonCachedQueries.reduce((groups, metric) => {
      if (!groups[metric.query]) {
        groups[metric.query] = { totalDuration: 0, count: 0 };
      }
      groups[metric.query]!.totalDuration += metric.duration;
      groups[metric.query]!.count += 1;
      return groups;
    }, {} as Record<string, { totalDuration: number; count: number }>);

    const topSlowQueries = (Object || {}).entries(queryGroups)
      .map(([query, stats]) => ({
        query,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => (b || {}).avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      cacheHitRate,
      topSlowQueries,
    };
  }

  /**
   * Clear query metrics (useful for testing)
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Create optimized query builder with automatic caching
   */
  createOptimizedQueryBuilder<T>(
    queryBuilder: any,
    cacheKeyPrefix: string,
    defaultCacheTTL: number = 300
  ) {
    return {
      /**
       * Execute select query with automatic caching
       */
      select: async (cacheKey?: string, cacheTTL?: number): Promise<T[]> => {
        const finalCacheKey = cacheKey || `${cacheKeyPrefix}:select:${JSON.stringify(queryBuilder)}`;
        const finalCacheTTL = cacheTTL || defaultCacheTTL;

        return this.executeQuery(
          () => queryBuilder.execute(),
          `${cacheKeyPrefix}_select`,
          finalCacheKey,
          finalCacheTTL
        );
      },

      /**
       * Execute select with pagination
       */
      selectPaginated: async (
        page: number = 1,
        pageSize: number = 20,
        cacheKey?: string,
        cacheTTL?: number
      ) => {
        const offset = (page - 1) * pageSize;
        const finalCacheKey = cacheKey || `${cacheKeyPrefix}:paginated:${page}:${pageSize}`;
        const finalCacheTTL = cacheTTL || defaultCacheTTL;

        const items = await this.executeQuery(
          () => queryBuilder.limit(pageSize).offset(offset).execute(),
          `${cacheKeyPrefix}_paginated`,
          finalCacheKey,
          finalCacheTTL
        );

        // Get total count (cached separately)
        const total = await this.executeQuery(
          () => queryBuilder.count(),
          `${cacheKeyPrefix}_count`,
          `${cacheKeyPrefix}:count`,
          600 // Cache count for 10 minutes
        );

        return {
          items,
          pagination: {
            page,
            pageSize,
            total: Number(total),
            totalPages: Math.ceil(Number(total) / pageSize),
            hasNext: page * pageSize < Number(total),
            hasPrev: page > 1,
          },
        };
      },
    };
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern: string): Promise<void> {
    // Implement pattern-based cache invalidation
    // For now, we'll clear the entire cache if pattern matching is not available
    try {
      // Try to use deletePattern if available
      if (typeof (this.cacheService as any).deletePattern === 'function') {
        await (this.cacheService as any).deletePattern(pattern);
      } else {
        // Fallback: clear entire cache
        await this.cacheService.clear();
      }
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(warmUpQueries: Array<{
    queryFn: () => Promise<any>;
    cacheKey: string;
    cacheTTL?: number;
  }>): Promise<void> {
    console.log('Warming up cache...');
    
    const promises = warmUpQueries.map(async ({ queryFn, cacheKey, cacheTTL = 300 }) => {
      try {
        const result = await queryFn();
        await this.cacheService.set(cacheKey, result, cacheTTL);
      } catch (error) {
        console.error(`Failed to warm up cache for ${cacheKey}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`Cache warmed up with ${warmUpQueries.length} queries`);
  }
}

// Export singleton instance
export const databaseOptimization = new DatabaseOptimizationService(
  new CacheService()
); 