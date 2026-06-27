import { type Request, type Response, type NextFunction } from "express";
import { createClient, type RedisClientType } from "redis";
import { getEnv } from "../config/env";

/**
 * Redis-backed response cache with in-memory fallback.
 *
 * DESIGN NOTE: Uses Redis for distributed caching when REDIS_URL is configured.
 * Falls back to in-memory Map for single-instance deployments.
 *
 * For horizontal scaling (multiple API replicas), Redis is required.
 * In-memory cache only works for single-instance deployments.
 */
interface CacheEntry {
  data: unknown;
  expires: number;
}

class CacheBackend {
  private redis: RedisClientType | null = null;
  private memoryCache = new Map<string, { data: unknown; expires: number }>();
  private useRedis = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  async initialize() {
    const env = getEnv();
    if (env.REDIS_URL) {
      try {
        this.redis = createClient({ url: env.REDIS_URL });
        await this.redis.connect();
        this.useRedis = true;
        console.log("Redis cache connected");
      } catch (err) {
        console.warn(
          "Failed to connect to Redis, falling back to in-memory cache:",
          err,
        );
      }
    }
    this.startCleanup();
  }

  private startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache) {
        if (entry.expires < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60_000).unref();
  }

  async get(key: string): Promise<CacheEntry | null> {
    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
        return null;
      } catch {
        // Fall through to memory cache on Redis error
      }
    }
    const entry = this.memoryCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;
    const entry = { data, expires };

    if (this.useRedis && this.redis) {
      try {
        await this.redis.setEx(
          key,
          ttlSeconds,
          JSON.stringify({ data, expires }),
        );
        return;
      } catch {
        // Fall through to memory cache on Redis error
      }
    }
    this.memoryCache.set(key, entry);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      if (this.useRedis && this.redis) {
        this.redis.flushDb().catch(() => {});
      }
      return;
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    if (this.useRedis && this.redis) {
      this.redis
        .keys(`${pattern}*`)
        .then((keys: string[]) => {
          if (keys.length) this.redis!.del(...keys);
        })
        .catch(() => {});
    }
  }

  shutdown(): void {
    if (this.redis) {
      this.redis.quit().catch(() => {});
    }
  }
}

const cacheBackend = new CacheBackend();

export async function initializeCache(): Promise<void> {
  await cacheBackend.initialize();
}

export function shutdownCache(): void {
  cacheBackend.shutdown();
}

function ensureCacheReady(): void {
  // Cache is lazily initialized on first use
  // but we can ensure it's ready if needed
}

function buildCacheKey(req: Request): string {
  const baseKey = `${req.path}:${JSON.stringify(req.query)}`;
  const authUser = (req as Request & { authUser?: { userId: string; orgId?: string } }).authUser;
  if (authUser?.orgId) {
    return `org=${authUser.orgId}:${baseKey}`;
  }
  if (authUser?.userId) {
    return `user=${authUser.userId}:${baseKey}`;
  }
  return baseKey;
}

export function responseCache(ttlSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = buildCacheKey(req);
    const entry = await cacheBackend.get(key);

    if (entry && entry.expires > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = ((data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheBackend.set(key, data, ttlSeconds);
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    }) as typeof res.json;
    next();
  };
}

export function responseCacheNoRenew(ttlSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = buildCacheKey(req);
    const entry = await cacheBackend.get(key);

    if (entry && entry.expires > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = ((data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheBackend.get(key).then((existing) => {
          if (!existing) {
            cacheBackend.set(key, data, ttlSeconds);
          }
        });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    }) as typeof res.json;
    next();
  };
}

export function invalidateCache(pattern?: string): void {
  cacheBackend.invalidate(pattern);
}
