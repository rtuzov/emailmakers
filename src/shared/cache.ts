import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;
if (redisUrl) {
  redis = new Redis(redisUrl, { lazyConnect: true });
}

// fallback in-memory Map for dev / tests
const memoryCache = new Map<string, string>();

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (redis) {
    try {
      if (!redis.status || redis.status === 'end') await redis.connect();
      const val = await redis.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (err) {
      console.warn('cacheGet redis error', err);
    }
  }
  const inMem = memoryCache.get(key);
  return inMem ? (JSON.parse(inMem) as T) : null;
}

export async function cacheSet<T = unknown>(key: string, value: T, ttlSec = 3600): Promise<void> {
  const str = JSON.stringify(value);
  if (redis) {
    try {
      if (!redis.status || redis.status === 'end') await redis.connect();
      await redis.set(key, str, 'EX', ttlSec);
      return;
    } catch (err) {
      console.warn('cacheSet redis error', err);
    }
  }
  memoryCache.set(key, str);
  // simple TTL for in-memory
  setTimeout(() => memoryCache.delete(key), ttlSec * 1000).unref();
} 