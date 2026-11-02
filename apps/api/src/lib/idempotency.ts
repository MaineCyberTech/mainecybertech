import Redis from "ioredis";
import { getEnv, resolveRedisUrl } from "../config/env";
import { logger } from "./logger";
import { recordIdempotencyKeyHit, recordRedisFailure } from "./metrics";

let redisClient: Redis | null = null;
let memoryMutex: Promise<void> | null = null;

function acquireMemoryLock(): Promise<void> {
  if (!memoryMutex) {
    memoryMutex = Promise.resolve();
  }
  const prev = memoryMutex;
  memoryMutex = new Promise<void>((resolve) => {
    prev.then(() => resolve());
  });
  return memoryMutex;
}

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    const env = getEnv();
    if (env.REDIS_URL || env.REDIS_PASSWORD) {
      const url = resolveRedisUrl(env.REDIS_URL ?? "redis://redis:6379", env.REDIS_PASSWORD);
      try {
        redisClient = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });
        redisClient.on("error", (err: Error) =>
          logger.error({ error: String(err) }, "Redis client error"),
        );
        redisClient
          .connect()
          .catch((err: Error) =>
            logger.warn(
              { error: String(err) },
              "Redis connection failed, idempotency will use in-memory fallback",
            ),
          );
      } catch (err: unknown) {
        logger.warn({ error: String(err) }, "Failed to initialize Redis client");
      }
    }
  }
  return redisClient;
}

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_MAX_ENTRIES = 10_000;
const IN_MEMORY_FALLBACK = new Map<string, { value: string; expiresAt: number }>();

function evictInMemoryIfNeeded(): void {
  if (IN_MEMORY_FALLBACK.size >= IDEMPOTENCY_MAX_ENTRIES) {
    const oldest = IN_MEMORY_FALLBACK.keys().next();
    if (!oldest.done) {
      IN_MEMORY_FALLBACK.delete(oldest.value);
    }
  }
}

export async function checkIdempotencyKey(key: string): Promise<string | null> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      const value = await redis.get(prefixedKey);
      if (value) return value;
    } catch (err: unknown) {
      // ARCH-P2-005: meter the in-memory fallback so the degradation is
      // alertable (portal_redis_failures_total), not just a warn log.
      recordRedisFailure("idempotency", "get");
      logger.warn(
        { error: String(err) },
        "Redis checkIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  await acquireMemoryLock();
  try {
    const entry = IN_MEMORY_FALLBACK.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) {
      IN_MEMORY_FALLBACK.delete(key);
    }
    return null;
  } finally {
    // lock is released by the promise chain
  }
}

/**
 * Atomically claims an idempotency key (Redis SET NX EX, or in-memory mutex
 * fallback). Returns true only for the first caller — subsequent concurrent
 * callers receive false. Prevents check-then-store races in webhook handlers.
 */
export async function claimIdempotencyKey(
  key: string,
  value = "claimed",
  ttlSeconds: number = IDEMPOTENCY_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      const result = await redis.set(prefixedKey, value, "EX", ttlSeconds, "NX");
      if (result !== "OK") recordIdempotencyKeyHit();
      return result === "OK";
    } catch (err: unknown) {
      recordRedisFailure("idempotency", "claim");
      logger.warn(
        { error: String(err) },
        "Redis claimIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  await acquireMemoryLock();
  try {
    const entry = IN_MEMORY_FALLBACK.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      recordIdempotencyKeyHit();
      return false;
    }
    evictInMemoryIfNeeded();
    IN_MEMORY_FALLBACK.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  } finally {
    // lock is released by the promise chain
  }
}

/**
 * Store a completed value for a key. WH-P3-010: the TTL is caller-selectable so
 * a provider with a longer replay window (M365/Graph, 7 days) can keep the
 * claim for its whole window instead of being cut to the 24h default — the
 * delivery-log row it mirrors lives for the table's retention window.
 */
export async function storeIdempotencyKey(
  key: string,
  value: string,
  ttlSeconds: number = IDEMPOTENCY_TTL_SECONDS,
): Promise<void> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      await redis.setex(prefixedKey, ttlSeconds, value);
      return;
    } catch (err: unknown) {
      recordRedisFailure("idempotency", "store");
      logger.warn(
        { error: String(err) },
        "Redis storeIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  await acquireMemoryLock();
  try {
    evictInMemoryIfNeeded();
    IN_MEMORY_FALLBACK.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  } finally {
    // lock is released by the promise chain
  }
}

export async function deleteIdempotencyKey(key: string): Promise<void> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      await redis.del(prefixedKey);
      return;
    } catch (err: unknown) {
      recordRedisFailure("idempotency", "delete");
      logger.warn({ error: String(err) }, "Redis deleteIdempotencyKey failed");
    }
  }

  await acquireMemoryLock();
  try {
    IN_MEMORY_FALLBACK.delete(key);
  } finally {
    // lock is released by the promise chain
  }
}

/**
 * NOTIF-P3-007: atomically increment a counter key (Redis INCR + EXPIRE, or
 * the in-memory fallback) and return the post-increment value. Used by the
 * per-recipient email throttle; unlike `claimIdempotencyKey` it never rejects
 * the call, the caller compares the returned count against its ceiling.
 */
export async function incrementIdempotencyCounter(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      const count = await redis.incr(prefixedKey);
      if (count === 1) await redis.expire(prefixedKey, ttlSeconds);
      return count;
    } catch (err: unknown) {
      recordRedisFailure("idempotency", "incr");
      logger.warn(
        { error: String(err) },
        "Redis incrementIdempotencyCounter failed, falling back to in-memory",
      );
    }
  }

  await acquireMemoryLock();
  try {
    const now = Date.now();
    const entry = IN_MEMORY_FALLBACK.get(key);
    if (!entry || entry.expiresAt <= now) {
      evictInMemoryIfNeeded();
      IN_MEMORY_FALLBACK.set(key, { value: "1", expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    const next = Number(entry.value) + 1;
    entry.value = String(Number.isFinite(next) ? next : 1);
    return Number(entry.value);
  } finally {
    // lock is released by the promise chain
  }
}
