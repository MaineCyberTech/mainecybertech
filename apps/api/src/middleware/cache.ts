import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";
import Redis from "ioredis";
import { getEnv, resolveRedisUrl } from "../config/env";
import { recordRedisFailure } from "../lib/metrics";

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

const MAX_MEMORY_ENTRIES = 5_000;

class CacheBackend {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { data: unknown; expires: number }>();
  private useRedis = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  async initialize() {
    const env = getEnv();
    if (env.REDIS_URL || env.REDIS_PASSWORD) {
      try {
        this.redis = new Redis(
          resolveRedisUrl(env.REDIS_URL ?? "redis://redis:6379", env.REDIS_PASSWORD),
          {
            // Bounded reconnect: a few quick retries during startup, then fail
            // fast into the in-memory fallback instead of hanging boot.
            retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
          },
        );
        this.redis.on("error", () => {}); // errors surface via the metered fallback paths
        await this.redis.ping();
        this.useRedis = true;
        const { logger } = await import("../lib/logger");
        logger.info("Redis cache connected");
      } catch (err) {
        const { logger } = await import("../lib/logger");
        // ARCH-P2-005: a silent fallback to the in-memory cache is exactly the
        // degradation the audit flagged; meter it.
        recordRedisFailure("cache", "connect");
        logger.warn({ err }, "Failed to connect to Redis, falling back to in-memory cache");
        this.redis?.disconnect();
        this.redis = null;
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
      while (this.memoryCache.size > MAX_MEMORY_ENTRIES) {
        const oldest = this.memoryCache.keys().next();
        if (oldest.done) break;
        this.memoryCache.delete(oldest.value);
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
        // Fall through to memory cache on Redis error (ARCH-P2-005: metered).
        recordRedisFailure("cache", "get");
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
        await this.redis.setex(key, ttlSeconds, JSON.stringify({ data, expires }));
        return;
      } catch {
        // Fall through to memory cache on Redis error (ARCH-P2-005: metered).
        recordRedisFailure("cache", "set");
      }
    }
    this.memoryCache.set(key, entry);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      if (this.useRedis && this.redis) {
        this.redis.flushdb().catch(() => {
          recordRedisFailure("cache", "flush");
        });
      }
      return;
    }

    for (const key of [...this.memoryCache.keys()]) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    if (this.useRedis && this.redis) {
      // SCAN instead of KEYS: KEYS blocks the server for the whole keyspace.
      const redis = this.redis;
      void (async () => {
        try {
          const stream = redis.scanStream({ match: `${pattern}*`, count: 100 });
          for await (const keys of stream) {
            const batch = (keys as string[]).map(String);
            if (batch.length) await redis.del(...batch);
          }
        } catch {
          // Best-effort invalidation; TTL will evict eventually.
          // ARCH-P2-005: meter the lost invalidation so stale entries are visible.
          recordRedisFailure("cache", "invalidate");
        }
      })();
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

/**
 * Tenant visibility a cached response was computed under.
 *
 * Structurally matches `AdminTenantScope` (lib/admin-scope.ts), so scope-aware
 * routes can pass `resolveAdminTenantScope` directly as the resolver.
 */
export interface CacheScope {
  /** True when the response covers every tenant. */
  allTenants: boolean;
  /** Organizations the response is restricted to when `allTenants` is false. */
  orgIds: string[];
}

export type CacheScopeResolver = (req: Request) => CacheScope | Promise<CacheScope>;

export interface ResponseCacheOptions {
  /**
   * Resolves the tenant scope the handler computes its response from.
   *
   * Scope-dependent routes (those calling `resolveAdminTenantScope`) MUST pass
   * this: the key otherwise encodes only `req.orgId`, so an all-tenant response
   * written for a platform admin would be served to a single-org member sharing
   * that org (MT-P1-004 / CHAIN-P1-006).
   */
  scope?: CacheScopeResolver;
  /**
   * Include the authenticated user id in the key even when an org is resolved.
   * Use this for responses that vary by per-user visibility (private
   * documents, client-visible drafts, etc.). Org-only routes keep sharing
   * entries between members of the same org.
   */
  userScoped?: boolean;
}

/**
 * Fingerprint of the resolved tenant visibility, folded into the cache key so
 * an all-tenant entry can never satisfy an org-scoped request (and vice versa).
 * Hashed to keep Redis keys bounded for callers with many memberships.
 */
function scopeFingerprint(scope: CacheScope): string {
  const payload = JSON.stringify({
    allTenants: scope.allTenants,
    orgIds: [...scope.orgIds].sort(),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/**
 * Build the cache key for a request, or `null` when the caller's tenant scope
 * could not be resolved (the caller must then bypass the shared cache).
 */
async function buildCacheKey(
  req: Request,
  options: ResponseCacheOptions,
): Promise<string | null> {
  // req.path is router-relative inside mounted routers (e.g. "/" for both
  // /api/v1/roles and /api/v1/organizations) — baseUrl + path yields the
  // full mount path so cache keys never collide across routers.
  const fullPath = `${req.baseUrl ?? ""}${req.path}`;
  let key = `${fullPath}:${JSON.stringify(req.query)}`;
  // Scope keys with a SUFFIX so invalidateCache(path) can match by prefix.
  // (Previously the scope was a prefix, so invalidateCache("/api/v1/x") never
  // matched an authenticated key and mutations never evicted cached lists.)
  // Routes whose response varies by per-user visibility (private documents,
  // client-visible drafts) opt into a user suffix even when an org is
  // resolved. Org-only routes keep sharing entries between members.
  const orgId = (req as Request & { orgId?: string | null }).orgId;
  const authUser = (req as Request & { authUser?: { userId: string } }).authUser;
  if (options.userScoped && authUser?.userId) key += `:user=${authUser.userId}`;
  if (orgId) {
    key += `:org=${orgId}`;
  } else if (!options.userScoped && authUser?.userId) {
    key += `:user=${authUser.userId}`;
  }

  if (options.scope) {
    let fingerprint: string;
    try {
      fingerprint = scopeFingerprint(await options.scope(req));
    } catch {
      // Fail closed: without a resolved scope the entry cannot be proven safe
      // to reuse, so the request bypasses the shared cache entirely.
      return null;
    }
    key += `:scope=${fingerprint}`;
  }

  return key;
}

export function responseCache(ttlSeconds = 60, options: ResponseCacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = await buildCacheKey(req, options);
    if (key === null) {
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

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

export function responseCacheNoRenew(ttlSeconds = 60, options: ResponseCacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = await buildCacheKey(req, options);
    if (key === null) {
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

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
