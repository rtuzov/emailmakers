/**
 * Cache Manager - Интеллектуальное кэширование долгих операций
 * Оптимизирует производительность агента через стратегическое кэширование
 * 
 * Consolidated with cache.ts for unified cache management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { getConfig } from './config';
import { createClient, RedisClientType } from 'redis';

// ============================================================================
// SIMPLE CACHE SERVICE INTERFACE (from cache.ts)
// ============================================================================

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class InMemoryCache implements CacheService {
  private store = new Map<string, { value: any; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    this.store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisCache implements CacheService {
  private client: RedisClientType;
  constructor(url: string) {
    this.client = createClient({ url });
    this.client.connect().catch(console.error);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data as string) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

let simpleCacheInstance: CacheService;

export function getCache(): CacheService {
  if (simpleCacheInstance) return simpleCacheInstance;
  const cfg = getConfig();
  if (cfg.redisUrl) {
    simpleCacheInstance = new RedisCache(cfg.redisUrl);
  } else {
    simpleCacheInstance = new InMemoryCache();
  }
  return simpleCacheInstance;
}

// ============================================================================
// ADVANCED CACHE MANAGER (original cache-manager.ts functionality)
// ============================================================================

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // time to live в миллисекундах
  metadata: {
    operation: string;
    version: string;
    size: number;
    hitCount: number;
    lastAccessed: Date;
  };
}

export interface CacheConfig {
  maxSize: number; // максимальный размер кэша в MB
  defaultTtl: number; // TTL по умолчанию в минутах
  enablePersistence: boolean; // сохранять на диск
  enableCompression: boolean; // сжимать данные
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // в байтах
  hitRate: number;
  missRate: number;
  oldestEntry: Date;
  newestEntry: Date;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private config: CacheConfig;
  private cacheDir: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100, // 100MB по умолчанию
      defaultTtl: 60, // 1 час по умолчанию
      enablePersistence: true,
      enableCompression: false,
      ...config
    };
    
    this.cacheDir = path.join(process.cwd(), '.cache', 'agent');
    this.initializeCache();
  }

  /**
   * Инициализация кэша
   */
  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      if (this.config.enablePersistence) {
        await this.loadPersistedCache();
      }
      
      // Запуск фонового процесса очистки
      this.startCleanupScheduler();
      
      console.log('🗄️ CacheManager initialized');
    } catch (error) {
      console.warn('⚠️ CacheManager initialization failed:', error);
    }
  }

  /**
   * Получение данных из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Проверка TTL
    const now = Date.now();
    const entryAge = now - entry.timestamp.getTime();
    
    if (entryAge > entry.ttl) {
      console.log(`🗄️ Cache expired for key: ${key}`);
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }
    
    // Обновление статистики
    entry.metadata.hitCount++;
    entry.metadata.lastAccessed = new Date();
    this.stats.hits++;
    
    console.log(`🎯 Cache hit for: ${key} (hits: ${entry.metadata.hitCount})`);
    return entry.data as T;
  }

  /**
   * Сохранение данных в кэш
   */
  async set<T>(
    key: string, 
    data: T, 
    ttlMinutes?: number,
    metadata: Partial<CacheEntry['metadata']> = {}
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const ttl = (ttlMinutes || this.config.defaultTtl) * 60 * 1000;
    const dataSize = this.calculateDataSize(data);
    
    // Проверка размера кэша
    await this.ensureCacheSpace(dataSize);
    
    const entry: CacheEntry<T> = {
      key: cacheKey,
      data,
      timestamp: new Date(),
      ttl,
      metadata: {
        operation: metadata.operation || 'unknown',
        version: metadata.version || '1.0',
        size: dataSize,
        hitCount: 0,
        lastAccessed: new Date(),
        ...metadata
      }
    };
    
    this.cache.set(cacheKey, entry);
    
    console.log(`💾 Cached ${key} (${this.formatBytes(dataSize)}, TTL: ${ttlMinutes || this.config.defaultTtl}m)`);
    
    // Асинхронное сохранение на диск
    if (this.config.enablePersistence) {
      this.persistEntry(entry).catch(console.warn);
    }
  }

  /**
   * Кэширование с функцией-поставщиком данных
   */
  async getOrSet<T>(
    key: string,
    supplier: () => Promise<T>,
    ttlMinutes?: number,
    metadata?: Partial<CacheEntry['metadata']>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    console.log(`🔄 Cache miss for ${key}, executing supplier...`);
    const startTime = Date.now();
    
    try {
      const data = await supplier();
      const duration = Date.now() - startTime;
      
      await this.set(key, data, ttlMinutes, {
        ...metadata,
        operation: metadata?.operation || 'supplier',
        version: metadata?.version || '1.0'
      });
      
      console.log(`✅ Supplier executed for ${key} in ${duration}ms`);
      return data;
      
    } catch (error) {
      console.error(`❌ Supplier failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Специализированные методы кэширования для инструментов
   */

  /**
   * Кэширование цен
   */
  async cachePrices(
    origin: string,
    destination: string,
    dateRange: string,
    supplier: () => Promise<any>
  ): Promise<any> {
    const key = `prices:${origin}:${destination}:${dateRange}`;
    return this.getOrSet(key, supplier, 30, { // 30 минут TTL
      operation: 'get_prices',
      version: '2.0'
    });
  }

  /**
   * Кэширование Figma ассетов
   */
  async cacheFigmaAssets(
    tags: string[],
    context: any,
    supplier: () => Promise<any>
  ): Promise<any> {
    const contextHash = this.hashObject({ tags, context });
    const key = `figma:${contextHash}`;
    
    return this.getOrSet(key, supplier, 120, { // 2 часа TTL
      operation: 'get_figma_assets',
      version: '3.0'
    });
  }

  /**
   * Кэширование контента
   */
  async cacheContent(
    topic: string,
    prices: any,
    assets: any,
    supplier: () => Promise<any>
  ): Promise<any> {
    const contentHash = this.hashObject({ topic, prices, assets });
    const key = `content:${contentHash}`;
    
    return this.getOrSet(key, supplier, 60, { // 1 час TTL
      operation: 'generate_copy',
      version: '4.0'
    });
  }

  /**
   * Получение статистики кэша
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : 
        new Date(),
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : 
        new Date()
    };
  }

  /**
   * Очистка истекших записей
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const entryAge = now - entry.timestamp.getTime();
      if (entryAge > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired entries`);
    }
    
    return removedCount;
  }

  /**
   * Полная очистка кэша
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    
    if (this.config.enablePersistence) {
      try {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
        await fs.mkdir(this.cacheDir, { recursive: true });
      } catch (error) {
        console.warn('⚠️ Failed to clear persistent cache:', error);
      }
    }
    
    console.log('🧹 Cache cleared completely');
  }

  /**
   * Приватные методы
   */

  private generateCacheKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private hashObject(obj: any): string {
    return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length * 2; // Примерный размер в байтах
  }

  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const stats = this.getStats();
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    
    if (stats.totalSize + requiredSize > maxSizeBytes) {
      console.log('🗄️ Cache size limit reached, evicting old entries...');
      await this.evictOldEntries(requiredSize);
    }
  }

  private async evictOldEntries(requiredSize: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.metadata.lastAccessed.getTime() - b.metadata.lastAccessed.getTime());
    
    let freedSize = 0;
    let evictedCount = 0;
    
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      this.cache.delete(key);
      freedSize += entry.metadata.size;
      evictedCount++;
      this.stats.evictions++;
    }
    
    console.log(`🗑️ Evicted ${evictedCount} entries, freed ${this.formatBytes(freedSize)}`);
  }

  private async loadPersistedCache(): Promise<void> {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      const data = await fs.readFile(cacheFile, 'utf-8');
      const persistedEntries: CacheEntry[] = JSON.parse(data);
      
      let loadedCount = 0;
      const now = Date.now();
      
      for (const entry of persistedEntries) {
        // Проверяем TTL при загрузке
        const entryAge = now - new Date(entry.timestamp).getTime();
        if (entryAge < entry.ttl) {
          this.cache.set(entry.key, {
            ...entry,
            timestamp: new Date(entry.timestamp),
            metadata: {
              ...entry.metadata,
              lastAccessed: new Date(entry.metadata.lastAccessed)
            }
          });
          loadedCount++;
        }
      }
      
      console.log(`🗄️ Loaded ${loadedCount} cached entries from disk`);
    } catch (error) {
      // Файл кэша не существует или поврежден - это нормально
      console.log('🗄️ No persistent cache found, starting fresh');
    }
  }

  private async persistEntry(entry: CacheEntry): Promise<void> {
    // Сохраняем весь кэш периодически вместо каждой записи
    // для лучшей производительности
  }

  private startCleanupScheduler(): void {
    // Очистка каждые 15 минут
    setInterval(() => {
      this.cleanup().catch(console.warn);
    }, 15 * 60 * 1000);
    
    // Сохранение на диск каждые 5 минут
    if (this.config.enablePersistence) {
      setInterval(() => {
        this.persistCache().catch(console.warn);
      }, 5 * 60 * 1000);
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      const entries = Array.from(this.cache.values());
      await fs.writeFile(cacheFile, JSON.stringify(entries, null, 2));
      console.log(`💾 Persisted ${entries.length} cache entries to disk`);
    } catch (error) {
      console.warn('⚠️ Failed to persist cache:', error);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager({
  maxSize: 200, // 200MB
  defaultTtl: 120, // 2 часа
  enablePersistence: true,
  enableCompression: false
});