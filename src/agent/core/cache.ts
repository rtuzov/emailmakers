import { getConfig } from './config';
import { createClient, RedisClientType } from 'redis';

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

let instance: CacheService;

export function getCache(): CacheService {
  if (instance) return instance;
  const cfg = getConfig();
  if (cfg.redisUrl) {
    instance = new RedisCache(cfg.redisUrl);
  } else {
    instance = new InMemoryCache();
  }
  return instance;
} 