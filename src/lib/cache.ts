import Redis from 'ioredis'

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
})

// Cache keys
export const CACHE_KEYS = {
  FLIGHT_PRICES: (route: string, date: string) => `flight:${route}:${date}`,
  CONTENT_GENERATION: (brief: string, tone: string) => `content:${Buffer.from(brief).toString('base64').slice(0, 20)}:${tone}`,
  FIGMA_ASSETS: (fileKey: string) => `figma:${fileKey}`,
  POPULAR_ROUTES: 'popular:routes',
  AGENT_RESULTS: (hash: string) => `agent:${hash}`,
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  FLIGHT_PRICES: 3600, // 1 hour
  CONTENT_GENERATION: 86400, // 24 hours
  FIGMA_ASSETS: 7200, // 2 hours
  POPULAR_ROUTES: 300, // 5 minutes
  AGENT_RESULTS: 1800, // 30 minutes
} as const

export class CacheService {
  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('❌ Cache get error:', error)
      return null
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(key: string, data: any, ttl: number): Promise<boolean> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('❌ Cache set error:', error)
      return false
    }
  }

  /**
   * Delete cached data
   */
  static async delete(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('❌ Cache delete error:', error)
      return false
    }
  }

  /**
   * Cache flight prices for popular routes
   */
  static async cacheFlightPrices(route: string, date: string, prices: any[]): Promise<void> {
    const key = CACHE_KEYS.FLIGHT_PRICES(route, date)
    await this.set(key, prices, CACHE_TTL.FLIGHT_PRICES)
    
    // Update popular routes counter
    await this.incrementPopularRoute(route)
  }

  /**
   * Get cached flight prices
   */
  static async getCachedFlightPrices(route: string, date: string): Promise<any[] | null> {
    const key = CACHE_KEYS.FLIGHT_PRICES(route, date)
    return await this.get(key)
  }

  /**
   * Cache content generation results
   */
  static async cacheContentGeneration(brief: string, tone: string, content: any): Promise<void> {
    const key = CACHE_KEYS.CONTENT_GENERATION(brief, tone)
    await this.set(key, content, CACHE_TTL.CONTENT_GENERATION)
  }

  /**
   * Get cached content generation
   */
  static async getCachedContentGeneration(brief: string, tone: string): Promise<any | null> {
    const key = CACHE_KEYS.CONTENT_GENERATION(brief, tone)
    return await this.get(key)
  }

  /**
   * Cache Figma assets
   */
  static async cacheFigmaAssets(fileKey: string, assets: any): Promise<void> {
    const key = CACHE_KEYS.FIGMA_ASSETS(fileKey)
    await this.set(key, assets, CACHE_TTL.FIGMA_ASSETS)
  }

  /**
   * Get cached Figma assets
   */
  static async getCachedFigmaAssets(fileKey: string): Promise<any | null> {
    const key = CACHE_KEYS.FIGMA_ASSETS(fileKey)
    return await this.get(key)
  }

  /**
   * Increment popular route counter
   */
  static async incrementPopularRoute(route: string): Promise<void> {
    try {
      await redis.zincrby(CACHE_KEYS.POPULAR_ROUTES, 1, route)
      await redis.expire(CACHE_KEYS.POPULAR_ROUTES, CACHE_TTL.POPULAR_ROUTES)
    } catch (error) {
      console.error('❌ Popular route increment error:', error)
    }
  }

  /**
   * Get most popular routes
   */
  static async getPopularRoutes(limit: number = 10): Promise<string[]> {
    try {
      return await redis.zrevrange(CACHE_KEYS.POPULAR_ROUTES, 0, limit - 1)
    } catch (error) {
      console.error('❌ Get popular routes error:', error)
      return []
    }
  }

  /**
   * Cache agent generation results
   */
  static async cacheAgentResult(requestHash: string, result: any): Promise<void> {
    const key = CACHE_KEYS.AGENT_RESULTS(requestHash)
    await this.set(key, result, CACHE_TTL.AGENT_RESULTS)
  }

  /**
   * Get cached agent result
   */
  static async getCachedAgentResult(requestHash: string): Promise<any | null> {
    const key = CACHE_KEYS.AGENT_RESULTS(requestHash)
    return await this.get(key)
  }

  /**
   * Generate hash for caching agent requests
   */
  static generateRequestHash(data: any): string {
    const crypto = require('crypto')
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  }

  /**
   * Health check for Redis connection
   */
  static async healthCheck(): Promise<{ status: 'pass' | 'fail', message: string, duration?: number }> {
    const start = Date.now()
    try {
      await redis.ping()
      const duration = Date.now() - start
      return {
        status: 'pass',
        message: 'Redis connectivity OK',
        duration
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Redis connection failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    popularRoutes: string[]
    cacheHits: number
    totalKeys: number
  }> {
    try {
      const popularRoutes = await this.getPopularRoutes(5)
      const info = await redis.info('stats')
      const cacheHits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0')
      const totalKeys = await redis.dbsize()

      return {
        popularRoutes,
        cacheHits,
        totalKeys
      }
    } catch (error) {
      console.error('❌ Cache stats error:', error)
      return {
        popularRoutes: [],
        cacheHits: 0,
        totalKeys: 0
      }
    }
  }
}

export default CacheService 